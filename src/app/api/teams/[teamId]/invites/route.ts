import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTeamInviteEmail } from "@/lib/email/resend";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]/invites — List pending invites (admin+ only)
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

  const { data: invites, error } = await admin
    .from("team_invites")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: invites ?? [] });
}

/**
 * POST /api/teams/[teamId]/invites — Send an invite (admin+ only)
 */
export async function POST(request: Request, { params }: RouteParams) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const inviteRole = role === "admin" ? "admin" : "member";

  // Check team member count vs max
  const [teamResult, memberCountResult] = await Promise.all([
    admin.from("teams").select("name, max_members, owner_id").eq("id", teamId).single(),
    admin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  if (teamResult.error || !teamResult.data) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const currentCount = memberCountResult.count ?? 0;
  if (currentCount >= teamResult.data.max_members) {
    return NextResponse.json(
      { error: `Team is at maximum capacity (${teamResult.data.max_members} members)` },
      { status: 409 }
    );
  }

  // Check if user is already a member
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMember } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 409 }
      );
    }
  }

  // Check for existing pending invite
  const { data: existingInvite } = await admin
    .from("team_invites")
    .select("id")
    .eq("team_id", teamId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite is already pending for this email" },
      { status: 409 }
    );
  }

  // Generate token
  const { data: token, error: tokenError } = await admin.rpc("generate_invite_token");

  if (tokenError || !token) {
    return NextResponse.json({ error: "Failed to generate invite token" }, { status: 500 });
  }

  // Create invite (7-day expiry)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: insertError } = await admin
    .from("team_invites")
    .insert({
      team_id: teamId,
      email: normalizedEmail,
      role: inviteRole,
      token: token as string,
      invited_by: user.id,
      status: "pending",
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation (revoked invite for same email)
    if (insertError.code === "23505") {
      // Update existing revoked/expired invite instead
      const { data: updatedInvite, error: updateError } = await admin
        .from("team_invites")
        .update({
          role: inviteRole,
          token: token as string,
          invited_by: user.id,
          status: "pending",
          expires_at: expiresAt,
        })
        .eq("team_id", teamId)
        .eq("email", normalizedEmail)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Send email with updated invite
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`;
      const inviterProfile = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const inviterName =
        inviterProfile.data?.full_name ?? inviterProfile.data?.email ?? "A teammate";

      try {
        await sendTeamInviteEmail({
          to: normalizedEmail,
          teamName: teamResult.data.name,
          inviterName,
          inviteUrl,
        });
      } catch (emailError) {
        logger.error("Failed to send invite email:", emailError);
      }

      return NextResponse.json({ invite: updatedInvite }, { status: 201 });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send invite email
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`;
  const inviterProfile = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const inviterName =
    inviterProfile.data?.full_name ?? inviterProfile.data?.email ?? "A teammate";

  try {
    await sendTeamInviteEmail({
      to: normalizedEmail,
      teamName: teamResult.data.name,
      inviterName,
      inviteUrl,
    });
  } catch (emailError) {
    logger.error("Failed to send invite email:", emailError);
    // Don't fail the invite creation — email delivery is best-effort
  }

  return NextResponse.json({ invite }, { status: 201 });
}
