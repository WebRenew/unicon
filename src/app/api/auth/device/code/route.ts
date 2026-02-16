/**
 * POST /api/auth/device/code
 * 
 * OAuth 2.0 Device Authorization - Request a device code
 * RFC 8628: https://datatracker.ietf.org/doc/html/rfc8628
 * 
 * Called by CLI/MCP/Figma to start the device authorization flow.
 * Returns a device_code (secret) and user_code (shown to user).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { checkDeviceCodeRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getTrustedClientIp } from "@/lib/request-ip";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

/** Handle CORS preflight */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const ip = getTrustedClientIp(request);
    const rateLimit = await checkDeviceCodeRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          error_description: "Too many device authorization requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const clientName = body.client_name || "CLI";
    const scope = body.scope || "bundles:read";

    // Validate client name
    if (!["CLI", "MCP", "Figma"].includes(clientName)) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client_name" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // Create device code via RPC
    const { data, error } = await supabase.rpc("create_device_code", {
      p_client_name: clientName,
      p_scope: scope,
    });

    if (error) {
      logger.error("Device code creation error:", error);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "server_error", error_description: "Failed to create device code" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Return standard OAuth 2.0 Device Authorization Response
    return NextResponse.json({
      device_code: result.device_code,
      user_code: result.user_code,
      verification_uri: result.verification_uri,
      verification_uri_complete: `${result.verification_uri}?code=${result.user_code}`,
      expires_in: result.expires_in,
      interval: 5, // Recommended polling interval in seconds
    }, { headers: CORS_HEADERS });
  } catch (err) {
    logger.error("Device code error:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
