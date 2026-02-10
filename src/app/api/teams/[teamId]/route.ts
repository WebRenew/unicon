import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId] — Get team details + members
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check membership
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  // Fetch team, members, and pending invites in parallel
  const [teamResult, membersResult, invitesResult] = await Promise.all([
    admin.from("teams").select("*").eq("id", teamId).single(),
    admin
      .from("team_members")
      .select("id, team_id, user_id, role, created_at, profiles(id, email, full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
    admin
      .from("team_invites")
      .select("id, team_id, email, role, status, expires_at, created_at, invited_by, profiles!team_invites_invited_by_fkey(full_name, email)")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (teamResult.error) {
    return NextResponse.json({ error: teamResult.error.message }, { status: 500 });
  }

  // Shape members with nested profile
  const members = (membersResult.data ?? []).map((m) => ({
    id: m.id,
    team_id: m.team_id,
    user_id: m.user_id,
    role: m.role,
    created_at: m.created_at,
    profile: m.profiles as unknown as Record<string, unknown> | null,
  }));

  const invites = (invitesResult.data ?? []).map((inv) => ({
    id: inv.id,
    team_id: inv.team_id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
    invited_by: inv.invited_by,
    inviter: inv.profiles as unknown as Record<string, unknown> | null,
  }));

  return NextResponse.json(
    {
      team: {
        ...teamResult.data,
        members,
        invites,
      },
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        "Vary": "Cookie",
      },
    }
  );
}

/**
 * PATCH /api/teams/[teamId] — Update team name (owner only)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: team } = await admin
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (!team || team.owner_id !== user.id) {
    return NextResponse.json({ error: "Only the team owner can update the team" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name } = body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Team name must be at least 2 characters" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await admin
    .from("teams")
    .update({ name: name.trim() })
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: updated });
}

/**
 * DELETE /api/teams/[teamId] — Delete team (owner only)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: team } = await admin
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (!team || team.owner_id !== user.id) {
    return NextResponse.json({ error: "Only the team owner can delete the team" }, { status: 403 });
  }

  const { error } = await admin.from("teams").delete().eq("id", teamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
