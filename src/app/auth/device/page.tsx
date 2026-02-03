"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/auth/login-dialog";
import { CheckCircleIcon } from "@/components/icons/ui/check-circle";
import { XCircleIcon } from "@/components/icons/ui/x-circle";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { TerminalIcon } from "@/components/icons/ui/terminal";

function DeviceAuthContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [userCode, setUserCode] = useState(searchParams.get("code") || "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const formatCode = (input: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    // Insert dash after 4 characters
    if (cleaned.length > 4) {
      return cleaned.slice(0, 4) + "-" + cleaned.slice(4, 8);
    }
    return cleaned;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setUserCode(formatted);
  };

  const handleAuthorize = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    const cleanCode = userCode.replace(/-/g, "");
    if (cleanCode.length !== 8) {
      setError("Please enter a valid 8-character code");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/auth/device/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: userCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to authorize device");
        setStatus("error");
        return;
      }

      setClientName(data.client_name);
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-aqua)] to-[var(--accent-purple)] mb-4">
            <TerminalIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authorize Device</h1>
          <p className="text-muted-foreground mt-2">
            Enter the code shown in your CLI or MCP client
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {status === "success" ? (
            <div className="text-center py-4">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Device Authorized
              </h2>
              <p className="text-muted-foreground mb-6">
                Your {clientName || "device"} can now access your bundles.
                <br />
                You can close this window and return to your terminal.
              </p>
              <Link
                href="/bundles"
                className="text-sm text-[var(--accent-aqua)] hover:underline"
              >
                View my bundles
              </Link>
            </div>
          ) : status === "error" ? (
            <div className="text-center py-4">
              <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Authorization Failed
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setError(null);
                }}
                className="px-4 py-2 bg-[var(--accent-aqua)] hover:bg-[var(--accent-aqua)]/90 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.user_metadata?.avatar_url || "/placeholder-avatar.png"}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Code input */}
              <div className="mb-6">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Device Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={userCode}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-aqua)] focus:border-transparent placeholder:text-muted-foreground/50"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {/* Authorize button */}
              <button
                onClick={handleAuthorize}
                disabled={status === "loading" || userCode.replace(/-/g, "").length < 8}
                className="w-full px-4 py-3 bg-[var(--accent-aqua)] hover:bg-[var(--accent-aqua)]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                    Authorizing...
                  </>
                ) : user ? (
                  "Authorize Device"
                ) : (
                  "Sign in to Authorize"
                )}
              </button>


            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Having trouble?{" "}
          <a
            href="/docs/cli"
            className="text-[var(--accent-aqua)] hover:underline"
          >
            Read the CLI docs
          </a>
        </p>
      </div>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        message="Sign in to authorize your CLI or MCP client"
      />
    </div>
  );
}

export default function DeviceAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DeviceAuthContent />
    </Suspense>
  );
}
