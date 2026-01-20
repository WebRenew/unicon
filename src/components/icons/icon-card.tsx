"use client";

import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconRenderer } from "./icon-renderer";
import type { IconData } from "@/types/icon";
import { cn } from "@/lib/utils";
import { getBrandIconColor } from "@/lib/icon-utils";

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

// Tooltip library colors - optimized for inverted tooltip backgrounds
// Light mode: dark tooltip bg needs lighter text (400)
// Dark mode: light tooltip bg needs darker text (600)
const tooltipLibraryColors: Record<string, string> = {
  lucide: "text-orange-400 dark:text-orange-600",
  phosphor: "text-emerald-400 dark:text-emerald-600",
  hugeicons: "text-violet-400 dark:text-violet-600",
};

export function IconCard({ icon, isSelected, onClick }: IconCardProps) {
  const { resolvedTheme } = useTheme();
  const strokeWidth = icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2;
  
  // Get appropriate brand color for current theme (inverts dark colors in dark mode)
  const isDarkMode = resolvedTheme === "dark";
  const brandColor = getBrandIconColor(icon.brandColor, isDarkMode);

  const cardContent = (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center rounded-xl border transition-all duration-200",
        // Responsive padding: smaller on mobile with text, larger on desktop without
        "p-3 md:p-4",
        // Responsive gap: tighter on mobile
        "gap-2 md:gap-3",
        "hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-foreground/30 bg-muted shadow-sm"
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center">
        <IconRenderer 
          svgContent={icon.content} 
          viewBox={icon.viewBox} 
          size={32} 
          strokeWidth={strokeWidth}
          {...(brandColor ? { color: brandColor } : {})}
        />
      </div>

      {/* Mobile: Always show name and badge */}
      <div className="flex flex-col items-center gap-1 md:hidden">
        <span className="text-[11px] font-medium text-foreground/80 truncate max-w-full leading-tight">
          {icon.normalizedName}
        </span>
        <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0", libraryColors[icon.sourceId])}>
          {icon.sourceId}
        </Badge>
      </div>

      {/* Desktop: Only show badge (name shown in tooltip) */}
      <div className="hidden md:flex flex-col items-center">
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", libraryColors[icon.sourceId])}>
          {icon.sourceId}
        </Badge>
      </div>
    </button>
  );

  // On desktop, wrap in tooltip to show name on hover
  // On mobile, tooltip won't trigger (no hover), but name is visible anyway
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="hidden md:block">
        <span className={cn("font-medium", tooltipLibraryColors[icon.sourceId])}>
          {icon.sourceId}
        </span>
        <span className="opacity-50 mx-0.5">:</span>
        <span className="font-medium">{icon.normalizedName}</span>
      </TooltipContent>
    </Tooltip>
  );
}
