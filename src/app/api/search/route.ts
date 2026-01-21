import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { icons } from "@/lib/schema";
import { getEmbedding, embeddingToVectorString, expandQueryWithAI } from "@/lib/ai";
import { expandQueryWithSynonyms, hasSynonyms } from "@/lib/synonyms";
import { sql, eq, or, like, asc } from "drizzle-orm";
import type { IconData } from "@/types/icon";

interface SearchResult extends IconData {
  score: number;
}

/** Row type for vector search results */
interface VectorSearchRow {
  id: string;
  name: string;
  normalizedName: string;
  sourceId: string;
  category: string | null;
  tags: string | string[] | null;
  viewBox: string;
  content: string;
  pathData: string | null;
  defaultStroke: number | boolean | null;
  defaultFill: number | boolean | null;
  strokeWidth: string | null;
  brandColor: string | null;
  distance: number;
}

/** Timeout helper for async operations */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** Scoring weights for hybrid search */
const WEIGHTS = {
  semantic: 0.6,
  exactMatch: 0.4,
} as const;

/** Score boosts for different match types */
const BOOSTS = {
  exactName: 0.5,
  startsWithName: 0.4,
  containsName: 0.3,
  exactTag: 0.25,
  containsTag: 0.15,
  exactCategory: 0.2,
  containsCategory: 0.1,
} as const;


/**
 * POST /api/search
 * 
 * Hybrid semantic + exact match search for icons.
 * Uses pre-computed synonyms for instant query expansion,
 * with optional AI fallback for complex queries.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sourceId, limit = 50, offset = 0, useAI = false } = body as {
      query: string;
      sourceId?: string;
      limit?: number;
      offset?: number;
      useAI?: boolean;
    };

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // For very short queries, use text search
    if (trimmedQuery.length < 3) {
      const results = await textSearch(trimmedQuery, sourceId, limit, offset);
      return NextResponse.json({
        results,
        searchType: "text",
        hasMore: results.length === limit,
      });
    }

    // Try semantic search with synonym expansion
    try {
      // First, expand using pre-computed synonyms (instant, no API call)
      let searchQuery = expandQueryWithSynonyms(trimmedQuery);
      let expandedTerms: string | undefined = searchQuery !== trimmedQuery ? searchQuery : undefined;

      // Only use AI expansion if explicitly requested AND synonyms didn't help
      if (useAI && !hasSynonyms(trimmedQuery) && process.env.ANTHROPIC_API_KEY) {
        try {
          // Use timeout to prevent slow AI calls from blocking response
          const aiExpanded = await withTimeout(
            expandQueryWithAI(trimmedQuery),
            2000, // 2 second timeout
            null as string | null
          );
          if (aiExpanded) {
            searchQuery = aiExpanded;
            expandedTerms = aiExpanded;
            console.log(`AI expanded "${trimmedQuery}" to: ${aiExpanded}`);
          }
        } catch (aiError) {
          console.error("AI expansion failed, using synonym expansion:", aiError);
        }
      }

      const results = await hybridSearch(trimmedQuery, searchQuery, sourceId, limit, offset);
      return NextResponse.json({
        results,
        searchType: "semantic",
        expandedQuery: expandedTerms,
        hasMore: results.length === limit,
      });
    } catch (error) {
      console.error("Semantic search failed, falling back to text:", error);
      const results = await textSearch(trimmedQuery, sourceId, limit, offset);
      return NextResponse.json({
        results,
        searchType: "text",
        fallback: true,
        hasMore: results.length === limit,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

/**
 * Calculate exact match boost for an icon against the original query.
 */
function calculateExactMatchBoost(icon: {
  normalizedName: string;
  name: string;
  tags: string[] | null;
  category: string | null;
}, queryLower: string, queryTokens: string[]): number {
  let boost = 0;
  const nameLower = icon.normalizedName.toLowerCase();
  
  // Name matching
  if (nameLower === queryLower) {
    boost += BOOSTS.exactName;
  } else if (nameLower.startsWith(queryLower)) {
    boost += BOOSTS.startsWithName;
  } else if (nameLower.includes(queryLower)) {
    boost += BOOSTS.containsName;
  }
  
  // Check individual query tokens against name tokens
  const nameTokens = nameLower.split(/[-_\s]+/);
  for (const queryToken of queryTokens) {
    if (nameTokens.includes(queryToken)) {
      boost += 0.1; // Small boost for each matching word
    }
  }
  
  // Tag matching
  if (icon.tags) {
    for (const tag of icon.tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === queryLower) {
        boost += BOOSTS.exactTag;
        break; // Only count once
      } else if (tagLower.includes(queryLower)) {
        boost += BOOSTS.containsTag;
        break;
      }
      // Check tokens
      for (const queryToken of queryTokens) {
        if (tagLower === queryToken || tagLower.includes(queryToken)) {
          boost += 0.05;
        }
      }
    }
  }
  
  // Category matching
  if (icon.category) {
    const categoryLower = icon.category.toLowerCase();
    if (categoryLower === queryLower) {
      boost += BOOSTS.exactCategory;
    } else if (categoryLower.includes(queryLower)) {
      boost += BOOSTS.containsCategory;
    }
  }
  
  return Math.min(boost, 1); // Cap at 1.0
}

/**
 * Perform hybrid search combining semantic similarity with exact match boosting.
 * Uses Turso's native vector_distance_cos for database-level similarity search.
 *
 * @param originalQuery - The user's original query (for exact matching)
 * @param expandedQuery - The synonym-expanded query (for semantic search)
 * @param sourceId - Optional source filter
 * @param limit - Max results to return
 * @param offset - Number of results to skip
 */
async function hybridSearch(
  originalQuery: string,
  expandedQuery: string,
  sourceId: string | undefined,
  limit: number,
  offset: number = 0
): Promise<SearchResult[]> {
  // Get embedding for the expanded query
  const queryEmbedding = await getEmbedding(expandedQuery);
  const vectorString = embeddingToVectorString(queryEmbedding);

  // Prepare query tokens for exact matching
  const queryLower = originalQuery.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  // Use Turso's native vector_distance_cos for database-level similarity search
  // Fetch more than needed to allow for re-ranking with exact match boost
  // We need to fetch enough results to properly rank up to offset + limit
  const fetchLimit = Math.min((offset + limit) * 2, 1000);

  // Query with native vector distance calculation
  // vector_distance_cos returns distance (1 - similarity), so lower is better
  const semanticResults = (sourceId
    ? await db.all(sql`
        SELECT 
          id, name, normalized_name as normalizedName, source_id as sourceId,
          category, tags, view_box as viewBox, content, path_data as pathData,
          default_stroke as defaultStroke, default_fill as defaultFill,
          stroke_width as strokeWidth, brand_color as brandColor,
          vector_distance_cos(embedding, vector32(${vectorString})) as distance
        FROM icons
        WHERE embedding IS NOT NULL AND source_id = ${sourceId}
        ORDER BY distance ASC
        LIMIT ${fetchLimit}
      `)
    : await db.all(sql`
        SELECT 
          id, name, normalized_name as normalizedName, source_id as sourceId,
          category, tags, view_box as viewBox, content, path_data as pathData,
          default_stroke as defaultStroke, default_fill as defaultFill,
          stroke_width as strokeWidth, brand_color as brandColor,
          vector_distance_cos(embedding, vector32(${vectorString})) as distance
        FROM icons
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${fetchLimit}
      `)) as VectorSearchRow[];

  // Re-rank with hybrid scoring (semantic + exact match)
  const scored: SearchResult[] = [];

  for (const row of semanticResults) {
    // Convert distance back to similarity (1 - distance)
    const semanticScore = 1 - (row.distance as number);
    
    // Parse tags from JSON string if needed
    const tags = typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags ?? []);
    const pathData = typeof row.pathData === "string" ? JSON.parse(row.pathData) : (row.pathData ?? null);
    
    // Calculate exact match boost
    const exactMatchBoost = calculateExactMatchBoost(
      {
        normalizedName: row.normalizedName as string,
        name: row.name as string,
        tags: tags as string[] | null,
        category: row.category as string | null,
      },
      queryLower,
      queryTokens
    );
    
    // Combine scores with weights
    const hybridScore = (semanticScore * WEIGHTS.semantic) + (exactMatchBoost * WEIGHTS.exactMatch);

    scored.push({
      id: row.id as string,
      name: row.name as string,
      normalizedName: row.normalizedName as string,
      sourceId: row.sourceId as string,
      category: row.category as string | null,
      tags: tags as string[],
      viewBox: row.viewBox as string,
      content: row.content as string,
      pathData: pathData,
      defaultStroke: Boolean(row.defaultStroke),
      defaultFill: Boolean(row.defaultFill),
      strokeWidth: row.strokeWidth as string | null,
      brandColor: row.brandColor as string | null,
      score: hybridScore,
    });
  }

  // Sort by hybrid score descending, apply offset, and return requested page
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(offset, offset + limit);
}

/**
 * Perform text-based search as fallback.
 */
async function textSearch(
  query: string,
  sourceId: string | undefined,
  limit: number,
  offset: number = 0
): Promise<SearchResult[]> {
  const searchTerm = `%${query.toLowerCase()}%`;

  const conditions = [
    like(sql`lower(${icons.normalizedName})`, searchTerm),
    like(sql`lower(${icons.name})`, searchTerm),
    like(sql`lower(${icons.tags})`, searchTerm),
    like(sql`lower(${icons.category})`, searchTerm),
  ];

  let results;
  if (sourceId) {
    results = await db
      .select()
      .from(icons)
      .where(sql`${eq(icons.sourceId, sourceId)} AND (${or(...conditions)})`)
      .orderBy(asc(icons.normalizedName))
      .limit(limit)
      .offset(offset);
  } else {
    results = await db
      .select()
      .from(icons)
      .where(or(...conditions))
      .orderBy(asc(icons.normalizedName))
      .limit(limit)
      .offset(offset);
  }

  return results.map((icon) => ({
    id: icon.id,
    name: icon.name,
    normalizedName: icon.normalizedName,
    sourceId: icon.sourceId,
    category: icon.category,
    tags: (icon.tags as string[]) ?? [],
    viewBox: icon.viewBox,
    content: icon.content,
    pathData: icon.pathData ?? null,
    defaultStroke: icon.defaultStroke ?? false,
    defaultFill: icon.defaultFill ?? false,
    strokeWidth: icon.strokeWidth,
    brandColor: icon.brandColor ?? null,
    score: 1, // Text matches get score of 1
  }));
}
