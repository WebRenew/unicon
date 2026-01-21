import { NextRequest, NextResponse } from "next/server";
import { getEmbedding, embeddingToVectorString, setCachedSearchResults, generateSearchCacheKey } from "@/lib/ai";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { IconData } from "@/types/icon";
import { logger } from "@/lib/logger";

/**
 * Popular search queries to pre-warm the cache.
 * These are common icon searches that benefit most from caching.
 */
const POPULAR_QUERIES = [
  "home",
  "user",
  "settings",
  "search",
  "notification",
  "menu",
  "close",
  "check",
  "arrow",
  "heart",
  "star",
  "upload",
  "download",
  "edit",
  "delete",
  "calendar",
  "mail",
  "phone",
  "location",
  "lock",
];

/**
 * POST /api/admin/warm-cache
 *
 * Pre-populate the search cache with popular queries.
 * Protected by admin secret in production.
 *
 * Query params:
 *   - queries: Comma-separated list of custom queries (optional)
 */
export async function POST(request: NextRequest) {
  // Verify admin secret in production
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const customQueries = searchParams.get("queries");

    // Use custom queries if provided, otherwise use popular queries
    const queries = customQueries
      ? customQueries.split(",").map(q => q.trim()).filter(Boolean)
      : POPULAR_QUERIES;

    logger.log(`Warming cache for ${queries.length} queries...`);

    const results: Array<{ query: string; cached: boolean; error?: string }> = [];
    const limit = 50; // Cache first 50 results for each query
    const offset = 0;

    for (const query of queries) {
      try {
        // Generate embedding for the query
        const embedding = await getEmbedding(query);
        const vectorString = embeddingToVectorString(embedding);

        // Fetch results from database (same logic as aiSemanticSearch)
        const semanticResults = await db.all(sql`
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
        `);

        // Convert to IconData format
        const icons: IconData[] = (semanticResults as Array<Record<string, unknown>>).map((row) => {
          let tags: string[];
          try {
            tags = typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags ?? []);
          } catch {
            tags = [];
          }

          let pathData;
          try {
            pathData = typeof row.pathData === "string" ? JSON.parse(row.pathData) : (row.pathData ?? null);
          } catch {
            pathData = null;
          }

          return {
            id: row.id as string,
            name: row.name as string,
            normalizedName: row.normalizedName as string,
            sourceId: row.sourceId as string,
            category: row.category as string | null,
            tags,
            viewBox: row.viewBox as string,
            content: row.content as string,
            pathData,
            defaultStroke: Boolean(row.defaultStroke),
            defaultFill: Boolean(row.defaultFill),
            strokeWidth: row.strokeWidth as string | null,
            brandColor: row.brandColor as string | null,
          };
        });

        // Cache the results
        const cacheKey = generateSearchCacheKey({ query, limit, offset });
        setCachedSearchResults(cacheKey, {
          icons,
          searchType: "semantic",
        });

        results.push({ query, cached: true });
        logger.log(`Cached ${icons.length} results for query: "${query}"`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({ query, cached: false, error: errorMessage });
        logger.error(`Failed to cache query "${query}":`, error);
      }
    }

    const successCount = results.filter(r => r.cached).length;
    const failCount = results.filter(r => !r.cached).length;

    return NextResponse.json({
      success: true,
      cached: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    logger.error("Cache warming error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache warming failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/warm-cache
 *
 * Get list of popular queries that will be cached.
 */
export async function GET() {
  return NextResponse.json({
    popularQueries: POPULAR_QUERIES,
    count: POPULAR_QUERIES.length,
  });
}
