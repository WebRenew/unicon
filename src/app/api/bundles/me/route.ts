/**
 * GET /api/bundles/me
 * 
 * List all bundles for the authenticated user (via API token).
 * Used by MCP and CLI to fetch user's saved bundles.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, validateApiToken } from "@/lib/auth/api-token";

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
        { status: 401 }
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
        { status: 401 }
      );
    }

    if (!validation.isPro) {
      return NextResponse.json(
        { 
          error: "pro_required", 
          message: "API access requires a Pro subscription. Upgrade at https://unicon.sh/pricing" 
        },
        { status: 403 }
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      bundles: bundles || [],
      total: bundles?.length || 0,
    });
  } catch (err) {
    console.error("GET /api/bundles/me error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
