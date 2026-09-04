import type Stripe from "stripe";

export type LocalSubscriptionStatus = "active" | "past_due" | "canceled";

/**
 * Map Stripe subscription statuses to local subscription statuses.
 *
 * We intentionally avoid collapsing `trialing` and `incomplete` into `canceled`
 * to prevent accidental premature downgrades. Since stripe-node 22.6 the
 * status type is an open enum (a status Stripe adds after the SDK shipped
 * arrives as a plain string), so a value this code doesn't recognise maps to
 * `past_due`: it neither grants Pro nor downgrades to free until a known
 * status arrives.
 */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): LocalSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "past_due";
  }
}

/**
 * Resolve when a subscription's current billing period ends, as a Unix
 * timestamp in seconds.
 *
 * Since API version 2025-03-31.basil the period lives on each subscription
 * item, not on the subscription itself — every version this app has ever
 * pinned is newer than that, so a top-level `current_period_end` read has
 * always been `undefined` here. Unicon sells a single plan, but the latest
 * item period is taken so a subscription with several items still resolves
 * to the moment access should lapse. Returns `null` when no item carries a
 * period, so the caller can refuse rather than persist an invalid date.
 */
export function getSubscriptionPeriodEnd(
  subscription: Pick<Stripe.Subscription, "items">
): number | null {
  let latest: number | null = null;
  for (const item of subscription.items?.data ?? []) {
    const periodEnd = item.current_period_end;
    if (typeof periodEnd !== "number" || !Number.isFinite(periodEnd)) continue;
    if (latest === null || periodEnd > latest) latest = periodEnd;
  }
  return latest;
}

export interface EndpointApiVersionDrift {
  eventId: string;
  eventType: string;
  endpointApiVersion: string | null;
  sdkApiVersion: string;
}

/**
 * Detect a webhook payload rendered under a different API version than the
 * SDK pin.
 *
 * A webhook endpoint carries its own `api_version`, set when the endpoint is
 * created and immutable afterwards, and it — not the SDK's pin — shapes every
 * event payload it delivers. Code typed against the SDK version can therefore
 * typecheck and still read `undefined` in production. Every event says which
 * version rendered it, so the drift is observable per event without an API
 * call. Returns `null` when the two agree.
 */
export function getEndpointApiVersionDrift(
  event: Pick<Stripe.Event, "id" | "type" | "api_version">,
  sdkApiVersion: string
): EndpointApiVersionDrift | null {
  const endpointApiVersion = event.api_version ?? null;
  if (endpointApiVersion === sdkApiVersion) return null;
  return {
    eventId: event.id,
    eventType: event.type,
    endpointApiVersion,
    sdkApiVersion,
  };
}
