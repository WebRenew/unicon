import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("POST /api/invites/[token]", () => {
  const createClientMock = vi.mocked(createClient);
  const createAdminClientMock = vi.mocked(createAdminClient);
  const getUserMock = vi.fn();
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    getUserMock.mockResolvedValue({
      data: { user: { id: "user_1", email: "Invitee@Example.com" } },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    rpcMock.mockResolvedValue({
      data: [
        {
          success: true,
          error: null,
          team_id: "team_1",
          team_name: "Team One",
        },
      ],
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      rpc: rpcMock,
    } as unknown as ReturnType<typeof createAdminClient>);
  });

  it("passes normalized authenticated email to the invite acceptance RPC", async () => {
    const response = await POST(new Request("https://example.com/api/invites/inv_token"), {
      params: Promise.resolve({ token: "inv_token" }),
    });

    expect(response.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("accept_team_invite_atomic", {
      p_token: "inv_token",
      p_user_id: "user_1",
      p_user_email: "invitee@example.com",
    });
  });

  it("returns 403 when invite email does not match authenticated user email", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: false,
          error: "Invite email does not match authenticated user",
          team_id: null,
          team_name: null,
        },
      ],
      error: null,
    });

    const response = await POST(new Request("https://example.com/api/invites/inv_token"), {
      params: Promise.resolve({ token: "inv_token" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invite email does not match authenticated user",
    });
  });

  it("returns 403 when authenticated email does not match profile email", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: false,
          error: "Authenticated user email does not match profile email",
          team_id: null,
          team_name: null,
        },
      ],
      error: null,
    });

    const response = await POST(new Request("https://example.com/api/invites/inv_token"), {
      params: Promise.resolve({ token: "inv_token" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Authenticated user email does not match profile email",
    });
  });

  it("returns 403 when authenticated user does not have an email", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user_1", email: null } },
      error: null,
    });

    const response = await POST(new Request("https://example.com/api/invites/inv_token"), {
      params: Promise.resolve({ token: "inv_token" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Your account must have a verified email to accept this invite",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
