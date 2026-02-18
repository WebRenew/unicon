import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { checkPublicRateLimit } from "@/lib/rate-limit";
import { getTrustedClientIp } from "@/lib/request-ip";

vi.mock("@/lib/db", () => ({
  db: {
    all: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  getEmbedding: vi.fn(),
  embeddingToVectorString: vi.fn(),
  expandQueryWithAI: vi.fn(),
}));

vi.mock("@/lib/synonyms", () => ({
  expandQueryWithSynonyms: vi.fn((query: string) => query),
  hasSynonyms: vi.fn(() => false),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkPublicRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "123",
  }),
}));

vi.mock("@/lib/request-ip", () => ({
  getTrustedClientIp: vi.fn(),
}));

describe("POST /api/search validation and protection", () => {
  const checkPublicRateLimitMock = vi.mocked(checkPublicRateLimit);
  const getTrustedClientIpMock = vi.mocked(getTrustedClientIp);

  beforeEach(() => {
    vi.clearAllMocks();

    getTrustedClientIpMock.mockReturnValue("203.0.113.9");
    checkPublicRateLimitMock.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123,
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    checkPublicRateLimitMock.mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123,
    });

    const response = await POST(
      new Request("https://example.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "arrow" }),
      }) as never
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Please slow down.",
    });
  });

  it("returns 400 when JSON body is invalid", async () => {
    const response = await POST(
      new Request("https://example.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
    });
  });

  it("returns 400 when query is missing", async () => {
    const response = await POST(
      new Request("https://example.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Query is required",
    });
  });

  it("returns 400 when sourceId has an invalid type", async () => {
    const response = await POST(
      new Request("https://example.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "arrow", sourceId: 123 }),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "sourceId must be a string",
    });
  });

  it("returns 400 when useAI has an invalid type", async () => {
    const response = await POST(
      new Request("https://example.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "arrow", useAI: "yes" }),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "useAI must be a boolean",
    });
  });
});
