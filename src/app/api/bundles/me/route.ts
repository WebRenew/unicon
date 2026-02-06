/**
 * GET /api/bundles/me
 * 
 * List all bundles for the authenticated user (via API token).
 * Used by MCP, CLI, and Figma plugin to fetch user's saved bundles.
 * 
 * Rate limits:
 * - Free users: 10 requests/minute
 * - Pro users: 100 requests/minute
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, validateApiToken } from "@/lib/auth/api-token";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
};

/** Handle CORS preflight */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    // Extract and validate token
    const token = extractBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        { 
          error: "unauthorized", 
          message: "Missing Authorization header. Use 'unicon login' to authenticate." 
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const validation = await validateApiToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: "invalid_token", 
          message: validation.error === "invalid_token" 
            ? "Invalid or expired token. Use 'unicon login' to re-authenticate."
            : `Token validation failed: ${validation.error}` 
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Check rate limit (different limits for free vs Pro)
    const rateLimit = await checkRateLimit(validation.userId!, validation.isPro ?? false);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "rate_limit_exceeded", 
          message: validation.isPro 
            ? "Rate limit exceeded. Please wait before making more requests."
            : "Rate limit exceeded. Upgrade to Pro for higher limits: https://unicon.sh/pricing"
        },
        { 
          status: 429,
          headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) },
        }
      );
    }

    // Fetch user's bundles using admin client
    const supabase = createAdminClient();
    
    const { data: bundles, error } = await supabase
      .from("bundles")
      .select("id, name, description, icon_count, is_public, share_slug, created_at, updated_at")
      .eq("user_id", validation.userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Bundles fetch error:", error);
      return NextResponse.json(
        { error: "server_error", message: "Failed to fetch bundles" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        bundles: bundles || [],
        total: bundles?.length || 0,
      },
      {
        headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) },
      }
    );
  } catch (err) {
    console.error("GET /api/bundles/me error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
