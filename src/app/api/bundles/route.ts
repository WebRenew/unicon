import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_BUNDLE_LIMIT = 3;

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bundles, error } = await supabase
    .from("bundles")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bundles });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body early to fail fast on invalid input
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, icons, stroke_preset, normalize_strokes, target_stroke_width } = body;

  if (!name || !icons || !Array.isArray(icons)) {
    return NextResponse.json({ error: "Name and icons are required" }, { status: 400 });
  }

  // Get subscription plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = subscription?.plan ?? "free";

  // Pro users bypass limit check entirely
  if (plan === "pro") {
    const { data: bundle, error } = await supabase
      .from("bundles")
      .insert({
        user_id: user.id,
        name,
        description: description ?? null,
        icons,
        stroke_preset: stroke_preset ?? null,
        normalize_strokes: normalize_strokes ?? false,
        target_stroke_width: target_stroke_width ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bundle }, { status: 201 });
  }

  // For free users: Use atomic insert-and-verify pattern to prevent race conditions
  // Insert the bundle first, then verify count atomically
  const { data: bundle, error: insertError } = await supabase
    .from("bundles")
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
      icons,
      stroke_preset: stroke_preset ?? null,
      normalize_strokes: normalize_strokes ?? false,
      target_stroke_width: target_stroke_width ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Immediately verify bundle count - if over limit, rollback
  const { count } = await supabase
    .from("bundles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count !== null && count > FREE_BUNDLE_LIMIT) {
    // Over limit - delete the bundle we just created (rollback)
    await supabase.from("bundles").delete().eq("id", bundle.id);

    return NextResponse.json(
      { error: "Free plan limited to 3 saved bundles. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  return NextResponse.json({ bundle }, { status: 201 });
}
