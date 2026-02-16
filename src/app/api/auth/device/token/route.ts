/**
 * POST /api/auth/device/token
 * 
 * OAuth 2.0 Device Authorization - Poll for token
 * RFC 8628: https://datatracker.ietf.org/doc/html/rfc8628
 * 
 * Called by CLI/MCP/Figma to poll for the access token after user authorizes.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { checkDeviceTokenRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
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
    const rateLimit = await checkDeviceTokenRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          error_description: "Too many token polling requests. Please slow down and retry.",
        },
        {
          status: 429,
          headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimit) },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const deviceCode = body.device_code;
    const grantType = body.grant_type;

    // Validate grant type
    if (grantType !== "urn:ietf:params:oauth:grant-type:device_code") {
      return NextResponse.json(
        { error: "unsupported_grant_type" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate device code presence
    if (!deviceCode) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "device_code is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // Check device code status via RPC
    const { data, error } = await supabase.rpc("check_device_code", {
      p_device_code: deviceCode,
    });

    if (error) {
      logger.error("Device code check error:", error);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid device code" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Handle different statuses
    switch (result.status) {
      case "authorized":
        // Success! Return the tokens
        return NextResponse.json({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          token_type: "Bearer",
          scope: "bundles:read",
        }, { headers: CORS_HEADERS });

      case "pending":
        // Still waiting for user authorization - return 400 with authorization_pending
        return NextResponse.json(
          { 
            error: "authorization_pending",
            error_description: "The user has not yet authorized this device",
            expires_in: result.expires_in,
          },
          { status: 400, headers: CORS_HEADERS }
        );

      case "error":
        if (result.error === "slow_down") {
          return NextResponse.json(
            {
              error: "slow_down",
              error_description: "Polling too quickly. Increase your polling interval by 5 seconds.",
              expires_in: result.expires_in,
            },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        if (result.error === "expired_token") {
          return NextResponse.json(
            { error: "expired_token", error_description: "The device code has expired" },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        if (result.error === "access_denied") {
          return NextResponse.json(
            { error: "access_denied", error_description: "The user denied the authorization request" },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        if (result.error === "invalid_grant") {
          return NextResponse.json(
            { error: "invalid_grant", error_description: "Invalid device code" },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        return NextResponse.json(
          { error: "server_error" },
          { status: 500, headers: CORS_HEADERS }
        );

      default:
        return NextResponse.json(
          { error: "server_error" },
          { status: 500, headers: CORS_HEADERS }
        );
    }
  } catch (err) {
    logger.error("Device token error:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
