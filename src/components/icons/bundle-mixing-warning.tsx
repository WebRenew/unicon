"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertTriangleIcon } from "@/components/icons/ui/alert-triangle";
import { XIcon } from "@/components/icons/ui/x";
import { analyzeBundleMixing, type MixingAnalysis } from "@/lib/bundle-utils";
import type { IconData } from "@/types/icon";

const STORAGE_KEY = "unicon-dismiss-mixing-warning";

function getStoredDismissedState(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

interface BundleMixingWarningProps {
  items: IconData[];
}

export function BundleMixingWarning({ items }: BundleMixingWarningProps) {
  const [isDismissed, setIsDismissed] = useState(getStoredDismissedState);

  // Analyze the bundle for mixing issues
  const analysis: MixingAnalysis = useMemo(
    () => analyzeBundleMixing(items),
    [items]
  );

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Don't render if no inconsistency or user dismissed
  if (!analysis.hasInconsistency || isDismissed) {
    return null;
  }

  // Format stroke width groups for display
  const strokeGroups = Array.from(analysis.strokeWidthGroups.entries())
    .map(([width, libs]) => ({
      width,
      libs: libs.join(", "),
    }))
    .sort((a, b) => b.width - a.width);

  return (
    <div className="mx-4 mt-4 p-3 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-mono text-blue-700 dark:text-blue-400 font-medium">
              Mixed icon libraries
            </p>
            <button
              onClick={handleDismiss}
              className="p-0.5 text-blue-600/50 dark:text-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
              aria-label="Dismiss warning"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1">
            Different stroke weights may look inconsistent:
          </p>
          <div className="mt-1.5 space-y-0.5">
            {strokeGroups.map(({ width, libs }) => (
              <div
                key={width}
                className="text-[10px] font-mono text-blue-600/60 dark:text-blue-400/60"
              >
                <span className="text-blue-700 dark:text-blue-300">{width}px</span>
                <span className="mx-1">→</span>
                <span>{libs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reset the dismissed state (for testing or settings)
 */
export function resetMixingWarningDismissal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
