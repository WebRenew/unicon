import { NextRequest, NextResponse } from "next/server";
import { searchIcons } from "@/lib/queries";
import { db } from "@/lib/db";
import { icons as iconsTable } from "@/lib/schema";
import { getEmbedding, blobToEmbedding, cosineSimilarity, expandQueryWithAI } from "@/lib/ai";
import { sql } from "drizzle-orm";
import type { IconData } from "@/types/icon";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const queryParam = searchParams.get("q");
  const sourceParam = searchParams.get("source");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const useAI = searchParams.get("ai") !== "false"; // AI search enabled by default

  try {
    // If there's a search query, use AI-powered semantic search
    if (queryParam && queryParam.trim().length >= 3 && useAI) {
      const aiResults = await aiSemanticSearch(
        queryParam.trim(),
        sourceParam && sourceParam !== "all" ? sourceParam : undefined,
        Math.min(limit, 160),
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
      limit: number;
      offset: number;
    } = {
      limit: Math.min(limit, 160),
      offset,
    };

    if (queryParam) params.query = queryParam;
    if (sourceParam && sourceParam !== "all") params.sourceId = sourceParam;

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
    console.error("Error fetching icons:", error);
    return NextResponse.json({ error: "Failed to fetch icons" }, { status: 500 });
  }
}

/**
 * AI-powered semantic search using Claude for query expansion and embeddings for matching.
 */
async function aiSemanticSearch(
  query: string,
  sourceId: string | undefined,
  limit: number,
  offset: number
): Promise<{ icons: IconData[]; searchType: string; expandedQuery?: string }> {
  let searchQuery = query;
  let expandedQuery: string | undefined;

  // Use Claude to expand the query for better semantic matching
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      expandedQuery = await expandQueryWithAI(query);
      searchQuery = expandedQuery;
      console.log(`AI expanded "${query}" to: ${expandedQuery}`);
    } catch (aiError) {
      console.error("AI expansion failed, using original query:", aiError);
    }
  }

  // Get embedding for the (possibly expanded) query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await getEmbedding(searchQuery);
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

  // Build query for icons with embeddings
  let baseQuery = sourceId
    ? db
        .select()
        .from(iconsTable)
        .where(sql`${iconsTable.embedding} IS NOT NULL AND ${iconsTable.sourceId} = ${sourceId}`)
    : db
        .select()
        .from(iconsTable)
        .where(sql`${iconsTable.embedding} IS NOT NULL`);

  const allIcons = await baseQuery.limit(5000); // Cap for performance

  // Calculate similarity scores
  const scored: Array<{ icon: IconData; score: number }> = [];

  for (const icon of allIcons) {
    if (!icon.embedding) continue;

    const iconEmbedding = blobToEmbedding(icon.embedding as Buffer);
    const score = cosineSimilarity(queryEmbedding, iconEmbedding);

    scored.push({
      icon: {
        id: icon.id,
        name: icon.name,
        normalizedName: icon.normalizedName,
        sourceId: icon.sourceId,
        category: icon.category,
        tags: (icon.tags as string[]) ?? [],
        viewBox: icon.viewBox,
        content: icon.content,
        pathData: null,
        defaultStroke: icon.defaultStroke ?? false,
        defaultFill: icon.defaultFill ?? false,
        strokeWidth: icon.strokeWidth,
      },
      score,
    });
  }

  // Sort by score descending, apply offset/limit
  scored.sort((a, b) => b.score - a.score);
  const paged = scored.slice(offset, offset + limit);

  const result: { icons: IconData[]; searchType: string; expandedQuery?: string } = {
    icons: paged.map((s) => s.icon),
    searchType: "semantic",
  };
  
  if (expandedQuery) {
    result.expandedQuery = expandedQuery;
  }

  return result;
}
