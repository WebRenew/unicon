import { NextRequest, NextResponse } from "next/server";
import { getSearchStats } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { requireAdminAuth } from "@/lib/auth/admin";

const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

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
  const days = parseDaysParam(searchParams.get("days"));
  if (days === null) {
    return NextResponse.json(
      { error: `days must be an integer between ${MIN_DAYS} and ${MAX_DAYS}` },
      { status: 400 }
    );
  }

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

function parseDaysParam(rawDays: string | null): number | null {
  if (rawDays === null) {
    return DEFAULT_DAYS;
  }

  const trimmed = rawDays.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < MIN_DAYS || parsed > MAX_DAYS) {
    return null;
  }

  return parsed;
}
