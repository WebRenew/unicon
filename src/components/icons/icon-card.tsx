"use client";

import { useState, memo, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconRenderer } from "./icon-renderer";
import { IconDetailDialog } from "./icon-detail-dialog";
import type { IconData } from "@/types/icon";
import { cn } from "@/lib/utils";
import { getBrandIconColor } from "@/lib/icon-utils";

interface IconCardProps {
  icon: IconData;
  isSelected?: boolean;
  onClick?: (icon: IconData) => void;
}

const libraryColors: Record<string, string> = {
  lucide: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
  phosphor: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  hugeicons: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20",
  heroicons: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  tabler: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20",
  feather: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20",
  remix: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
  "simple-icons": "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
  iconoir: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20",
};

// Hex colors for gradient border effect on hover
const libraryGradientColors: Record<string, string> = {
  lucide: "#f97316",      // orange-500
  phosphor: "#10b981",    // emerald-500
  hugeicons: "#8b5cf6",   // violet-500
  heroicons: "#3b82f6",   // blue-500
  tabler: "#06b6d4",      // cyan-500
  feather: "#ec4899",     // pink-500
  remix: "#ef4444",       // red-500
  "simple-icons": "#6b7280", // gray-500
  iconoir: "#14b8a6",     // teal-500
};

// Tooltip library colors - optimized for inverted tooltip backgrounds
// Light mode: dark tooltip bg needs lighter text (400)
// Dark mode: light tooltip bg needs darker text (600)
const tooltipLibraryColors: Record<string, string> = {
  lucide: "text-orange-400 dark:text-orange-600",
  phosphor: "text-emerald-400 dark:text-emerald-600",
  hugeicons: "text-violet-400 dark:text-violet-600",
  heroicons: "text-blue-400 dark:text-blue-600",
  tabler: "text-cyan-400 dark:text-cyan-600",
  feather: "text-pink-400 dark:text-pink-600",
  remix: "text-red-400 dark:text-red-600",
  "simple-icons": "text-gray-400 dark:text-gray-600",
  iconoir: "text-teal-400 dark:text-teal-600",
};

export const IconCard = memo(function IconCard({ icon, isSelected, onClick }: IconCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { resolvedTheme } = useTheme();
  const strokeWidth = icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2;

  // Get appropriate brand color for current theme (inverts dark colors in dark mode)
  const isDarkMode = resolvedTheme === "dark";
  const brandColor = getBrandIconColor(icon.brandColor, isDarkMode);

  const handleClick = useCallback(() => {
    setShowDialog(true);
    onClick?.(icon);
  }, [icon, onClick]);

  // Memoize brandColor prop object to prevent unnecessary re-renders
  const iconRendererProps = useMemo(() => {
    const props: {
      svgContent: string;
      viewBox: string;
      size: number;
      strokeWidth: number;
      renderMode: "fill" | "stroke";
      color?: string;
    } = {
      svgContent: icon.content,
      viewBox: icon.viewBox,
      size: 32,
      strokeWidth,
      renderMode: icon.defaultFill ? "fill" : "stroke",
    };
    if (brandColor) {
      props.color = brandColor;
    }
    return props;
  }, [icon.content, icon.viewBox, icon.defaultFill, strokeWidth, brandColor]);

  const cardContent = (
    <button
      onClick={handleClick}
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
      {/* Gradient corner accent on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 0 0, ${libraryGradientColors[icon.sourceId] || "#6b7280"} 0%, transparent 50px)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      {/* Icon */}
      <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center">
        <IconRenderer {...iconRendererProps} />
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
    <>
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
      
      <IconDetailDialog
        icon={icon}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
});
