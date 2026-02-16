import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { requireApiAuth } from "@/lib/auth/api-token";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/auth/api-token", () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("GET /api/bundles/me", () => {
  const requireApiAuthMock = vi.mocked(requireApiAuth);
  const createAdminClientMock = vi.mocked(createAdminClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 with CORS headers when token user is not Pro", async () => {
    requireApiAuthMock.mockRejectedValue(
      new Response(
        JSON.stringify({
          error: "pro_required",
          message: "API access requires a Pro subscription. Upgrade at https://unicon.sh/pricing",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const response = await GET(
      new Request("https://example.com/api/bundles/me", {
        headers: { Authorization: "Bearer uni_nonpro" },
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    await expect(response.json()).resolves.toEqual({
      error: "pro_required",
      message: "API access requires a Pro subscription. Upgrade at https://unicon.sh/pricing",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
