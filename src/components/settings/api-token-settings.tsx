"use client";

import { useState, useCallback } from "react";
import { KeyIcon } from "@/components/icons/ui/key";
import { PlusIcon } from "@/components/icons/ui/plus";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { Trash2Icon } from "@/components/icons/ui/trash-2";
import { CopyIcon } from "@/components/icons/ui/copy";
import { CheckIcon } from "@/components/icons/ui/check";
import type { ApiSession } from "@/types/database";

interface ApiTokenSettingsProps {
  initialSessions: ApiSession[];
}

export function ApiTokenSettings({ initialSessions }: ApiTokenSettingsProps) {
  const [sessions, setSessions] = useState<ApiSession[]>(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          API Tokens
        </h2>
        <span className="text-xs text-muted-foreground">
          {sessions.length} active
        </span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
          <KeyIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            Personal API tokens
          </p>
          <p className="text-xs text-muted-foreground">
            Use tokens with SSE/MCP clients like v0, Cursor, and others
          </p>
        </div>
      </div>

      {/* Token list */}
      {sessions.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {sessions.map((session) => (
            <TokenRow
              key={session.id}
              session={session}
              onRevoked={(id) => {
                setSessions((prev) => prev.filter((s) => s.id !== id));
                setError(null);
              }}
              setError={setError}
            />
          ))}
        </div>
      )}

      {/* Generate form */}
      {showForm ? (
        <GenerateForm
          onGenerated={(session) => {
            setSessions((prev) => [session, ...prev]);
            setShowForm(false);
            setError(null);
          }}
          onCancel={() => setShowForm(false)}
          setError={setError}
        />
      ) : (
        <button
          onClick={() => {
            setShowForm(true);
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Generate Token
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}

// --- Token Row ---

function TokenRow({
  session,
  onRevoked,
  setError,
}: {
  session: ApiSession;
  onRevoked: (id: string) => void;
  setError: (error: string | null) => void;
}) {
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/tokens/${session.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke token");
        return;
      }
      onRevoked(session.id);
    } catch {
      setError("Failed to revoke token");
    } finally {
      setRevoking(false);
    }
  }

  const lastUsed = session.last_used_at
    ? formatRelativeDate(session.last_used_at)
    : "Never used";

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
          <KeyIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-black dark:text-white truncate">
            {session.name || session.client_name}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-foreground font-mono">
              {session.token_preview}
            </code>
            <span className="text-xs text-muted-foreground">
              {lastUsed}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={handleRevoke}
        disabled={revoking}
        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
        title="Revoke token"
      >
        {revoking ? (
          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2Icon className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

// --- Generate Form ---

function GenerateForm({
  onGenerated,
  onCancel,
  setError,
}: {
  onGenerated: (session: ApiSession) => void;
  onCancel: () => void;
  setError: (error: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  }, [newToken]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate token");
        return;
      }

      setNewToken(data.access_token);

      // Add to the list with a preview
      const token = data.access_token as string;
      onGenerated({
        id: data.session_id,
        name: name.trim() || null,
        client_name: "Web",
        scope: "bundles:read",
        last_used_at: null,
        created_at: new Date().toISOString(),
        token_preview: "uni_****" + token.slice(-4),
      });
    } catch {
      setError("Failed to generate token");
    } finally {
      setGenerating(false);
    }
  }

  // Show the new token once generated
  if (newToken) {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            Token created — copy it now, you won&apos;t see it again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-black dark:text-white bg-black/5 dark:bg-white/5 px-2 py-1 rounded break-all select-all">
              {newToken}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              aria-label={copied ? "Copied" : "Copy token"}
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Token name (optional)"
        className="flex-1 px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
        disabled={generating}
        maxLength={50}
        autoFocus
      />
      <button
        type="submit"
        disabled={generating}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {generating ? (
          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <KeyIcon className="w-3.5 h-3.5" />
        )}
        Generate
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={generating}
        className="px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
    </form>
  );
}

// --- Helpers ---

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
