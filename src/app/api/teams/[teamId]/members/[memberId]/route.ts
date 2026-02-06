import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ teamId: string; memberId: string }>;
}

/**
 * DELETE /api/teams/[teamId]/members/[memberId] — Remove a member (admin+ only)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { teamId, memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check caller's role
  const { data: callerMembership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json(
      { error: "Only admins and owners can remove members" },
      { status: 403 }
    );
  }

  // Get target member
  const { data: targetMember } = await admin
    .from("team_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove the owner
  if (targetMember.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the team owner" },
      { status: 403 }
    );
  }

  // Admins can't remove other admins (only owner can)
  if (targetMember.role === "admin" && callerMembership.role !== "owner") {
    return NextResponse.json(
      { error: "Only the team owner can remove admins" },
      { status: 403 }
    );
  }

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
