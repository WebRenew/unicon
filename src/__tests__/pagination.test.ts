import { describe, expect, it } from "vitest";
import { parsePagination, sliceForPagination } from "@/lib/api/pagination";

describe("parsePagination", () => {
  it("uses defaults when limit and offset are omitted", () => {
    const result = parsePagination({
      limit: null,
      offset: null,
      defaultLimit: 50,
      maxLimit: 320,
    });

    expect(result).toEqual({ limit: 50, offset: 0 });
  });

  it("parses numeric strings from query params", () => {
    const result = parsePagination({
      limit: "120",
      offset: "25",
      defaultLimit: 50,
      maxLimit: 320,
    });

    expect(result).toEqual({ limit: 120, offset: 25 });
  });

  it("rejects non-integer input", () => {
    const result = parsePagination({
      limit: "abc",
      offset: "0",
      defaultLimit: 50,
      maxLimit: 320,
    });

    expect(result).toEqual({ error: "limit must be an integer" });
  });

  it("rejects out-of-range limit values", () => {
    const result = parsePagination({
      limit: 1000,
      offset: 0,
      defaultLimit: 50,
      maxLimit: 320,
    });

    expect(result).toEqual({ error: "limit must be between 1 and 320" });
  });

  it("rejects negative offsets", () => {
    const result = parsePagination({
      limit: 50,
      offset: -1,
      defaultLimit: 50,
      maxLimit: 320,
    });

    expect(result).toEqual({ error: "offset must be greater than or equal to 0" });
  });
});

describe("sliceForPagination", () => {
  it("reports hasMore=false when rows do not exceed limit", () => {
    const result = sliceForPagination([1, 2, 3], 3);
    expect(result).toEqual({ items: [1, 2, 3], hasMore: false });
  });

  it("reports hasMore=true and trims extra row when rows exceed limit", () => {
    const result = sliceForPagination([1, 2, 3, 4], 3);
    expect(result).toEqual({ items: [1, 2, 3], hasMore: true });
  });
});
