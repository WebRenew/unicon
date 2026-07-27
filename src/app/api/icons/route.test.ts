import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/lib/db";
import { getSearchCount, searchIcons } from "@/lib/queries";
import { checkPublicRateLimit } from "@/lib/rate-limit";
import { getCachedSearchResults, setCachedSearchResults } from "@/lib/ai";
import type { IconData } from "@/types/icon";

const semanticCache = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/lib/queries", () => ({
  searchIcons: vi.fn(),
  getSearchCount: vi.fn(),
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

function makeIconRow(index: number): IconData {
  return {
    id: `icon-${index}`,
    name: `Icon ${index}`,
    normalizedName: `icon-${index}`,
    sourceId: "lucide",
    category: "general",
    tags: [],
    viewBox: "0 0 24 24",
    content: "<path d='M1 1h22v22H1z'/>",
    pathData: null,
    defaultStroke: true,
    defaultFill: false,
    strokeWidth: "2",
    brandColor: null,
  };
}

describe("GET /api/icons search performance paths", () => {
  const dbAllMock = vi.mocked(db.all);
  const searchIconsMock = vi.mocked(searchIcons);
  const getSearchCountMock = vi.mocked(getSearchCount);
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
    searchIconsMock.mockResolvedValue([makeIconRow(1), makeIconRow(2), makeIconRow(3)]);
    getSearchCountMock.mockResolvedValue(4_985);
  });

  it("uses fast text search when semantic search is disabled", async () => {
    const request = new Request("https://example.com/api/icons?q=arrow&limit=2&offset=0&ai=false");

    const response = await GET(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      hasMore: true,
      searchType: "text",
      total: 4_985,
    });
    expect(searchIconsMock).toHaveBeenCalledWith({
      query: "arrow",
      limit: 3,
      offset: 0,
    });
    expect(getSearchCountMock).toHaveBeenCalledWith({
      query: "arrow",
    });
    expect(dbAllMock).not.toHaveBeenCalled();
    expect(getCachedSearchResultsMock).not.toHaveBeenCalled();
  });

  it("stores hasMore in cache and returns consistent hasMore on semantic cache hits", async () => {
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

  it("defaults legacy semantic cache entries without hasMore to hasMore=false", async () => {
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
