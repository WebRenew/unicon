import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import { getSearchStats } from "@/lib/analytics";
import { requireAdminAuth } from "@/lib/auth/admin";

vi.mock("@/lib/analytics", () => ({
  getSearchStats: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminAuth: vi.fn(),
}));

describe("GET /api/admin/analytics", () => {
  const getSearchStatsMock = vi.mocked(getSearchStats);
  const requireAdminAuthMock = vi.mocked(requireAdminAuth);

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminAuthMock.mockReturnValue(null);
  });

  it("returns auth response when admin auth fails", async () => {
    const authResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    requireAdminAuthMock.mockReturnValue(authResponse);

    const response = await GET(
      new Request("https://example.com/api/admin/analytics") as unknown as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getSearchStatsMock).not.toHaveBeenCalled();
  });

  it("returns 400 when days is not an integer", async () => {
    const response = await GET(
      new Request("https://example.com/api/admin/analytics?days=abc") as unknown as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "days must be an integer between 1 and 365",
    });
    expect(getSearchStatsMock).not.toHaveBeenCalled();
  });

  it.each(["0", "366"])("returns 400 when days=%s is out of range", async (days) => {
    const response = await GET(
      new Request(`https://example.com/api/admin/analytics?days=${days}`) as unknown as Parameters<
        typeof GET
      >[0]
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "days must be an integer between 1 and 365",
    });
    expect(getSearchStatsMock).not.toHaveBeenCalled();
  });

  it("uses default days when query param is omitted", async () => {
    getSearchStatsMock.mockResolvedValue({ period: "7 days", summary: {}, popularQueries: [] });

    const response = await GET(
      new Request("https://example.com/api/admin/analytics") as unknown as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(200);
    expect(getSearchStatsMock).toHaveBeenCalledWith(7);
    await expect(response.json()).resolves.toEqual({
      period: "7 days",
      summary: {},
      popularQueries: [],
    });
  });

  it("passes validated days to analytics query", async () => {
    getSearchStatsMock.mockResolvedValue({ period: "30 days", summary: {}, popularQueries: [] });

    const response = await GET(
      new Request("https://example.com/api/admin/analytics?days=30") as unknown as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(200);
    expect(getSearchStatsMock).toHaveBeenCalledWith(30);
    await expect(response.json()).resolves.toEqual({
      period: "30 days",
      summary: {},
      popularQueries: [],
    });
  });
});
