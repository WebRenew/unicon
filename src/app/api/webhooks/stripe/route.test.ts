import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("POST /api/webhooks/stripe", () => {
  const headersMock = vi.mocked(headers);
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await POST(
      new Request("https://example.com/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe webhook is not configured",
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  it("continues normal validation flow when webhook secret is configured", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    headersMock.mockResolvedValue(new Headers());

    const response = await POST(
      new Request("https://example.com/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "No signature" });
    expect(headersMock).toHaveBeenCalledTimes(1);
  });
});
