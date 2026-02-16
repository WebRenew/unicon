import { afterEach, describe, expect, it } from "vitest";
import { requireAdminAuth } from "@/lib/auth/admin";

describe("requireAdminAuth", () => {
  const originalAdminSecret = process.env.ADMIN_SECRET;

  afterEach(() => {
    if (originalAdminSecret === undefined) {
      delete process.env.ADMIN_SECRET;
    } else {
      process.env.ADMIN_SECRET = originalAdminSecret;
    }
  });

  it("returns 503 when ADMIN_SECRET is not configured", async () => {
    delete process.env.ADMIN_SECRET;

    const request = new Request("https://example.com/api/admin");
    const response = requireAdminAuth(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({
      error: "Admin authentication is not configured",
    });
  });

  it("returns 401 when authorization header is missing", () => {
    process.env.ADMIN_SECRET = "test-secret";

    const request = new Request("https://example.com/api/admin");
    const response = requireAdminAuth(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
  });

  it("returns 401 when bearer token is invalid", () => {
    process.env.ADMIN_SECRET = "test-secret";

    const request = new Request("https://example.com/api/admin", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = requireAdminAuth(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
  });

  it("returns null when bearer token matches ADMIN_SECRET", () => {
    process.env.ADMIN_SECRET = "test-secret";

    const request = new Request("https://example.com/api/admin", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = requireAdminAuth(request);

    expect(response).toBeNull();
  });
});
