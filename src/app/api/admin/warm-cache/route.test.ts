import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";
import {
  embeddingToVectorString,
  generateSearchCacheKey,
  getEmbedding,
  setCachedSearchResults,
} from "@/lib/ai";
import { requireAdminAuth } from "@/lib/auth/admin";

vi.mock("@/lib/db", () => ({
  db: {
    all: vi.fn(),
  },
}));

vi.mock("@/lib/ai", () => ({
  getEmbedding: vi.fn(),
  embeddingToVectorString: vi.fn(),
  generateSearchCacheKey: vi.fn(),
  setCachedSearchResults: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminAuth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
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

describe("POST /api/admin/warm-cache", () => {
  const dbAllMock = vi.mocked(db.all);
  const getEmbeddingMock = vi.mocked(getEmbedding);
  const embeddingToVectorStringMock = vi.mocked(embeddingToVectorString);
  const generateSearchCacheKeyMock = vi.mocked(generateSearchCacheKey);
  const setCachedSearchResultsMock = vi.mocked(setCachedSearchResults);
  const requireAdminAuthMock = vi.mocked(requireAdminAuth);

  beforeEach(() => {
    vi.clearAllMocks();

    requireAdminAuthMock.mockReturnValue(null);
    getEmbeddingMock.mockResolvedValue([0.1, 0.2, 0.3]);
    embeddingToVectorStringMock.mockReturnValue("[0.1,0.2,0.3]");
    generateSearchCacheKeyMock.mockReturnValue("search:arrow:all:50:0");

    const rows = Array.from({ length: 51 }, (_, index) => makeSemanticRow(index + 1));
    dbAllMock.mockResolvedValue(rows);
  });

  it("stores hasMore metadata for warmed semantic cache payloads", async () => {
    const response = await POST(
      new Request("https://example.com/api/admin/warm-cache?queries=arrow") as never
    );

    expect(response.status).toBe(200);
    expect(setCachedSearchResultsMock).toHaveBeenCalledWith(
      "search:arrow:all:50:0",
      expect.objectContaining({
        hasMore: true,
        searchType: "semantic",
      })
    );

    const cachedPayload = setCachedSearchResultsMock.mock.calls[0]?.[1] as
      | { icons?: unknown[]; hasMore?: boolean }
      | undefined;
    expect(cachedPayload?.icons).toHaveLength(50);
    expect(cachedPayload?.hasMore).toBe(true);
  });
});
