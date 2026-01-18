"use client";

import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "./icon-renderer";
import type { IconData } from "@/types/icon";
import { cn } from "@/lib/utils";

interface IconCardProps {
  icon: IconData;
  isSelected?: boolean;
  onClick?: () => void;
}

const libraryColors: Record<string, string> = {
  lucide: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
  phosphor: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  hugeicons: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20",
};

export function IconCard({ icon, isSelected, onClick }: IconCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200",
        "hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-foreground/30 bg-muted shadow-sm"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center">
        <IconRenderer svgContent={icon.svgContent} size={32} strokeWidth={icon.strokeWidth} />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium text-foreground/80 truncate max-w-full">
          {icon.name}
        </span>
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", libraryColors[icon.libraryId])}>
          {icon.libraryId}
        </Badge>
      </div>
    </button>
  );
}
