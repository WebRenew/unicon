import { db } from "./db";
import { searchAnalytics } from "./schema";
import { sql } from "drizzle-orm";

interface LogSearchParams {
  query: string;
  searchType: "semantic" | "text";
  sourceFilter?: string | undefined;
  resultCount: number;
  cacheHit: boolean;
  responseTimeMs?: number | undefined;
}

/**
 * Log a search query for analytics
 */
export async function logSearch(params: LogSearchParams): Promise<void> {
  try {
    await db.run(sql`
      INSERT INTO search_analytics (query, search_type, source_filter, result_count, cache_hit, response_time_ms, timestamp)
      VALUES (
        ${params.query},
        ${params.searchType},
        ${params.sourceFilter ?? null},
        ${params.resultCount},
        ${params.cacheHit ? 1 : 0},
        ${params.responseTimeMs ?? null},
        ${Date.now()}
      )
    `);
  } catch (error) {
    // Don't fail the request if analytics logging fails
    console.error("Failed to log search analytics:", error);
  }
}

/**
 * Get search analytics statistics
 */
export async function getSearchStats(days = 7) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  try {
    const timestampMs = sinceDate.getTime();

    const stats = await db.all(sql`
      SELECT
        COUNT(*) as total_searches,
        COUNT(DISTINCT query) as unique_queries,
        SUM(CASE WHEN search_type = 'semantic' THEN 1 ELSE 0 END) as semantic_searches,
        SUM(CASE WHEN search_type = 'text' THEN 1 ELSE 0 END) as text_searches,
        SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
        AVG(response_time_ms) as avg_response_time_ms,
        AVG(result_count) as avg_results
      FROM search_analytics
      WHERE timestamp >= ${timestampMs}
    `);

    const popularQueries = await db.all(sql`
      SELECT
        query,
        COUNT(*) as search_count,
        AVG(result_count) as avg_results,
        search_type
      FROM search_analytics
      WHERE timestamp >= ${timestampMs}
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT 20
    `);

    return {
      period: `${days} days`,
      summary: stats[0] || {},
      popularQueries: popularQueries || [],
    };
  } catch (error) {
    console.error("Failed to get search stats:", error);
    return {
      period: `${days} days`,
      summary: {},
      popularQueries: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
