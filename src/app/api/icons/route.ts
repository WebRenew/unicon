import { NextRequest, NextResponse } from "next/server";
import { searchIcons, getIconsByNames } from "@/lib/queries";
import { db } from "@/lib/db";
import { getEmbedding, embeddingToVectorString, expandQueryWithAI, generateSearchCacheKey, getCachedSearchResults, setCachedSearchResults } from "@/lib/ai";
import { sql } from "drizzle-orm";
import type { IconData } from "@/types/icon";
import { logger } from "@/lib/logger";
import { logSearch } from "@/lib/analytics";
import { checkPublicRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { waitUntil } from "@vercel/functions";
import { parsePagination, sliceForPagination } from "@/lib/api/pagination";
import { getTrustedClientIp } from "@/lib/request-ip";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

const MAX_LIMIT = 320;

/** Handle CORS preflight */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
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

export async function GET(request: NextRequest) {
  // Rate limit by trusted platform IP only.
  const ip = getTrustedClientIp(request);
  const rateLimit = await checkPublicRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429, headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) } }
    );
  }

  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const queryParam = searchParams.get("q");
  const sourceParam = searchParams.get("source");
  const categoryParam = searchParams.get("category");
  const namesParam = searchParams.get("names"); // Comma-separated list of exact names
  const parsedPagination = parsePagination({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
    defaultLimit: 100,
    maxLimit: MAX_LIMIT,
  });
  if ("error" in parsedPagination) {
    return NextResponse.json(
      { error: parsedPagination.error },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  const { limit, offset } = parsedPagination;
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
            ...CORS_HEADERS,
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
        limit,
        offset
      );

      // Log analytics (fire-and-forget, waitUntil ensures completion after response)
      waitUntil(logSearch({
        query: queryParam.trim(),
        searchType: aiResults.searchType as "semantic" | "text",
        sourceFilter: sourceParam && sourceParam !== "all" ? sourceParam : undefined,
        resultCount: aiResults.icons.length,
        cacheHit: aiResults.cacheHit,
        responseTimeMs: Date.now() - startTime,
      }));

      return NextResponse.json(
        {
          icons: aiResults.icons,
          hasMore: aiResults.hasMore,
          searchType: aiResults.searchType,
          expandedQuery: aiResults.expandedQuery,
        },
        {
          headers: {
            ...CORS_HEADERS,
            // Aggressive caching for popular searches
            // s-maxage=1800 = 30min cache at edge
            // stale-while-revalidate=3600 = serve stale for 1hr while revalidating
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            "Vary": "Accept-Encoding",
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
      limit,
      offset,
    };

    if (queryParam) params.query = queryParam;
    if (sourceParam && sourceParam !== "all") params.sourceId = sourceParam;
    if (categoryParam && categoryParam !== "all") params.category = categoryParam;

    const iconRows = await searchIcons({
      ...params,
      limit: limit + 1,
    });
    const { items: icons, hasMore } = sliceForPagination(iconRows, limit);

    // Log analytics for text search (fire-and-forget, waitUntil ensures completion after response)
    if (queryParam) {
      waitUntil(logSearch({
        query: queryParam,
        searchType: "text",
        sourceFilter: sourceParam && sourceParam !== "all" ? sourceParam : undefined,
        resultCount: icons.length,
        cacheHit: false,
        responseTimeMs: Date.now() - startTime,
      }));
    }

    return NextResponse.json(
      { icons, hasMore, searchType: "text" },
      {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    logger.error("Error fetching icons:", error);
    return NextResponse.json({ error: "Failed to fetch icons" }, { status: 500, headers: CORS_HEADERS });
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
): Promise<{ icons: IconData[]; hasMore: boolean; searchType: string; expandedQuery?: string; cacheHit: boolean }> {
  // Check cache first
  const cacheKey = generateSearchCacheKey({
    query,
    ...(sourceId ? { sourceId } : {}),
    limit,
    offset,
  });
  const cached = getCachedSearchResults<{
    icons: IconData[];
    hasMore?: boolean;
    searchType: string;
    expandedQuery?: string;
  }>(cacheKey);
  if (cached) {
    logger.log(`Cache hit for search: "${query}"`);
    return {
      icons: cached.icons,
      hasMore: cached.hasMore ?? false,
      searchType: cached.searchType,
      ...(cached.expandedQuery ? { expandedQuery: cached.expandedQuery } : {}),
      cacheHit: true,
    };
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
      limit: limit + 1,
      offset
    };
    if (sourceId) searchParams.sourceId = sourceId;
    const textRows = await searchIcons(searchParams);
    const { items: icons, hasMore } = sliceForPagination(textRows, limit);
    return { icons, hasMore, searchType: "text", cacheHit: false };
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
        LIMIT ${limit + 1} OFFSET ${offset}
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
        LIMIT ${limit + 1} OFFSET ${offset}
      `)) as VectorSearchRow[];

  // Convert to IconData
  const iconRows: IconData[] = semanticResults.map((row) => {
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
  const { items: icons, hasMore } = sliceForPagination(iconRows, limit);

  const result: { icons: IconData[]; hasMore: boolean; searchType: string; expandedQuery?: string; cacheHit: boolean } = {
    icons,
    hasMore,
    searchType: "semantic",
    cacheHit: false,
  };

  if (expandedQuery) {
    result.expandedQuery = expandedQuery;
  }

  // Cache the result (without cacheHit flag)
  const cacheData = {
    icons: result.icons,
    hasMore: result.hasMore,
    searchType: result.searchType,
    expandedQuery: result.expandedQuery,
  };
  setCachedSearchResults(cacheKey, cacheData);

  return result;
}
