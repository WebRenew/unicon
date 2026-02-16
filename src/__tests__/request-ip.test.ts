import { describe, expect, it } from "vitest";
import { getTrustedClientIp } from "@/lib/request-ip";

describe("getTrustedClientIp", () => {
  it("uses x-real-ip when present", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-real-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.77",
      },
    });

    expect(getTrustedClientIp(request)).toBe("203.0.113.10");
  });

  it("does not trust x-forwarded-for when x-real-ip is missing", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "198.51.100.77",
      },
    });

    expect(getTrustedClientIp(request)).toBe("unknown");
  });
});
