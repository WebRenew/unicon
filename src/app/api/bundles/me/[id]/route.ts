/**
 * GET /api/bundles/me/[id]
 * 
 * Get a specific bundle with full icon data for the authenticated user.
 * Used by MCP, CLI, and Figma plugin to fetch bundle contents.
 * 
 * Rate limits:
 * - Free users: 10 requests/minute
 * - Pro users: 100 requests/minute
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBearerToken, validateApiToken } from "@/lib/auth/api-token";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getIconsByIds } from "@/lib/queries";
import {
  generateReactBundle,
  generateSvgBundle,
  generateJsonBundle,
} from "@/lib/icon-converters";
import { normalizeIcons } from "@/lib/icon-utils";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
};

/** Handle CORS preflight */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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

    // Parse query params
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "react") as "react" | "svg" | "json";
    const includeCode = url.searchParams.get("code") !== "false";
    const strokeWidth = parseFloat(url.searchParams.get("strokeWidth") || "2");

    // Fetch the bundle
    const supabase = createAdminClient();
    
    const { data: bundle, error } = await supabase
      .from("bundles")
      .select("*")
      .eq("id", id)
      .eq("user_id", validation.userId)
      .single();

    if (error || !bundle) {
      return NextResponse.json(
        { error: "not_found", message: "Bundle not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Get icon IDs from the bundle
    const iconIds = (bundle.icons as Array<{ id: string }>)?.map(i => i.id) || [];

    if (iconIds.length === 0) {
      return NextResponse.json({
        bundle: {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          icon_count: 0,
          icons: [],
        },
        code: includeCode ? "// Empty bundle - no icons" : undefined,
      }, { headers: CORS_HEADERS });
    }

    // Fetch full icon data
    const icons = await getIconsByIds(iconIds);

    // Apply normalization if bundle has it configured
    const normalizedIcons = bundle.normalize_strokes
      ? normalizeIcons(icons, { 
          strokeWidth: bundle.target_stroke_width || strokeWidth,
          skipFillIcons: true,
        })
      : icons;

    // Generate code if requested
    let code: string | undefined;
    if (includeCode) {
      const effectiveStrokeWidth = bundle.target_stroke_width || strokeWidth;
      
      switch (format) {
        case "react":
          code = generateReactBundle(normalizedIcons, { strokeWidth: effectiveStrokeWidth });
          break;
        case "svg":
          code = generateSvgBundle(normalizedIcons, { strokeWidth: effectiveStrokeWidth });
          break;
        case "json":
          code = generateJsonBundle(normalizedIcons);
          break;
      }
    }

    return NextResponse.json(
      {
        bundle: {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          icon_count: icons.length,
          stroke_preset: bundle.stroke_preset,
          normalize_strokes: bundle.normalize_strokes,
          target_stroke_width: bundle.target_stroke_width,
          icons: icons.map(icon => ({
            id: icon.id,
            name: icon.name,
            normalizedName: icon.normalizedName,
            source: icon.sourceId,
          })),
        },
        format,
        code,
      },
      {
        headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) },
      }
    );
  } catch (err) {
    console.error("GET /api/bundles/me/[id] error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
