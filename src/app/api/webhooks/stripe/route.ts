import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { mapStripeSubscriptionStatus } from "@/lib/stripe-webhook";
import type Stripe from "stripe";

const EVENT_CLAIM_STALE_MS = 5 * 60 * 1000; // 5 minutes

type EventClaimResult =
  | { kind: "claimed" }
  | { kind: "already_processed" }
  | { kind: "in_progress" }
  | { kind: "error"; message: string };

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured for webhook processing");
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

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
    logger.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const claim = await claimEventForProcessing(supabase, event.id);

  if (claim.kind === "already_processed" || claim.kind === "in_progress") {
    logger.log(`Event ${event.id} already being handled or processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  if (claim.kind === "error") {
    logger.error(`Failed idempotency claim for event ${event.id}: ${claim.message}`);
    return NextResponse.json({ error: "Webhook idempotency check failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          logger.error("No userId in session metadata");
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
          throw new Error(
            `Failed to update subscription for user ${userId}: ${updateError.message}`
          );
        } else {
          logger.log(`Subscription activated for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
        const periodEndDate = new Date(periodEnd * 1000).toISOString();

        const newStatus = mapStripeSubscriptionStatus(subscription.status);

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
          throw new Error(
            `Failed to update subscription ${subscription.id}: ${updateError.message}`
          );
        } else {
          logger.log(`Subscription ${subscription.id} updated to ${newStatus}`);
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
          throw new Error(
            `Failed to cancel subscription ${subscription.id}: ${updateError.message}`
          );
        } else {
          logger.log(`Subscription canceled for subscription ${subscription.id}`);
        }
        break;
      }

      default:
        logger.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed after successful handling
    await markEventAsProcessed(supabase, event.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    await releaseEventClaim(supabase, event.id);
    logger.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function claimEventForProcessing(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string
): Promise<EventClaimResult> {
  const nowIso = new Date().toISOString();

  const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
    event_id: eventId,
    status: "processing",
    last_attempt_at: nowIso,
  });

  if (!insertError) {
    return { kind: "claimed" };
  }

  // Unique violation means another attempt has already claimed this event ID.
  if (insertError.code !== "23505") {
    return { kind: "error", message: insertError.message };
  }

  const { data: existing, error: existingError } = await supabase
    .from("stripe_webhook_events")
    .select("status, processed_at, last_attempt_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingError) {
    return { kind: "error", message: existingError.message };
  }

  if (!existing) {
    return { kind: "error", message: "Webhook event state not found after duplicate claim" };
  }

  if (existing.processed_at || existing.status === "processed") {
    return { kind: "already_processed" };
  }

  if (!isClaimStale(existing.last_attempt_at)) {
    return { kind: "in_progress" };
  }

  // Reclaim stale in-progress events so retries can recover from crashes.
  const staleBeforeIso = new Date(Date.now() - EVENT_CLAIM_STALE_MS).toISOString();
  const { data: reclaimed, error: reclaimError } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      last_attempt_at: nowIso,
    })
    .eq("event_id", eventId)
    .eq("status", "processing")
    .is("processed_at", null)
    .lt("last_attempt_at", staleBeforeIso)
    .select("event_id")
    .maybeSingle();

  if (reclaimError) {
    return { kind: "error", message: reclaimError.message };
  }

  return reclaimed ? { kind: "claimed" } : { kind: "in_progress" };
}

async function markEventAsProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      processed_at: nowIso,
      last_attempt_at: nowIso,
    })
    .eq("event_id", eventId)
    .eq("status", "processing")
    .is("processed_at", null)
    .select("event_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark webhook event ${eventId} as processed: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Missing webhook claim while marking event ${eventId} as processed`);
  }
}

async function releaseEventClaim(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string
): Promise<void> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .delete()
    .eq("event_id", eventId)
    .eq("status", "processing")
    .is("processed_at", null);

  if (error) {
    logger.warn(`Failed to release webhook claim for ${eventId}: ${error.message}`);
  }
}

function isClaimStale(lastAttemptAt: string | null): boolean {
  if (!lastAttemptAt) {
    return true;
  }

  const lastAttemptMs = Date.parse(lastAttemptAt);
  if (Number.isNaN(lastAttemptMs)) {
    return true;
  }

  return Date.now() - lastAttemptMs > EVENT_CLAIM_STALE_MS;
}
