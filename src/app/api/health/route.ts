import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCacheStats } from "@/lib/ai";
import { sql } from "drizzle-orm";

/**
 * GET /api/health
 *
 * Health check endpoint that monitors:
 * - Database connectivity
 * - Database icon count
 * - Embedding coverage
 * - Cache statistics
 * - AI API configuration
 */
interface HealthCheck {
  status: string;
  timestamp: string;
  database: Record<string, unknown>;
  ai: Record<string, unknown>;
  cache: Record<string, unknown>;
}

export async function GET() {
  const checks: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: { status: "unknown" },
    ai: { status: "unknown" },
    cache: { status: "unknown" },
  };

  let overallHealthy = true;

  // Check database connectivity and get stats
  try {
    const iconCount = await db.all(sql`SELECT count(*) as count FROM icons`);
    const embeddingCount = await db.all(sql`
      SELECT count(*) as count
      FROM icons
      WHERE embedding IS NOT NULL
    `);

    const total = (iconCount[0] as Record<string, unknown>)?.count as number ?? 0;
    const withEmbeddings = (embeddingCount[0] as Record<string, unknown>)?.count as number ?? 0;
    const embeddingPercentage = total > 0 ? Math.round((withEmbeddings / total) * 100) : 0;

    checks.database = {
      status: "healthy",
      connected: true,
      icons: {
        total,
        withEmbeddings,
        percentage: embeddingPercentage,
      },
    };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    overallHealthy = false;
  }

  // Check AI API configuration
  try {
    const hasOpenAI = !!process.env.AI_GATEWAY_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    checks.ai = {
      status: hasOpenAI && hasAnthropic ? "healthy" : "degraded",
      openai: {
        configured: hasOpenAI,
        status: hasOpenAI ? "ready" : "missing API key",
      },
      anthropic: {
        configured: hasAnthropic,
        status: hasAnthropic ? "ready" : "missing API key",
      },
    };

    // If neither API is configured, mark as unhealthy
    if (!hasOpenAI && !hasAnthropic) {
      checks.ai.status = "unhealthy";
      overallHealthy = false;
    }
  } catch (error) {
    checks.ai = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    overallHealthy = false;
  }

  // Get cache statistics
  try {
    const cacheStats = getCacheStats();

    checks.cache = {
      status: "healthy",
      stats: {
        searchResults: {
          ...cacheStats.searchResults,
          utilization: Math.round((cacheStats.searchResults.size / cacheStats.searchResults.maxSize) * 100),
        },
        embeddings: {
          ...cacheStats.embeddings,
          utilization: Math.round((cacheStats.embeddings.size / cacheStats.embeddings.maxSize) * 100),
        },
        queryExpansions: {
          ...cacheStats.queryExpansions,
          utilization: Math.round((cacheStats.queryExpansions.size / cacheStats.queryExpansions.maxSize) * 100),
        },
      },
    };
  } catch (error) {
    checks.cache = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    overallHealthy = false;
  }

  checks.status = overallHealthy ? "healthy" : "unhealthy";

  return NextResponse.json(checks, {
    status: overallHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
