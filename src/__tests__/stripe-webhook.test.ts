import { describe, expect, it } from "vitest";
import { mapStripeSubscriptionStatus } from "@/lib/stripe-webhook";

describe("mapStripeSubscriptionStatus", () => {
  it("maps active and trialing to active", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("trialing")).toBe("active");
  });

  it("maps billing-problem states to past_due", () => {
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("incomplete")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("paused")).toBe("past_due");
  });

  it("maps terminal states to canceled", () => {
    expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });
});
