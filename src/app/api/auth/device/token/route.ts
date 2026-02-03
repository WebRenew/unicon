/**
 * POST /api/auth/device/token
 * 
 * OAuth 2.0 Device Authorization - Poll for token
 * RFC 8628: https://datatracker.ietf.org/doc/html/rfc8628
 * 
 * Called by CLI/MCP to poll for the access token after user authorizes.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceCode = body.device_code;
    const grantType = body.grant_type;

    // Validate grant type
    if (grantType !== "urn:ietf:params:oauth:grant-type:device_code") {
      return NextResponse.json(
        { error: "unsupported_grant_type" },
        { status: 400 }
      );
    }

    // Validate device code presence
    if (!deviceCode) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "device_code is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check device code status via RPC
    const { data, error } = await supabase.rpc("check_device_code", {
      p_device_code: deviceCode,
    });

    if (error) {
      console.error("Device code check error:", error);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid device code" },
        { status: 400 }
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
        });

      case "pending":
        // Still waiting for user authorization - return 400 with authorization_pending
        return NextResponse.json(
          { 
            error: "authorization_pending",
            error_description: "The user has not yet authorized this device",
            expires_in: result.expires_in,
          },
          { status: 400 }
        );

      case "error":
        // Map error codes to HTTP status
        const statusCode = result.error === "slow_down" ? 400 : 
                          result.error === "expired_token" ? 400 :
                          result.error === "access_denied" ? 400 : 400;
        return NextResponse.json(
          { error: result.error },
          { status: statusCode }
        );

      default:
        return NextResponse.json(
          { error: "server_error" },
          { status: 500 }
        );
    }
  } catch (err) {
    console.error("Device token error:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 }
    );
  }
}
