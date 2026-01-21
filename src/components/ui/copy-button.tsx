"use client";

import { useState, useCallback } from "react";
import { CopyIcon } from "@/components/icons/ui/copy";
import { CheckIcon } from "@/components/icons/ui/check";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-md transition-all duration-200",
        "text-white/40 hover:text-white/80 hover:bg-white/10",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        copied && "text-emerald-400 hover:text-emerald-400",
        className
      )}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <CopyIcon className="w-4 h-4" />
      )}
    </button>
  );
}
