import { NextRequest, NextResponse } from "next/server";
import { searchIcons, getIconsByNames } from "@/lib/queries";
import { db } from "@/lib/db";
import { getEmbedding, embeddingToVectorString, expandQueryWithAI, generateSearchCacheKey, getCachedSearchResults, setCachedSearchResults } from "@/lib/ai";
import { sql } from "drizzle-orm";
import type { IconData } from "@/types/icon";
import { logger } from "@/lib/logger";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const queryParam = searchParams.get("q");
  const sourceParam = searchParams.get("source");
  const categoryParam = searchParams.get("category");
  const namesParam = searchParams.get("names"); // Comma-separated list of exact names
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const useAI = searchParams.get("ai") !== "false"; // AI search enabled by default

  try {
    // If names parameter is provided, fetch icons by exact name match
    if (namesParam) {
      const names = namesParam.split(",").map((n) => n.trim()).filter(Boolean);
      const icons = await getIconsByNames(names);
      
      return NextResponse.json(
        { icons, hasMore: false, searchType: "exact" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }
    // If there's a search query, use AI-powered semantic search
    if (queryParam && queryParam.trim().length >= 3 && useAI) {
      const aiResults = await aiSemanticSearch(
        queryParam.trim(),
        sourceParam && sourceParam !== "all" ? sourceParam : undefined,
        Math.min(limit, 320),
        offset
      );
      
      return NextResponse.json(
        { 
          icons: aiResults.icons, 
          hasMore: aiResults.icons.length === limit,
          searchType: aiResults.searchType,
          expandedQuery: aiResults.expandedQuery,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // Otherwise use standard text search or browse
    const params: {
      query?: string;
      sourceId?: string;
      category?: string;
      limit: number;
      offset: number;
    } = {
      limit: Math.min(limit, 320),
      offset,
    };

    if (queryParam) params.query = queryParam;
    if (sourceParam && sourceParam !== "all") params.sourceId = sourceParam;
    if (categoryParam && categoryParam !== "all") params.category = categoryParam;

    const icons = await searchIcons(params);

    return NextResponse.json(
      { icons, hasMore: icons.length === limit, searchType: "text" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    logger.error("Error fetching icons:", error);
    return NextResponse.json({ error: "Failed to fetch icons" }, { status: 500 });
  }
}

/** Timeout helper for async operations */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * AI-powered semantic search using Claude for query expansion and Turso's native vector search.
 * Uses parallel execution for AI expansion and embedding to minimize latency.
 * Results are cached for 60 seconds to reduce API costs and improve performance.
 */
async function aiSemanticSearch(
  query: string,
  sourceId: string | undefined,
  limit: number,
  offset: number
): Promise<{ icons: IconData[]; searchType: string; expandedQuery?: string }> {
  // Check cache first
  const cacheKey = generateSearchCacheKey({
    query,
    ...(sourceId ? { sourceId } : {}),
    limit,
    offset,
  });
  const cached = getCachedSearchResults<{ icons: IconData[]; searchType: string; expandedQuery?: string }>(cacheKey);
  if (cached) {
    logger.log(`Cache hit for search: "${query}"`);
    return cached;
  }
  // Start AI expansion and original embedding in parallel for faster response
  const aiExpansionPromise = process.env.ANTHROPIC_API_KEY
    ? withTimeout(
        expandQueryWithAI(query).catch((error) => {
          logger.error("AI expansion failed:", error);
          return null;
        }),
        2000, // 2 second timeout for AI expansion
        null
      )
    : Promise.resolve(null);

  const originalEmbeddingPromise = getEmbedding(query).catch(() => null);

  // Wait for AI expansion (with timeout) to determine final search query
  const [expandedQuery, originalEmbedding] = await Promise.all([
    aiExpansionPromise,
    originalEmbeddingPromise,
  ]);

  // Get embedding for the final search query
  // If AI expansion succeeded, we need a new embedding; otherwise use the original
  let queryEmbedding: number[];
  try {
    if (expandedQuery && expandedQuery !== query) {
      // AI expansion succeeded, get embedding for expanded query
      queryEmbedding = await getEmbedding(expandedQuery);
      logger.log(`AI expanded "${query}" to: ${expandedQuery}`);
    } else if (originalEmbedding) {
      // Use the pre-fetched original embedding
      queryEmbedding = originalEmbedding;
    } else {
      // Both failed, fall back to text search
      throw new Error("Embedding generation failed");
    }
  } catch {
    // Fall back to text search if embedding fails
    const searchParams: { query: string; sourceId?: string; limit: number; offset: number } = {
      query,
      limit,
      offset
    };
    if (sourceId) searchParams.sourceId = sourceId;
    const textResults = await searchIcons(searchParams);
    return { icons: textResults, searchType: "text" };
  }

  // Convert embedding to Turso vector format
  const vectorString = embeddingToVectorString(queryEmbedding);

  // Use Turso's native vector_distance_cos for database-level similarity search
  // Apply LIMIT and OFFSET at the database level for efficient pagination
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
        LIMIT ${limit} OFFSET ${offset}
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
        LIMIT ${limit} OFFSET ${offset}
      `)) as VectorSearchRow[];

  // Convert to IconData
  const icons: IconData[] = semanticResults.map((row) => {
    let tags: string[];
    try {
      tags = typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags ?? []);
    } catch {
      logger.error(`Failed to parse tags for icon ${row.id}`);
      tags = [];
    }

    let pathData;
    try {
      pathData = typeof row.pathData === "string" ? JSON.parse(row.pathData) : (row.pathData ?? null);
    } catch {
      logger.error(`Failed to parse pathData for icon ${row.id}`);
      pathData = null;
    }

    return {
      id: row.id as string,
      name: row.name as string,
      normalizedName: row.normalizedName as string,
      sourceId: row.sourceId as string,
      category: row.category as string | null,
      tags: tags as string[],
      viewBox: row.viewBox as string,
      content: row.content as string,
      pathData,
      defaultStroke: Boolean(row.defaultStroke),
      defaultFill: Boolean(row.defaultFill),
      strokeWidth: row.strokeWidth as string | null,
      brandColor: row.brandColor as string | null,
    };
  });

  const result: { icons: IconData[]; searchType: string; expandedQuery?: string } = {
    icons,
    searchType: "semantic",
  };

  if (expandedQuery) {
    result.expandedQuery = expandedQuery;
  }

  // Cache the result
  setCachedSearchResults(cacheKey, result);

  return result;
}
