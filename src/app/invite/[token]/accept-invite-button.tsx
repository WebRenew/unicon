"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { CheckIcon } from "@/components/icons/ui/check";

interface AcceptInviteButtonProps {
  token: string;
  teamName: string;
}

export function AcceptInviteButton({ token, teamName }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        setStatus("error");
        return;
      }

      setStatus("success");
      // Redirect to settings after a brief delay
      setTimeout(() => {
        router.push("/settings");
      }, 1500);
    } catch {
      setError("Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
          <CheckIcon className="w-4 h-4" />
          Joined {teamName}
        </div>
        <p className="text-xs text-muted-foreground">Redirecting to settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAccept}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2Icon className="w-4 h-4 animate-spin" />
        ) : null}
        <span>Accept Invite</span>
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
