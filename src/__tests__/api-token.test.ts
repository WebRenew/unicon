import { describe, expect, it } from "vitest";
import { extractBearerToken } from "./helpers";

describe("extractBearerToken", () => {
  it("should extract token from valid Bearer header", () => {
    const request = new Request("https://example.com", {
      headers: { Authorization: "Bearer uni_abc123" },
    });
    expect(extractBearerToken(request)).toBe("uni_abc123");
  });

  it("should return null when no auth header", () => {
    const request = new Request("https://example.com");
    expect(extractBearerToken(request)).toBeNull();
  });

  it("should return null for non-Bearer auth", () => {
    const request = new Request("https://example.com", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(extractBearerToken(request)).toBeNull();
  });

  it("should be case insensitive for Bearer prefix", () => {
    const request = new Request("https://example.com", {
      headers: { Authorization: "bearer uni_abc123" },
    });
    expect(extractBearerToken(request)).toBe("uni_abc123");
  });

  it("should handle tokens with special characters", () => {
    const request = new Request("https://example.com", {
      headers: { Authorization: "Bearer uni_abc-123_def.456" },
    });
    expect(extractBearerToken(request)).toBe("uni_abc-123_def.456");
  });
});
