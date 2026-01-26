import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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

  // Generate share slug when making public
  if (body.is_public === true) {
    const { data: slugData } = await supabase.rpc("generate_share_slug");
    updates.share_slug = slugData;
  }

  // Remove share slug when making private
  if (body.is_public === false) {
    updates.share_slug = null;
  }

  const { data: bundle, error } = await supabase
    .from("bundles")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json({ bundle });
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
}
