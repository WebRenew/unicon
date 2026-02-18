import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/lib/db";
import { checkPublicRateLimit } from "@/lib/rate-limit";
import { getCachedSearchResults, setCachedSearchResults } from "@/lib/ai";

const semanticCache = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/lib/queries", () => ({
  searchIcons: vi.fn(),
  getIconsByNames: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    all: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  embeddingToVectorString: vi.fn().mockReturnValue("[0.1,0.2,0.3]"),
  expandQueryWithAI: vi.fn().mockResolvedValue(null),
  generateSearchCacheKey: vi.fn(
    (params: { query: string; sourceId?: string; limit: number; offset: number }) =>
      `search:${params.query.toLowerCase().trim()}:${params.sourceId || "all"}:${params.limit}:${params.offset}`
  ),
  getCachedSearchResults: vi.fn((cacheKey: string) => (semanticCache.get(cacheKey) as unknown) ?? null),
  setCachedSearchResults: vi.fn((cacheKey: string, data: unknown) => {
    semanticCache.set(cacheKey, data);
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/analytics", () => ({
  logSearch: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkPublicRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/request-ip", () => ({
  getTrustedClientIp: vi.fn().mockReturnValue("203.0.113.10"),
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn(),
}));

function makeSemanticRow(index: number) {
  return {
    id: `icon-${index}`,
    name: `Icon ${index}`,
    normalizedName: `icon-${index}`,
    sourceId: "lucide",
    category: "general",
    tags: "[]",
    viewBox: "0 0 24 24",
    content: "<path d='M1 1h22v22H1z'/>",
    pathData: null,
    defaultStroke: 1,
    defaultFill: 0,
    strokeWidth: "2",
    brandColor: null,
    distance: index,
  };
}

describe("GET /api/icons semantic cache pagination", () => {
  const dbAllMock = vi.mocked(db.all);
  const checkPublicRateLimitMock = vi.mocked(checkPublicRateLimit);
  const getCachedSearchResultsMock = vi.mocked(getCachedSearchResults);
  const setCachedSearchResultsMock = vi.mocked(setCachedSearchResults);

  beforeEach(() => {
    vi.clearAllMocks();
    semanticCache.clear();

    checkPublicRateLimitMock.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60_000,
    });

    dbAllMock.mockResolvedValue([makeSemanticRow(1), makeSemanticRow(2), makeSemanticRow(3)]);
  });

  it("stores hasMore in cache and returns consistent hasMore on cache hits", async () => {
    const request = new Request("https://example.com/api/icons?q=arrow&limit=2&offset=0");

    const firstResponse = await GET(request as never);
    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toMatchObject({
      hasMore: true,
      searchType: "semantic",
    });

    expect(setCachedSearchResultsMock).toHaveBeenCalledWith(
      "search:arrow:all:2:0",
      expect.objectContaining({
        hasMore: true,
        searchType: "semantic",
      })
    );

    dbAllMock.mockClear();
    const secondResponse = await GET(request as never);
    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toMatchObject({
      hasMore: true,
      searchType: "semantic",
    });
    expect(dbAllMock).not.toHaveBeenCalled();
  });

  it("defaults legacy cache entries without hasMore to hasMore=false", async () => {
    semanticCache.set("search:arrow:all:2:0", {
      icons: [makeSemanticRow(1)],
      searchType: "semantic",
    });

    const request = new Request("https://example.com/api/icons?q=arrow&limit=2&offset=0");
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      hasMore: false,
      searchType: "semantic",
    });

    expect(getCachedSearchResultsMock).toHaveBeenCalledWith("search:arrow:all:2:0");
    expect(dbAllMock).not.toHaveBeenCalled();
  });
});
