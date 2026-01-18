import { NextRequest, NextResponse } from "next/server";
import { searchIcons } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const queryParam = searchParams.get("q");
  const sourceParam = searchParams.get("source");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  // Build params object conditionally to satisfy exactOptionalPropertyTypes
  const params: {
    query?: string;
    sourceId?: string;
    limit: number;
    offset: number;
  } = {
    limit: Math.min(limit, 200),
    offset,
  };

  if (queryParam) params.query = queryParam;
  if (sourceParam && sourceParam !== "all") params.sourceId = sourceParam;

  try {
    const icons = await searchIcons(params);

    return NextResponse.json(
      { icons, hasMore: icons.length === limit },
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
