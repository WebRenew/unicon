/**
 * POST /api/auth/device/code
 * 
 * OAuth 2.0 Device Authorization - Request a device code
 * RFC 8628: https://datatracker.ietf.org/doc/html/rfc8628
 * 
 * Called by CLI/MCP to start the device authorization flow.
 * Returns a device_code (secret) and user_code (shown to user).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientName = body.client_name || "CLI";
    const scope = body.scope || "bundles:read";

    // Validate client name
    if (!["CLI", "MCP"].includes(clientName)) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client_name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create device code via RPC
    const { data, error } = await supabase.rpc("create_device_code", {
      p_client_name: clientName,
      p_scope: scope,
    });

    if (error) {
      console.error("Device code creation error:", error);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "server_error", error_description: "Failed to create device code" },
        { status: 500 }
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
    });
  } catch (err) {
    console.error("Device code error:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 }
    );
  }
}
