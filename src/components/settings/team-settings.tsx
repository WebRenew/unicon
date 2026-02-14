"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { UsersIcon } from "@/components/icons/ui/users";
import { UserPlusIcon } from "@/components/icons/ui/user-plus";
import { MailIcon } from "@/components/icons/ui/mail";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { XIcon } from "@/components/icons/ui/x";
import { Trash2Icon } from "@/components/icons/ui/trash-2";
import type { TeamWithMembers, TeamMember, TeamInvite } from "@/types/database";

interface TeamSettingsProps {
  initialTeam: TeamWithMembers | null;
  userId: string;
}

export function TeamSettings({ initialTeam, userId }: TeamSettingsProps) {
  const [team, setTeam] = useState<TeamWithMembers | null>(initialTeam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!team) {
    return <CreateTeamForm onTeamCreated={setTeam} setError={setError} error={error} />;
  }

  return (
    <TeamManagement
      team={team}
      userId={userId}
      onTeamUpdated={setTeam}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
    />
  );
}

// --- Create Team Form ---

function CreateTeamForm({
  onTeamCreated,
  setError,
  error,
}: {
  onTeamCreated: (team: TeamWithMembers) => void;
  setError: (error: string | null) => void;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create team");
        return;
      }

      // Fetch full team details
      const teamRes = await fetch(`/api/teams/${data.team.id}`);
      const teamData = await teamRes.json();

      if (teamRes.ok) {
        onTeamCreated(teamData.team);
      }
    } catch {
      setError("Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Team</h2>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            Create a team
          </p>
          <p className="text-xs text-muted-foreground">
            Share icon bundles with up to 5 team members
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="flex-1 px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
          disabled={creating}
          minLength={2}
          required
        />
        <button
          type="submit"
          disabled={creating || name.trim().length < 2}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {creating ? (
            <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UsersIcon className="w-3.5 h-3.5" />
          )}
          Create
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

// --- Team Management ---

function TeamManagement({
  team,
  userId,
  onTeamUpdated,
  loading,
  setLoading,
  error,
  setError,
}: {
  team: TeamWithMembers;
  userId: string;
  onTeamUpdated: (team: TeamWithMembers) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  const isOwner = team.owner_id === userId;
  const callerRole = team.members.find((m) => m.user_id === userId)?.role;
  const isAdmin = callerRole === "owner" || callerRole === "admin";

  const refreshTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${team.id}`);
      const data = await res.json();
      if (res.ok) {
        onTeamUpdated(data.team);
      }
    } catch {
      // Silently fail refresh
    }
  }, [team.id, onTeamUpdated]);

  async function handleRemoveMember(memberId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teams/${team.id}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove member");
        return;
      }
      await refreshTeam();
    } catch {
      setError("Failed to remove member");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teams/${team.id}/invites/${inviteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke invite");
        return;
      }
      await refreshTeam();
    } catch {
      setError("Failed to revoke invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Team</h2>
        <span className="text-xs text-muted-foreground">
          {team.members.length} / {team.max_members} members
        </span>
      </div>

      {/* Team name */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            {team.name}
          </p>
          <p className="text-xs text-muted-foreground">/{team.slug}</p>
        </div>
      </div>

      {/* Members list */}
      <div className="space-y-2 mb-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Members
        </p>
        {team.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isSelf={member.user_id === userId}
            onRemove={() => handleRemoveMember(member.id)}
            disabled={loading}
          />
        ))}
      </div>

      {/* Pending invites */}
      {isAdmin && team.invites.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending Invites
          </p>
          {team.invites.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              onRevoke={() => handleRevokeInvite(invite.id)}
              disabled={loading}
            />
          ))}
        </div>
      )}

      {/* Invite form */}
      {isAdmin && team.members.length < team.max_members && (
        <InviteForm
          teamId={team.id}
          onInviteSent={refreshTeam}
          setError={setError}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}

// --- Member Row ---

function MemberRow({
  member,
  isOwner,
  isAdmin,
  isSelf,
  onRemove,
  disabled,
}: {
  member: TeamMember;
  isOwner: boolean;
  isAdmin: boolean;
  isSelf: boolean;
  onRemove: () => void;
  disabled: boolean;
}) {
  const profile = member.profile;
  const displayName = profile?.full_name ?? profile?.email ?? "Unknown";
  const canRemove =
    !isSelf &&
    member.role !== "owner" &&
    (isOwner || (isAdmin && member.role === "member"));

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={28}
              height={28}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-medium text-black/70 dark:text-white/70">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-black dark:text-white truncate">
            {displayName}
            {isSelf && (
              <span className="text-muted-foreground ml-1">(you)</span>
            )}
          </p>
          {profile?.email && (
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RoleBadge role={member.role} />
        {canRemove && (
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            title="Remove member"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Invite Row ---

function InviteRow({
  invite,
  onRevoke,
  disabled,
}: {
  invite: TeamInvite;
  onRevoke: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
          <MailIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{invite.email}</p>
          <p className="text-xs text-muted-foreground">
            Expires{" "}
            {new Date(invite.expires_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RoleBadge role={invite.role} />
        <button
          onClick={onRevoke}
          disabled={disabled}
          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          title="Revoke invite"
        >
          <Trash2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- Invite Form ---

function InviteForm({
  teamId,
  onInviteSent,
  setError,
}: {
  teamId: string;
  onInviteSent: () => void;
  setError: (error: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [sending, setSending] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invite");
        return;
      }

      setEmail("");
      onInviteSent();
    } catch {
      setError("Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleInvite} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="flex-1 px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
        disabled={sending}
        required
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "member" | "admin")}
        className="px-2 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
        disabled={sending}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={sending || !email.trim()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        {sending ? (
          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <UserPlusIcon className="w-3.5 h-3.5" />
        )}
        Invite
      </button>
    </form>
  );
}

// --- Role Badge ---

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner:
      "bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
    admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    member: "bg-black/5 dark:bg-white/5 text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[role] ?? styles.member}`}
    >
      {role}
    </span>
  );
}
