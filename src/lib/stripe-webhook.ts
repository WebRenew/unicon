import type Stripe from "stripe";

export type LocalSubscriptionStatus = "active" | "past_due" | "canceled";

/**
 * Map Stripe subscription statuses to local subscription statuses.
 *
 * We intentionally avoid collapsing `trialing` and `incomplete` into `canceled`
 * to prevent accidental premature downgrades.
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
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}
