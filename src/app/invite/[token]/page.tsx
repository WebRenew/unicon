import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UsersIcon } from "@/components/icons/ui/users";
import { AcceptInviteButton } from "./accept-invite-button";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up the invite
  const { data: invite } = await admin
    .from("team_invites")
    .select("*, teams(name), profiles!team_invites_invited_by_fkey(full_name, email)")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invite) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
              <UsersIcon className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-black dark:text-white">
              Invalid Invite
            </h1>
            <p className="text-sm text-muted-foreground">
              This invite link is invalid, has already been used, or was revoked.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    await admin
      .from("team_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);

    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <UsersIcon className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-lg font-semibold text-black dark:text-white">
              Invite Expired
            </h1>
            <p className="text-sm text-muted-foreground">
              This invite has expired. Ask the team admin to send a new one.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const team = invite.teams as { name: string };
  const inviter = invite.profiles as { full_name: string | null; email: string | null };
  const inviterName = inviter?.full_name ?? inviter?.email ?? "A teammate";

  if (!user) {
    // Not logged in — redirect to login with invite token preserved
    redirect(`/?login=required&invite=${token}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto">
            <UsersIcon className="w-6 h-6 text-black dark:text-white" />
          </div>
          <h1 className="text-lg font-semibold text-black dark:text-white">
            Join {team.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {inviterName} invited you to join <strong>{team.name}</strong> as a{" "}
            {invite.role}.
          </p>
          <AcceptInviteButton token={token} teamName={team.name} />
        </div>
      </div>
    </div>
  );
}
