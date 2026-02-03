/**
 * POST /api/auth/device/authorize
 * 
 * Authorize a device code - called when user approves in browser
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in to authorize devices" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const userCode = body.user_code;

    if (!userCode) {
      return NextResponse.json(
        { error: "invalid_request", message: "user_code is required" },
        { status: 400 }
      );
    }

    // Use admin client for the RPC call since it needs elevated privileges
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase.rpc("authorize_device_code", {
      p_user_code: userCode,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Device authorization error:", error);
      return NextResponse.json(
        { error: "server_error", message: error.message },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "server_error", message: "Failed to authorize device" },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: "authorization_failed", message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client_name: result.client_name,
      scope: result.scope,
      message: `Successfully authorized ${result.client_name} to access your bundles`,
    });
  } catch (err) {
    console.error("Device authorize error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
