import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Track processed events to ensure idempotency (in-memory for single instance)
// In production with multiple instances, use Redis or database
const processedEvents = new Map<string, number>();
const EVENT_TTL = 60 * 60 * 1000; // 1 hour

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId);
  if (!timestamp) return false;
  
  // Check if event is still within TTL
  if (Date.now() - timestamp > EVENT_TTL) {
    processedEvents.delete(eventId);
    return false;
  }
  return true;
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
  
  // Prune old entries periodically
  if (processedEvents.size > 1000) {
    const now = Date.now();
    for (const [id, ts] of processedEvents.entries()) {
      if (now - ts > EVENT_TTL) {
        processedEvents.delete(id);
      }
    }
  }
}

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

  // Idempotency check - prevent duplicate processing
  if (isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
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

        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

        // Use updated_at for optimistic locking - only update if not already updated
        // by a more recent event
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan: "pro",
            provider: "stripe",
            provider_subscription_id: subscription.id,
            provider_customer_id: session.customer as string,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .or(`current_period_end.is.null,current_period_end.lt.${new Date(periodEnd * 1000).toISOString()}`);

        if (updateError) {
          console.error(`Failed to update subscription for user ${userId}:`, updateError);
        } else {
          console.log(`Subscription activated for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
        const periodEndDate = new Date(periodEnd * 1000).toISOString();

        const newStatus = subscription.status === "active" ? "active" :
                         subscription.status === "past_due" ? "past_due" : "canceled";

        // Update by subscription ID with optimistic locking on period end
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: newStatus,
            current_period_end: periodEndDate,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscription.id)
          .or(`current_period_end.is.null,current_period_end.lte.${periodEndDate}`);

        if (updateError) {
          console.error(`Failed to update subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`Subscription ${subscription.id} updated to ${newStatus}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Downgrade to free plan - this is always safe to apply
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscription.id);

        if (updateError) {
          console.error(`Failed to cancel subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`Subscription canceled for subscription ${subscription.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed after successful handling
    markEventProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
