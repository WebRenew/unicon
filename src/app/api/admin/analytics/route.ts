import { NextRequest, NextResponse } from "next/server";
import { getSearchStats } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { requireAdminAuth } from "@/lib/auth/admin";

/**
 * Get search analytics statistics
 * GET /api/admin/analytics?days=7
 */
export async function GET(request: NextRequest) {
  const authErrorResponse = requireAdminAuth(request);
  if (authErrorResponse) {
    return authErrorResponse;
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7", 10);

  try {
    const stats = await getSearchStats(days);

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    logger.error("Failed to get analytics:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}
