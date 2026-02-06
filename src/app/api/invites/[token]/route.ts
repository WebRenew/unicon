import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/invites/[token] — Accept an invite (authenticated user)
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find the invite
  const { data: invite, error: inviteError } = await admin
    .from("team_invites")
    .select("*, teams(name, max_members)")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invite not found or already used" },
      { status: 404 }
    );
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    await admin
      .from("team_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);

    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  // Check team capacity
  const { count } = await admin
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", invite.team_id);

  const team = invite.teams as { name: string; max_members: number };
  if ((count ?? 0) >= team.max_members) {
    return NextResponse.json(
      { error: "Team is at maximum capacity" },
      { status: 409 }
    );
  }

  // Check if user is already a member
  const { data: existingMember } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    // Mark invite as accepted even if already a member
    await admin
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return NextResponse.json(
      { error: "You're already a member of this team" },
      { status: 409 }
    );
  }

  // Create membership
  const { error: memberError } = await admin.from("team_members").insert({
    team_id: invite.team_id,
    user_id: user.id,
    role: invite.role === "owner" ? "member" : invite.role, // prevent invite to owner role
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Mark invite as accepted
  await admin
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  return NextResponse.json({
    success: true,
    team: {
      id: invite.team_id,
      name: team.name,
    },
  });
}
