import { describe, expect, it } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

// Import only the pure function — avoid importing the module top-level
// since it initializes Redis with env vars
describe("getRateLimitHeaders", () => {
  it("should return correct header keys and string values", async () => {
    // Dynamic import to avoid module-level Redis initialization
    const { getRateLimitHeaders } = await import("@/lib/rate-limit");

    const result: RateLimitResult = {
      success: true,
      limit: 100,
      remaining: 95,
      reset: 1700000000,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("95");
    expect(headers["X-RateLimit-Reset"]).toBe("1700000000");
  });
});
