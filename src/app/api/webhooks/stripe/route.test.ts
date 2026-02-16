import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

function createWebhookEventsTableMock({
  insertResult,
  selectResult,
  updateResults,
}: {
  insertResult: { error: { code?: string; message: string } | null };
  selectResult?: { data: Record<string, unknown> | null; error: { message: string } | null };
  updateResults?: Array<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
}) {
  const insert = vi.fn().mockResolvedValue(insertResult);

  const selectBuilder = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(selectResult ?? { data: null, error: null }),
  };
  const select = vi.fn().mockReturnValue(selectBuilder);

  const updateQueue = [...(updateResults ?? [])];
  const updateBuilder = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve(updateQueue.shift() ?? { data: null, error: null })
    ),
  };
  const update = vi.fn().mockReturnValue(updateBuilder);

  const deleteBuilder = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockResolvedValue({ error: null }),
  };
  const del = vi.fn().mockReturnValue(deleteBuilder);

  return {
    insert,
    select,
    selectBuilder,
    update,
    updateBuilder,
    del,
    deleteBuilder,
  };
}

describe("POST /api/webhooks/stripe", () => {
  const headersMock = vi.mocked(headers);
  const createAdminClientMock = vi.mocked(createAdminClient);
  const constructEventMock = vi.mocked(stripe.webhooks.constructEvent);
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

  it("processes event and marks it as processed when claim succeeds", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    headersMock.mockResolvedValue(new Headers({ "stripe-signature": "sig" }));
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "invoice.created",
    } as never);

    const eventsTable = createWebhookEventsTableMock({
      insertResult: { error: null },
      updateResults: [{ data: { event_id: "evt_1" }, error: null }],
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "stripe_webhook_events") {
          return {
            insert: eventsTable.insert,
            select: eventsTable.select,
            update: eventsTable.update,
            delete: eventsTable.del,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    const response = await POST(
      new Request("https://example.com/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(eventsTable.insert).toHaveBeenCalledTimes(1);
    expect(eventsTable.update).toHaveBeenCalledTimes(1);
  });

  it("skips duplicate event when existing record is already processed", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    headersMock.mockResolvedValue(new Headers({ "stripe-signature": "sig" }));
    constructEventMock.mockReturnValue({
      id: "evt_dup",
      type: "invoice.created",
    } as never);

    const eventsTable = createWebhookEventsTableMock({
      insertResult: { error: { code: "23505", message: "duplicate key value" } },
      selectResult: {
        data: {
          status: "processed",
          processed_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
        },
        error: null,
      },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "stripe_webhook_events") {
          return {
            insert: eventsTable.insert,
            select: eventsTable.select,
            update: eventsTable.update,
            delete: eventsTable.del,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    const response = await POST(
      new Request("https://example.com/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, skipped: true });
    expect(eventsTable.select).toHaveBeenCalledTimes(1);
    expect(eventsTable.update).not.toHaveBeenCalled();
  });
});
