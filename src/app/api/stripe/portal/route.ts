import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get subscription with customer ID
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.provider_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
