import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { icons } from "@/lib/schema";
import { getEmbedding, blobToEmbedding, cosineSimilarity, expandQueryWithAI } from "@/lib/ai";
import { expandQueryWithSynonyms, hasSynonyms } from "@/lib/synonyms";
import { sql, eq, or, like, asc } from "drizzle-orm";
import type { IconData } from "@/types/icon";

interface SearchResult extends IconData {
  score: number;
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
    const { query, sourceId, limit = 50, useAI = false } = body as {
      query: string;
      sourceId?: string;
      limit?: number;
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
      const results = await textSearch(trimmedQuery, sourceId, limit);
      return NextResponse.json({ results, searchType: "text" });
    }

    // Try semantic search with synonym expansion
    try {
      // First, expand using pre-computed synonyms (instant, no API call)
      let searchQuery = expandQueryWithSynonyms(trimmedQuery);
      let expandedTerms: string | undefined = searchQuery !== trimmedQuery ? searchQuery : undefined;
      
      // Only use AI expansion if explicitly requested AND synonyms didn't help
      if (useAI && !hasSynonyms(trimmedQuery) && process.env.ANTHROPIC_API_KEY) {
        try {
          const aiExpanded = await expandQueryWithAI(trimmedQuery);
          searchQuery = aiExpanded;
          expandedTerms = aiExpanded;
          console.log(`AI expanded "${trimmedQuery}" to: ${aiExpanded}`);
        } catch (aiError) {
          console.error("AI expansion failed, using synonym expansion:", aiError);
        }
      }

      const results = await hybridSearch(trimmedQuery, searchQuery, sourceId, limit);
      return NextResponse.json({ 
        results, 
        searchType: "semantic",
        expandedQuery: expandedTerms,
      });
    } catch (error) {
      console.error("Semantic search failed, falling back to text:", error);
      const results = await textSearch(trimmedQuery, sourceId, limit);
      return NextResponse.json({ results, searchType: "text", fallback: true });
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
 * 
 * @param originalQuery - The user's original query (for exact matching)
 * @param expandedQuery - The synonym-expanded query (for semantic search)
 * @param sourceId - Optional source filter
 * @param limit - Max results to return
 */
async function hybridSearch(
  originalQuery: string,
  expandedQuery: string,
  sourceId: string | undefined,
  limit: number
): Promise<SearchResult[]> {
  // Get embedding for the expanded query
  const queryEmbedding = await getEmbedding(expandedQuery);

  // Prepare query tokens for exact matching
  const queryLower = originalQuery.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  // Get all icons with embeddings
  // TODO: Use libSQL vector_distance_cos when available in Drizzle
  let baseQuery = db
    .select()
    .from(icons)
    .where(sql`${icons.embedding} IS NOT NULL`);

  if (sourceId) {
    baseQuery = db
      .select()
      .from(icons)
      .where(sql`${icons.embedding} IS NOT NULL AND ${icons.sourceId} = ${sourceId}`);
  }

  const allIcons = await baseQuery.limit(5000); // Cap for performance

  // Calculate hybrid scores
  const scored: SearchResult[] = [];

  for (const icon of allIcons) {
    if (!icon.embedding) continue;

    const iconEmbedding = blobToEmbedding(icon.embedding as Buffer);
    const semanticScore = cosineSimilarity(queryEmbedding, iconEmbedding);
    
    // Calculate exact match boost
    const exactMatchBoost = calculateExactMatchBoost(
      {
        normalizedName: icon.normalizedName,
        name: icon.name,
        tags: icon.tags as string[] | null,
        category: icon.category,
      },
      queryLower,
      queryTokens
    );
    
    // Combine scores with weights
    const hybridScore = (semanticScore * WEIGHTS.semantic) + (exactMatchBoost * WEIGHTS.exactMatch);

    scored.push({
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
      score: hybridScore,
    });
  }

  // Sort by score descending and return top results
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Perform text-based search as fallback.
 */
async function textSearch(
  query: string,
  sourceId: string | undefined,
  limit: number
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
      .limit(limit);
  } else {
    results = await db
      .select()
      .from(icons)
      .where(or(...conditions))
      .orderBy(asc(icons.normalizedName))
      .limit(limit);
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
    score: 1, // Text matches get score of 1
  }));
}
