"use client";

import { useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { CopyIcon } from "@/components/icons/ui/copy";
import { CheckIcon } from "@/components/icons/ui/check";
import { cn } from "@/lib/utils";

interface CopyPageButtonProps {
  markdown: string;
  className?: string;
}

/**
 * Button to copy page content as Markdown for sharing with LLMs.
 */
export function CopyPageButton({ markdown, className }: CopyPageButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("Failed to copy page to clipboard:", error);
    }
  }, [markdown]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
        "border border-border bg-background hover:bg-accent",
        "text-muted-foreground hover:text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-aqua)]/50",
        copied && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className
      )}
      aria-label={copied ? "Copied page content" : "Copy page as Markdown"}
    >
      {copied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5" />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon className="w-3.5 h-3.5" />
          Copy Page
        </>
      )}
    </button>
  );
}
