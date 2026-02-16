import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import { requireAdminAuth } from "@/lib/auth/admin";
import { getEmbeddings } from "@/lib/ai";
import { db } from "@/lib/db";

vi.mock("@/lib/auth/admin", () => ({
  requireAdminAuth: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  getEmbeddings: vi.fn(),
  embeddingToBlob: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe("POST /api/admin/generate-embeddings", () => {
  const requireAdminAuthMock = vi.mocked(requireAdminAuth);
  const getEmbeddingsMock = vi.mocked(getEmbeddings);
  const dbSelectMock = vi.mocked(db.select);
  const dbUpdateMock = vi.mocked(db.update);

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminAuthMock.mockReturnValue(null);
  });

  it("returns auth response when admin auth fails", async () => {
    const authResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    requireAdminAuthMock.mockReturnValue(authResponse);

    const response = await POST(
      new Request("https://example.com/api/admin/generate-embeddings") as unknown as Parameters<
        typeof POST
      >[0]
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getEmbeddingsMock).not.toHaveBeenCalled();
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "501", "1.5"])(
    "returns 400 for invalid batchSize=%s",
    async (batchSize) => {
      const response = await POST(
        new Request(
          `https://example.com/api/admin/generate-embeddings?batchSize=${batchSize}`
        ) as unknown as Parameters<typeof POST>[0]
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "batchSize must be an integer between 1 and 500",
      });
      expect(getEmbeddingsMock).not.toHaveBeenCalled();
      expect(dbSelectMock).not.toHaveBeenCalled();
      expect(dbUpdateMock).not.toHaveBeenCalled();
    }
  );
});
