import type { SupabaseClient } from "@supabase/supabase-js";
import type { Team, TeamRole, Profile } from "@/types/database";

/**
 * Typed wrappers for Supabase PostgREST join queries.
 *
 * PostgREST embedded joins return data whose TypeScript shape doesn't match
 * Supabase's generated types. These helpers centralise the single required
 * cast so every call-site gets clean, properly-typed results.
 */

// ──────────────────────────────────────────────
// Return types
// ──────────────────────────────────────────────

/** Team enriched with the requesting user's role. */
export interface TeamWithRole extends Team {
  role: TeamRole;
}

/** Team member with their profile information. */
export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  profile: Profile | null;
}

/** Pending team invite with the inviter's profile snippet. */
export interface TeamInviteRow {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
  inviter: { full_name: string | null; email: string | null } | null;
}

// ──────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────

/**
 * List every team a user belongs to, together with their role in each.
 *
 * Uses: `team_members ← teams` join.
 */
export async function getUserTeams(admin: SupabaseClient, userId: string) {
  const { data: memberships, error } = await admin
    .from("team_members")
    .select(
      "team_id, role, teams(id, name, slug, owner_id, max_members, created_at, updated_at)"
    )
    .eq("user_id", userId);

  if (error) return { data: null as null, error };

  const teams: TeamWithRole[] = (memberships ?? []).map((m) => ({
    // PostgREST returns the joined row as an object, but TS sees it as the
    // generated (array | null) union — cast once here so callers don't have to.
    ...(m.teams as unknown as Team),
    role: m.role as TeamRole,
  }));

  return { data: teams, error: null };
}

/**
 * Fetch members of a team with embedded profile data.
 *
 * Uses: `team_members ← profiles` join.
 */
export async function getTeamMembers(admin: SupabaseClient, teamId: string) {
  const { data, error } = await admin
    .from("team_members")
    .select(
      "id, team_id, user_id, role, created_at, profiles(id, email, full_name, avatar_url)"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) return { data: null as null, error };

  const members: TeamMemberRow[] = (data ?? []).map((m) => ({
    id: m.id,
    team_id: m.team_id,
    user_id: m.user_id,
    role: m.role as TeamRole,
    created_at: m.created_at,
    profile: (m.profiles as unknown as Profile) ?? null,
  }));

  return { data: members, error: null };
}

/**
 * Fetch pending invites for a team, including the inviter's name/email.
 *
 * Uses: `team_invites ← profiles` join via `team_invites_invited_by_fkey`.
 */
export async function getTeamPendingInvites(
  admin: SupabaseClient,
  teamId: string
) {
  const { data, error } = await admin
    .from("team_invites")
    .select(
      "id, team_id, email, role, status, expires_at, created_at, invited_by, profiles!team_invites_invited_by_fkey(full_name, email)"
    )
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { data: null as null, error };

  const invites: TeamInviteRow[] = (data ?? []).map((inv) => ({
    id: inv.id,
    team_id: inv.team_id,
    email: inv.email,
    role: inv.role as TeamRole,
    status: inv.status,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
    invited_by: inv.invited_by,
    inviter:
      (inv.profiles as unknown as {
        full_name: string | null;
        email: string | null;
      }) ?? null,
  }));

  return { data: invites, error: null };
}
