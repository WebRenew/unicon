"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { CopyIcon, CheckIcon, ExternalLinkIcon, PlusIcon, MinusIcon, Maximize2Icon } from "@/components/icons/ui";
import {
  toPascalCase,
  getSvgAttributesJsx,
  generateRenderableSvg,
  generateRawSvg,
  generateUsageExample,
  getBrandIconColor,
  DEFAULT_STROKE,
} from "@/lib/icon-utils";
import type { IconData } from "@/types/icon";
import { IconDetailDialog } from "./icon-detail-dialog";

export type IconStyle = "metal" | "brutal" | "glow";

export const ICON_STYLES: Record<IconStyle, { container: string; icon: string; css: string }> = {
  metal: {
    container:
      "rounded-xl dark:bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] bg-[linear-gradient(to_bottom,#fff_0%,#f5f5f5_8%,#eee_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.1)] dark:border-t dark:border-[#666]/30 border border-black/10 hover:brightness-105 dark:hover:brightness-110",
    icon: "dark:text-white/80 text-black/70",
    css: `/* Metal Icon Style */
.metal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(to bottom, #555 0%, #222 8%, #111 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4);
  border-top: 1px solid rgba(102,102,102,0.3);
}`,
  },
  brutal: {
    container:
      "rounded-none bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff]",
    icon: "text-black dark:text-white",
    css: `/* Brutal Icon Style */
.brutal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 0;
  background: white; border: 2px solid black;
  box-shadow: 2px 2px 0 0 #000;
}`,
  },
  glow: {
    container:
      "rounded-xl dark:bg-[#0a0a0f] bg-purple-50 border dark:border-purple-500/10 border-purple-200 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    icon: "dark:text-purple-300/70 text-purple-600/80",
    css: `/* Glow Icon Style */
.glow-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: #0a0a0f;
  border: 1px solid rgba(168,85,247,0.1);
}`,
  },
};

/** Stroke weight presets for consistent icon rendering */
export type StrokePreset = "thin" | "regular" | "bold";

export const STROKE_PRESETS: Record<StrokePreset, { value: number; label: string }> = {
  thin: { value: 1.25, label: "Thin" },
  regular: { value: 1.75, label: "Regular" },
  bold: { value: 2.5, label: "Bold" },
};

/** Size presets for icon display */
export type SizePreset = "s" | "m" | "l" | "xl";

export const SIZE_PRESETS: Record<SizePreset, { icon: number; container: number; label: string; px: string }> = {
  s: { icon: 18, container: 44, label: "S", px: "18px" },
  m: { icon: 24, container: 56, label: "M", px: "24px" },
  l: { icon: 32, container: 64, label: "L", px: "32px" },
  xl: { icon: 40, container: 72, label: "XL", px: "40px" },
};

interface StyledIconProps {
  icon: IconData;
  style: IconStyle;
  onSelect?: () => void;
  isSelected?: boolean;
  onToggleCart?: (icon: IconData) => void;
  /** Override stroke weight (uses icon default if not provided) */
  strokeWeight?: number;
  /** Override icon size in pixels */
  iconSize?: number;
  /** Override container size in pixels */
  containerSize?: number;
}

export function StyledIcon({
  icon,
  style,
  onSelect,
  isSelected,
  onToggleCart,
  strokeWeight,
  iconSize = 24,
  containerSize = 56,
}: StyledIconProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { resolvedTheme } = useTheme();
  const styles = ICON_STYLES[style];

  // Determine if we're in dark mode
  const isDarkMode = resolvedTheme === "dark";

  // Use provided strokeWeight, or fall back to icon's default
  const effectiveStrokeWidth = strokeWeight ?? (icon.strokeWidth ? parseFloat(icon.strokeWidth) : DEFAULT_STROKE.strokeWidth);

  // Get appropriate brand color for current theme (inverts dark colors in dark mode)
  const brandColor = getBrandIconColor(icon.brandColor, isDarkMode);

  const handleClick = () => {
    if (onToggleCart) {
      onToggleCart(icon);
    }
    onSelect?.();
  };

  const componentName = toPascalCase(icon.normalizedName);

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  // Generate React component code with accessibility attributes
  const getReactComponent = () => {
    const attrs = getSvgAttributesJsx(icon, effectiveStrokeWidth);
    return `export function ${componentName}({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${attrs}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}`;
  };

  const handleCopySvg = () => handleCopy(generateRawSvg(icon, { strokeWidth: effectiveStrokeWidth }), "svg");
  const handleCopyComponent = () => handleCopy(getReactComponent(), "component");
  const handleCopyUsage = () => handleCopy(generateUsageExample(icon.normalizedName), "usage");

  const handleOpenInV0 = () => {
    const prompt = encodeURIComponent(
      `Create a beautiful component using this icon:\n\n${generateRawSvg(icon, { strokeWidth: effectiveStrokeWidth })}\n\nMake it interactive with hover states.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleClick}
            style={{ width: containerSize, height: containerSize }}
            className={`relative flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 ${styles.container} ${isSelected ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-[hsl(0,0%,3%)]" : ""
              }`}
          >
            <div
              style={{ width: iconSize, height: iconSize }}
              className={brandColor ? undefined : styles.icon}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: generateRenderableSvg(icon, {
                  size: iconSize,
                  strokeWidth: effectiveStrokeWidth,
                  ...(brandColor ? { color: brandColor } : {}),
                }),
              }}
            />
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56 bg-popover border-border">
          <ContextMenuLabel className="font-mono text-xs text-muted-foreground">
            {icon.sourceId}:{icon.normalizedName}
          </ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setShowDetailDialog(true)}>
            <Maximize2Icon className="mr-2 h-4 w-4" />
            View details
          </ContextMenuItem>
          {onToggleCart && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onToggleCart(icon)}>
                {isSelected ? (
                  <>
                    <MinusIcon className="mr-2 h-4 w-4" />
                    Remove from bundle
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add to bundle
                  </>
                )}
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopySvg}>
            {copied === "svg" ? (
              <CheckIcon className="mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            Copy SVG
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyComponent}>
            {copied === "component" ? (
              <CheckIcon className="mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            Copy React component
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyUsage}>
            {copied === "usage" ? (
              <CheckIcon className="mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            Copy usage example
          </ContextMenuItem>
          {icon.brandColor && (
            <ContextMenuItem onClick={() => icon.brandColor && handleCopy(icon.brandColor, "color")}>
              {copied === "color" ? (
                <CheckIcon className="mr-2 h-4 w-4" />
              ) : (
                <div
                  className="mr-2 h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: icon.brandColor }}
                />
              )}
              Copy brand color
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleOpenInV0}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            Open in v0
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <IconDetailDialog
        icon={icon}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </>
  );
}
