"use client";

import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Copy, Check, ExternalLink, Plus, Minus } from "lucide-react";
import type { IconData } from "@/types/icon";

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

interface StyledIconProps {
  icon: IconData;
  style: IconStyle;
  onSelect?: () => void;
  isSelected?: boolean;
  onToggleCart?: (icon: IconData) => void;
}

export function StyledIcon({ icon, style, onSelect, isSelected, onToggleCart }: StyledIconProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const styles = ICON_STYLES[style];

  const handleClick = () => {
    if (onToggleCart) {
      onToggleCart(icon);
    }
    onSelect?.();
  };

  const toPascalCase = (str: string) =>
    str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

  const componentName = toPascalCase(icon.normalizedName);

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  // Different icon libraries need different rendering approaches
  const getSvgAttributesJsx = () => {
    if (icon.sourceId === "phosphor") {
      return 'fill="currentColor"';
    }
    if (icon.sourceId === "hugeicons") {
      return 'stroke="currentColor" fill="none"';
    }
    return `fill="none" stroke="currentColor" strokeWidth={${icon.strokeWidth || 2}} strokeLinecap="round" strokeLinejoin="round"`;
  };

  const getSvgAttributesRaw = () => {
    if (icon.sourceId === "phosphor") {
      return 'fill="currentColor"';
    }
    if (icon.sourceId === "hugeicons") {
      return 'stroke="currentColor" fill="none"';
    }
    return `fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round"`;
  };

  const getFullSvg = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${icon.viewBox}" ${getSvgAttributesRaw()}>${icon.content}</svg>`;
  };

  const getReactComponent = () => {
    return `export function ${componentName}({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${getSvgAttributesJsx()}
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}`;
  };

  const getUsageExample = () => {
    return `<${componentName} className="w-5 h-5 text-foreground" />`;
  };

  const handleCopySvg = () => handleCopy(getFullSvg(), "svg");
  const handleCopyComponent = () => handleCopy(getReactComponent(), "component");
  const handleCopyUsage = () => handleCopy(getUsageExample(), "usage");

  const handleOpenInV0 = () => {
    const prompt = encodeURIComponent(
      `Create a beautiful component using this icon:\n\n${getFullSvg()}\n\nMake it interactive with hover states.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={handleClick}
          className={`relative flex items-center justify-center w-14 h-14 shrink-0 cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 ${styles.container} ${
            isSelected ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-[hsl(0,0%,3%)]" : ""
          }`}
        >
          <div
            className={`w-6 h-6 ${styles.icon}`}
            dangerouslySetInnerHTML={{
              __html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${icon.viewBox}" ${getSvgAttributesRaw()}>${icon.content}</svg>`,
            }}
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover border-border">
        <ContextMenuLabel className="font-mono text-xs text-muted-foreground">
          {icon.sourceId}:{icon.normalizedName}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {onToggleCart && (
          <ContextMenuItem onClick={() => onToggleCart(icon)}>
            {isSelected ? (
              <>
                <Minus className="mr-2 h-4 w-4" />
                Remove from bundle
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to bundle
              </>
            )}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopySvg}>
          {copied === "svg" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy SVG
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyComponent}>
          {copied === "component" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy React component
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyUsage}>
          {copied === "usage" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy usage example
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleOpenInV0}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in v0
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
