import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // First try to get as owner
    let query = supabase
      .from("bundles")
      .select("*")
      .eq("id", id);

    if (user) {
      // User can see their own bundles OR public bundles
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    } else {
      // Non-authenticated users can only see public bundles
      query = query.eq("is_public", true);
    }

    const { data: bundle, error } = await query.single();

    if (error || !bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    return NextResponse.json({ bundle });
  } catch (err) {
    console.error("GET /api/bundles/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "description",
      "icons",
      "is_public",
      "stroke_preset",
      "normalize_strokes",
      "target_stroke_width",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Update icon_count when icons array changes
    if (Array.isArray(body.icons)) {
      updates.icon_count = body.icons.length;
    }

    // Remove share slug when making private
    if (body.is_public === false) {
      updates.share_slug = null;
    }

    // Helper to perform the update
    const performUpdate = async () => {
      const { data: bundle, error } = await supabase
        .from("bundles")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      return { bundle, error };
    };

    // When making public, generate share slug with retry for rare collisions
    if (body.is_public === true) {
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data: slugData } = await supabase.rpc("generate_share_slug");
        updates.share_slug = slugData;

        const { bundle, error } = await performUpdate();

        if (error) {
          // Retry on unique constraint violation for share_slug (code 23505)
          const isSlugCollision = error.code === "23505" && error.message?.includes("share_slug");
          if (isSlugCollision && attempt < maxRetries - 1) {
            continue;
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!bundle) {
          return NextResponse.json({ error: "Bundle not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ bundle });
      }

      return NextResponse.json({ error: "Failed to generate unique share link" }, { status: 500 });
    }

    // Standard update (not making public)
    const { bundle, error } = await performUpdate();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ bundle });
  } catch (err) {
    console.error("PATCH /api/bundles/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("bundles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bundles/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
