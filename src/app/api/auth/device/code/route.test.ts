import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDeviceCodeRateLimit } from "@/lib/rate-limit";
import { getTrustedClientIp } from "@/lib/request-ip";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkDeviceCodeRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "123",
  }),
}));

vi.mock("@/lib/request-ip", () => ({
  getTrustedClientIp: vi.fn(),
}));

describe("POST /api/auth/device/code", () => {
  const createAdminClientMock = vi.mocked(createAdminClient);
  const checkDeviceCodeRateLimitMock = vi.mocked(checkDeviceCodeRateLimit);
  const getTrustedClientIpMock = vi.mocked(getTrustedClientIp);

  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    checkDeviceCodeRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123,
    });

    getTrustedClientIpMock.mockReturnValue("203.0.113.5");

    rpcMock.mockResolvedValue({
      data: [
        {
          device_code: "dev_123",
          user_code: "ABCD-1234",
          verification_uri: "https://unicon.sh/auth/device",
          expires_in: 900,
        },
      ],
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      rpc: rpcMock,
    } as unknown as ReturnType<typeof createAdminClient>);
  });

  it("returns 429 when device-code endpoint rate limit is exceeded", async () => {
    checkDeviceCodeRateLimitMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123,
    });

    const response = await POST(
      new Request("https://example.com/api/auth/device/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: "CLI", scope: "bundles:read" }),
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    await expect(response.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      error_description: "Too many device authorization requests. Please try again shortly.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("creates a device code when within rate limit", async () => {
    const response = await POST(
      new Request("https://example.com/api/auth/device/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: "CLI", scope: "bundles:read" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      device_code: "dev_123",
      user_code: "ABCD-1234",
      verification_uri: "https://unicon.sh/auth/device",
      verification_uri_complete: "https://unicon.sh/auth/device?code=ABCD-1234",
      expires_in: 900,
      interval: 5,
    });

    expect(getTrustedClientIpMock).toHaveBeenCalledTimes(1);
    expect(checkDeviceCodeRateLimitMock).toHaveBeenCalledWith("203.0.113.5");
    expect(rpcMock).toHaveBeenCalledWith("create_device_code", {
      p_client_name: "CLI",
      p_scope: "bundles:read",
    });
  });
});
