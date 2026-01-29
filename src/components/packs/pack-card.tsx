"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons/ui/check";
import { TerminalIcon } from "@/components/icons/ui/terminal";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import type { StarterPack } from "@/lib/starter-packs";

interface PackCardProps {
  pack: StarterPack;
  onAddPack: (pack: StarterPack) => void;
}

/** Tailwind color classes for pack accent colors */
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  zinc: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-600 dark:text-pink-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-600 dark:text-violet-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-600 dark:text-rose-400" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-600 dark:text-slate-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  sky: { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-600 dark:text-sky-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-600 dark:text-red-400" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600 dark:text-orange-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-600 dark:text-teal-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-600 dark:text-green-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-600 dark:text-purple-400" },
};

const DEFAULT_COLOR = { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400" };

function getColorClasses(color: string): { bg: string; border: string; text: string } {
  return COLOR_CLASSES[color] ?? DEFAULT_COLOR;
}

export function PackCard({ pack, onAddPack }: PackCardProps) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const colorClasses = getColorClasses(pack.color);

  // Generate CLI command
  const iconSample = pack.iconNames.slice(0, 5).join(" ");
  const command = `npx @webrenew/unicon bundle --query "${iconSample}" --limit ${pack.iconNames.length}`;

  const handleCopyCommand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch {
      // Clipboard API failed - user will see no feedback, which is acceptable
    }
  };

  const isBrandPack = pack.id.startsWith("brand-");

  return (
    <div
      className={`group rounded-xl border ${colorClasses.border} ${colorClasses.bg} hover:border-opacity-40 dark:hover:bg-[var(--accent-mint)]/5 transition-all`}
    >
      {/* Main clickable area */}
      <button
        onClick={() => onAddPack(pack)}
        className="w-full p-5 pb-3 text-left"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-black dark:text-white">
              {pack.name}
            </span>
            {isBrandPack && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50">
                Brand
              </span>
            )}
          </div>
          <ArrowRightIcon className="w-4 h-4 text-black/20 dark:text-white/20 group-hover:text-black/40 dark:group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed mb-3">
          {pack.description}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${colorClasses.text}`}>
            {pack.iconNames.length} icons
          </span>
        </div>
      </button>

      {/* CLI Command */}
      <div className="px-5 pb-4">
        <button
          onClick={handleCopyCommand}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group/cmd"
          title="Copy CLI command"
        >
          {copiedCommand ? (
            <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <TerminalIcon className="w-3.5 h-3.5 text-black/40 dark:text-white/40 group-hover/cmd:text-black/60 dark:group-hover/cmd:text-white/60 shrink-0" />
          )}
          <span className="text-[11px] font-mono text-black/50 dark:text-white/50 truncate">
            {copiedCommand ? "Copied!" : (
              <>
                <span className="dark:text-[var(--accent-mint)]">npx</span>
                {command.slice(3)}
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
