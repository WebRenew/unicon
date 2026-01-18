import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { icons } from "@/lib/schema";
import { getEmbeddings, embeddingToBlob } from "@/lib/ai";
import { sql, isNull } from "drizzle-orm";

const BATCH_SIZE = 100;
const MAX_BATCHES_PER_REQUEST = 10; // Process up to 1000 icons per request

/**
 * POST /api/admin/generate-embeddings
 * 
 * Generate embeddings for icons that don't have them.
 * Protected by admin secret in production.
 * 
 * Query params:
 *   - source: Filter by source (lucide, phosphor, hugeicons)
 *   - batchSize: Number of icons per batch (default: 100)
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
    const sourceId = searchParams.get("source");
    const batchSize = Math.min(
      parseInt(searchParams.get("batchSize") || String(BATCH_SIZE), 10),
      500
    );

    let totalProcessed = 0;
    let batchesProcessed = 0;

    while (batchesProcessed < MAX_BATCHES_PER_REQUEST) {
      // Get icons without embeddings
      const iconsToProcess = await getIconsWithoutEmbeddings(sourceId, batchSize);

      if (iconsToProcess.length === 0) {
        break;
      }

      // Build search texts
      const searchTexts = iconsToProcess.map(buildSearchText);

      // Generate embeddings
      const embeddings = await getEmbeddings(searchTexts);

      // Store in database
      for (let i = 0; i < iconsToProcess.length; i++) {
        const icon = iconsToProcess[i];
        const embedding = embeddings[i];
        const searchText = searchTexts[i];

        if (!icon || !embedding || !searchText) continue;

        const blob = embeddingToBlob(embedding);

        await db
          .update(icons)
          .set({
            searchText,
            embedding: blob,
          })
          .where(sql`${icons.id} = ${icon.id}`);
      }

      totalProcessed += iconsToProcess.length;
      batchesProcessed++;
    }

    // Get remaining count
    const remaining = await getRemainingCount(sourceId);

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      remaining,
      complete: remaining === 0,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/generate-embeddings
 * 
 * Get embedding statistics.
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await db
      .select({
        sourceId: icons.sourceId,
        total: sql<number>`count(*)`,
        withEmbedding: sql<number>`sum(case when ${icons.embedding} is not null then 1 else 0 end)`,
      })
      .from(icons)
      .groupBy(icons.sourceId);

    const result = stats.map((s) => ({
      source: s.sourceId,
      total: s.total,
      withEmbedding: s.withEmbedding,
      percentage: s.total > 0 ? Math.round((s.withEmbedding / s.total) * 100) : 0,
    }));

    const totalIcons = result.reduce((sum, s) => sum + s.total, 0);
    const totalWithEmbedding = result.reduce((sum, s) => sum + s.withEmbedding, 0);

    return NextResponse.json({
      sources: result,
      total: totalIcons,
      withEmbedding: totalWithEmbedding,
      percentage: totalIcons > 0 ? Math.round((totalWithEmbedding / totalIcons) * 100) : 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}

async function getIconsWithoutEmbeddings(sourceId: string | null, limit: number) {
  if (sourceId) {
    return db
      .select({
        id: icons.id,
        name: icons.name,
        normalizedName: icons.normalizedName,
        category: icons.category,
        tags: icons.tags,
      })
      .from(icons)
      .where(sql`${icons.embedding} IS NULL AND ${icons.sourceId} = ${sourceId}`)
      .limit(limit);
  }

  return db
    .select({
      id: icons.id,
      name: icons.name,
      normalizedName: icons.normalizedName,
      category: icons.category,
      tags: icons.tags,
    })
    .from(icons)
    .where(isNull(icons.embedding))
    .limit(limit);
}

async function getRemainingCount(sourceId: string | null): Promise<number> {
  const condition = sourceId
    ? sql`${icons.embedding} IS NULL AND ${icons.sourceId} = ${sourceId}`
    : isNull(icons.embedding);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(icons)
    .where(condition);

  return result[0]?.count ?? 0;
}

function buildSearchText(icon: {
  normalizedName: string;
  category: string | null;
  tags: string[] | null;
}): string {
  const parts: string[] = [];

  // Add normalized name (split kebab-case into words)
  const nameWords = icon.normalizedName.replace(/-/g, " ");
  parts.push(nameWords);

  // Add category if present
  if (icon.category) {
    parts.push(icon.category);
  }

  // Add tags
  if (icon.tags) {
    parts.push(...icon.tags);
  }

  // Deduplicate and join
  const unique = [...new Set(parts)];
  return unique.join(" ");
}
