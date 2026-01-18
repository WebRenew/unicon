import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { icons } from "@/lib/schema";
import { getEmbedding, blobToEmbedding, cosineSimilarity } from "@/lib/ai";
import { sql, eq, or, like, asc } from "drizzle-orm";
import type { IconData } from "@/types/icon";

interface SearchResult extends IconData {
  score: number;
}

/**
 * POST /api/search
 * 
 * Semantic search for icons using AI embeddings.
 * Falls back to text search if query is short or embeddings unavailable.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sourceId, limit = 50 } = body as {
      query: string;
      sourceId?: string;
      limit?: number;
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

    // Try semantic search
    try {
      const results = await semanticSearch(trimmedQuery, sourceId, limit);
      return NextResponse.json({ results, searchType: "semantic" });
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
 * Perform semantic search using embeddings.
 */
async function semanticSearch(
  query: string,
  sourceId: string | undefined,
  limit: number
): Promise<SearchResult[]> {
  // Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Get all icons with embeddings (we'll filter and sort in memory for now)
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

  // Calculate similarity scores
  const scored: SearchResult[] = [];

  for (const icon of allIcons) {
    if (!icon.embedding) continue;

    const iconEmbedding = blobToEmbedding(icon.embedding as Buffer);
    const score = cosineSimilarity(queryEmbedding, iconEmbedding);

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
      score,
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
