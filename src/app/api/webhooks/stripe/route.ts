import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId in session metadata");
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Update subscription in database
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan: "pro",
            provider: "stripe",
            provider_subscription_id: subscription.id,
            provider_customer_id: session.customer as string,
            current_period_end: new Date(
              (subscription as unknown as { current_period_end: number }).current_period_end * 1000
            ).toISOString(),
          })
          .eq("user_id", userId);

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

        if (!userId) {
          // Try to find by subscription ID
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("provider_subscription_id", subscription.id)
            .single();

          if (existingSub) {
            await supabase
              .from("subscriptions")
              .update({
                status: subscription.status === "active" ? "active" :
                        subscription.status === "past_due" ? "past_due" : "canceled",
                current_period_end: new Date(periodEnd * 1000).toISOString(),
              })
              .eq("provider_subscription_id", subscription.id);
          }
          break;
        }

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" :
                    subscription.status === "past_due" ? "past_due" : "canceled",
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          })
          .eq("user_id", userId);

        console.log(`Subscription updated for user ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Downgrade to free plan
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            current_period_end: null,
          })
          .eq("provider_subscription_id", subscription.id);

        console.log(`Subscription canceled for subscription ${subscription.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
