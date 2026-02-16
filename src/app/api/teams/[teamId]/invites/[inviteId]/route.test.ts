import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

type MembershipResult = {
  data: { role: string } | null;
  error: { message: string } | null;
};

type InviteLookupResult = {
  data: { id: string; status: string } | null;
  error: { message: string } | null;
};

type InviteRevokeResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

function createAdminMock({
  membershipResult,
  revokeResult,
  lookupResult,
}: {
  membershipResult: MembershipResult;
  revokeResult: InviteRevokeResult;
  lookupResult: InviteLookupResult;
}) {
  const membershipMaybeSingle = vi.fn().mockResolvedValue(membershipResult);
  const membershipEqUser = vi.fn().mockReturnValue({ maybeSingle: membershipMaybeSingle });
  const membershipEqTeam = vi.fn().mockReturnValue({ eq: membershipEqUser });
  const membershipSelect = vi.fn().mockReturnValue({ eq: membershipEqTeam });

  const revokeMaybeSingle = vi.fn().mockResolvedValue(revokeResult);
  const revokeSelect = vi.fn().mockReturnValue({ maybeSingle: revokeMaybeSingle });
  const revokeEqStatus = vi.fn().mockReturnValue({ select: revokeSelect });
  const revokeEqTeam = vi.fn().mockReturnValue({ eq: revokeEqStatus });
  const revokeEqId = vi.fn().mockReturnValue({ eq: revokeEqTeam });
  const update = vi.fn().mockReturnValue({ eq: revokeEqId });

  const lookupMaybeSingle = vi.fn().mockResolvedValue(lookupResult);
  const lookupEqTeam = vi.fn().mockReturnValue({ maybeSingle: lookupMaybeSingle });
  const lookupEqId = vi.fn().mockReturnValue({ eq: lookupEqTeam });
  const lookupSelect = vi.fn().mockReturnValue({ eq: lookupEqId });

  const from = vi.fn((table: string) => {
    if (table === "team_members") {
      return { select: membershipSelect };
    }

    if (table === "team_invites") {
      return { update, select: lookupSelect };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    from,
    lookupSelect,
    lookupMaybeSingle,
  };
}

describe("DELETE /api/teams/[teamId]/invites/[inviteId]", () => {
  const createClientMock = vi.mocked(createClient);
  const createAdminClientMock = vi.mocked(createAdminClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "unauthorized" },
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(new Request("https://example.com"), {
      params: Promise.resolve({ teamId: "team-1", inviteId: "invite-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("returns 403 when caller is not a team admin", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const admin = createAdminMock({
      membershipResult: { data: { role: "member" }, error: null },
      revokeResult: { data: null, error: null },
      lookupResult: { data: null, error: null },
    });
    createAdminClientMock.mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const response = await DELETE(new Request("https://example.com"), {
      params: Promise.resolve({ teamId: "team-1", inviteId: "invite-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });

  it("returns 404 when invite does not exist", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const admin = createAdminMock({
      membershipResult: { data: { role: "admin" }, error: null },
      revokeResult: { data: null, error: null },
      lookupResult: { data: null, error: null },
    });
    createAdminClientMock.mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const response = await DELETE(new Request("https://example.com"), {
      params: Promise.resolve({ teamId: "team-1", inviteId: "invite-404" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Invite not found" });
  });

  it("returns 409 when invite exists but is no longer pending", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const admin = createAdminMock({
      membershipResult: { data: { role: "owner" }, error: null },
      revokeResult: { data: null, error: null },
      lookupResult: { data: { id: "invite-1", status: "accepted" }, error: null },
    });
    createAdminClientMock.mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const response = await DELETE(new Request("https://example.com"), {
      params: Promise.resolve({ teamId: "team-1", inviteId: "invite-1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Invite is accepted and cannot be revoked",
    });
  });

  it("returns 200 when a pending invite is revoked", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const admin = createAdminMock({
      membershipResult: { data: { role: "admin" }, error: null },
      revokeResult: { data: { id: "invite-1" }, error: null },
      lookupResult: { data: null, error: null },
    });
    createAdminClientMock.mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const response = await DELETE(new Request("https://example.com"), {
      params: Promise.resolve({ teamId: "team-1", inviteId: "invite-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(admin.lookupSelect).not.toHaveBeenCalled();
    expect(admin.lookupMaybeSingle).not.toHaveBeenCalled();
  });
});
