"use client";

import { useState } from "react";
import { ExternalLinkIcon } from "@/components/icons/ui/external-link";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { MinusIcon } from "@/components/icons/ui/minus";

interface ManageSubscriptionButtonProps {
  variant?: "manage" | "downgrade";
}

export function ManageSubscriptionButton({
  variant = "manage",
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  if (variant === "downgrade") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MinusIcon className="w-3.5 h-3.5" />
        )}
        Downgrade
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ExternalLinkIcon className="w-3.5 h-3.5" />
      )}
      Manage
    </button>
  );
}
