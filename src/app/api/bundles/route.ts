import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Check subscription and bundle count
  const [subscriptionResult, countResult] = await Promise.all([
    supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
    supabase.from("bundles").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const plan = subscriptionResult.data?.plan ?? "free";
  const bundleCount = countResult.count ?? 0;

  if (plan === "free" && bundleCount >= 3) {
    return NextResponse.json(
      { error: "Free plan limited to 3 saved bundles. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, description, icons, stroke_preset, normalize_strokes, target_stroke_width } = body;

  if (!name || !icons || !Array.isArray(icons)) {
    return NextResponse.json({ error: "Name and icons are required" }, { status: 400 });
  }

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
