import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDeviceTokenRateLimit } from "@/lib/rate-limit";
import { getTrustedClientIp } from "@/lib/request-ip";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkDeviceTokenRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Limit": "30",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "123",
  }),
}));

vi.mock("@/lib/request-ip", () => ({
  getTrustedClientIp: vi.fn(),
}));

describe("POST /api/auth/device/token", () => {
  const createAdminClientMock = vi.mocked(createAdminClient);
  const checkDeviceTokenRateLimitMock = vi.mocked(checkDeviceTokenRateLimit);
  const getTrustedClientIpMock = vi.mocked(getTrustedClientIp);

  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    checkDeviceTokenRateLimitMock.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: 123,
    });

    getTrustedClientIpMock.mockReturnValue("203.0.113.6");

    rpcMock.mockResolvedValue({
      data: [
        {
          status: "pending",
          access_token: null,
          refresh_token: null,
          expires_in: 900,
          error: "authorization_pending",
        },
      ],
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      rpc: rpcMock,
    } as unknown as ReturnType<typeof createAdminClient>);
  });

  it("returns 429 when device-token endpoint rate limit is exceeded", async () => {
    checkDeviceTokenRateLimitMock.mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: 123,
    });

    const response = await POST(
      new Request("https://example.com/api/auth/device/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_code: "dev_rapid",
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    await expect(response.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      error_description: "Too many token polling requests. Please slow down and retry.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("returns deterministic slow_down on rapid repeated polling", async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [
          {
            status: "pending",
            access_token: null,
            refresh_token: null,
            expires_in: 900,
            error: "authorization_pending",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            status: "error",
            access_token: null,
            refresh_token: null,
            expires_in: 895,
            error: "slow_down",
          },
        ],
        error: null,
      });

    const firstResponse = await POST(
      new Request("https://example.com/api/auth/device/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_code: "dev_rapid",
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      })
    );

    const secondResponse = await POST(
      new Request("https://example.com/api/auth/device/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_code: "dev_rapid",
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      })
    );

    expect(firstResponse.status).toBe(400);
    await expect(firstResponse.json()).resolves.toEqual({
      error: "authorization_pending",
      error_description: "The user has not yet authorized this device",
      expires_in: 900,
    });

    expect(secondResponse.status).toBe(400);
    await expect(secondResponse.json()).resolves.toEqual({
      error: "slow_down",
      error_description: "Polling too quickly. Increase your polling interval by 5 seconds.",
      expires_in: 895,
    });

    expect(getTrustedClientIpMock).toHaveBeenCalledTimes(2);
    expect(checkDeviceTokenRateLimitMock).toHaveBeenCalledTimes(2);
    expect(rpcMock).toHaveBeenNthCalledWith(1, "check_device_code", {
      p_device_code: "dev_rapid",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "check_device_code", {
      p_device_code: "dev_rapid",
    });
  });
});
