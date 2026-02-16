import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

type MockSupabaseClient = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
};

function createDeleteChain(result: { data: Array<{ id: string }>; error: { message: string } | null }) {
  const select = vi.fn().mockResolvedValue(result);
  const eqUser = vi.fn().mockReturnValue({ select });
  const eqId = vi.fn().mockReturnValue({ eq: eqUser });
  const del = vi.fn().mockReturnValue({ eq: eqId });
  const from = vi.fn().mockReturnValue({ delete: del });

  return {
    from,
    del,
    eqId,
    eqUser,
    select,
  };
}

describe("DELETE /api/bundles/[id]", () => {
  const createClientMock = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    const supabase: MockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "unauthorized" },
        }),
      },
      from: vi.fn(),
    };

    createClientMock.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(new Request("https://example.com/api/bundles/abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns 404 when no bundle row is deleted", async () => {
    const chain = createDeleteChain({ data: [], error: null });
    const supabase: MockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: chain.from,
    };

    createClientMock.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(new Request("https://example.com/api/bundles/bundle-1"), {
      params: Promise.resolve({ id: "bundle-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Bundle not found or unauthorized",
    });

    expect(chain.from).toHaveBeenCalledWith("bundles");
    expect(chain.del).toHaveBeenCalled();
    expect(chain.eqId).toHaveBeenCalledWith("id", "bundle-1");
    expect(chain.eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(chain.select).toHaveBeenCalledWith("id");
  });

  it("returns 200 when a bundle row is deleted", async () => {
    const chain = createDeleteChain({ data: [{ id: "bundle-1" }], error: null });
    const supabase: MockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: chain.from,
    };

    createClientMock.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(new Request("https://example.com/api/bundles/bundle-1"), {
      params: Promise.resolve({ id: "bundle-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
