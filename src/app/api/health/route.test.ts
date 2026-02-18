import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/lib/db";
import { getCacheStats } from "@/lib/ai";

vi.mock("@/lib/db", () => ({
  db: {
    all: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  getCacheStats: vi.fn(),
}));

describe("GET /api/health", () => {
  const dbAllMock = vi.mocked(db.all);
  const getCacheStatsMock = vi.mocked(getCacheStats);
  const originalAiGatewayKey = process.env.AI_GATEWAY_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();

    getCacheStatsMock.mockReturnValue({
      searchResults: { size: 10, maxSize: 100 },
      embeddings: { size: 50, maxSize: 1000 },
      queryExpansions: { size: 20, maxSize: 1000 },
    });
  });

  afterEach(() => {
    if (typeof originalAiGatewayKey === "string") {
      process.env.AI_GATEWAY_API_KEY = originalAiGatewayKey;
    } else {
      delete process.env.AI_GATEWAY_API_KEY;
    }

    if (typeof originalAnthropicKey === "string") {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it("returns healthy when DB, cache, and AI config checks pass", async () => {
    process.env.AI_GATEWAY_API_KEY = "gateway-key";
    process.env.ANTHROPIC_API_KEY = "anthropic-key";

    dbAllMock
      .mockResolvedValueOnce([{ count: 100 }])
      .mockResolvedValueOnce([{ count: 80 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "healthy",
      database: {
        status: "healthy",
        connected: true,
        icons: {
          total: 100,
          withEmbeddings: 80,
          percentage: 80,
        },
      },
      ai: {
        status: "healthy",
        openai: { configured: true, status: "ready" },
        anthropic: { configured: true, status: "ready" },
      },
      cache: {
        status: "healthy",
      },
    });
  });

  it("returns unhealthy when DB is down and AI providers are not configured", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    dbAllMock.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "unhealthy",
      database: {
        status: "unhealthy",
        connected: false,
      },
      ai: {
        status: "unhealthy",
      },
      cache: {
        status: "healthy",
      },
    });
  });
});
