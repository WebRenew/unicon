import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ token: string }>;
}

interface AcceptInviteResult {
  success: boolean;
  error: string | null;
  team_id: string | null;
  team_name: string | null;
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

  const normalizedUserEmail = user.email?.trim().toLowerCase();
  if (!normalizedUserEmail) {
    return NextResponse.json(
      { error: "Your account must have a verified email to accept this invite" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("accept_team_invite_atomic", {
    p_token: token,
    p_user_id: user.id,
    p_user_email: normalizedUserEmail,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data?.[0] as AcceptInviteResult | undefined;
  if (!result) {
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }

  if (!result.success) {
    const message = result.error ?? "Failed to accept invite";
    const status = mapInviteErrorToStatus(message);
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    success: true,
    team: {
      id: result.team_id,
      name: result.team_name,
    },
  });
}

function mapInviteErrorToStatus(error: string): number {
  if (error === "Invite not found or already used") return 404;
  if (error === "This invite has expired") return 410;
  if (error === "Team is at maximum capacity") return 409;
  if (error === "You're already a member of this team") return 409;
  if (error === "Team not found") return 404;
  if (error === "Invite email does not match authenticated user") return 403;
  if (error === "Authenticated user email is required") return 403;
  if (error === "Authenticated user email does not match profile email") return 403;
  return 400;
}
