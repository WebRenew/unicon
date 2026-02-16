import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ teamId: string; inviteId: string }>;
}

/**
 * DELETE /api/teams/[teamId]/invites/[inviteId] — Revoke an invite (admin+ only)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { teamId, inviteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check admin role
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data: revokedInvite, error: revokeError } = await admin
    .from("team_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("team_id", teamId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (revokeError) {
    return NextResponse.json({ error: revokeError.message }, { status: 500 });
  }

  if (revokedInvite) {
    return NextResponse.json({ success: true });
  }

  const { data: existingInvite, error: existingInviteError } = await admin
    .from("team_invites")
    .select("id, status")
    .eq("id", inviteId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingInviteError) {
    return NextResponse.json({ error: existingInviteError.message }, { status: 500 });
  }

  if (!existingInvite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json(
    { error: `Invite is ${existingInvite.status} and cannot be revoked` },
    { status: 409 }
  );
}
