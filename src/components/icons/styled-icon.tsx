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
import { Copy, Check, ExternalLink } from "lucide-react";
import type { IconData } from "@/types/icon";

export type IconStyle = "metal" | "brutal" | "glow";

export const ICON_STYLES: Record<IconStyle, { container: string; icon: string; css: string }> = {
  metal: {
    container:
      "rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] border-t border-[#666]/30 hover:brightness-110",
    icon: "text-white/80",
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
      "rounded-none bg-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000]",
    icon: "text-black",
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
      "rounded-xl bg-[#0a0a0f] border border-purple-500/10 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    icon: "text-purple-300/70",
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
}

export function StyledIcon({ icon, style, onSelect }: StyledIconProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const styles = ICON_STYLES[style];

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

  const handleCopyComponent = () => {
    const code = `import { ${componentName} } from "@/components/icons/${icon.normalizedName}";

<${componentName} className="w-6 h-6" />`;
    handleCopy(code, "component");
  };

  // Different icon libraries need different rendering approaches
  const getSvgAttributes = () => {
    if (icon.sourceId === "phosphor") {
      // Phosphor uses 256x256 filled paths
      return 'fill="currentColor"';
    }
    if (icon.sourceId === "hugeicons") {
      // HugeIcons already has stroke in content, just set color
      return 'stroke="currentColor" fill="none"';
    }
    // Lucide: standard stroke-based icons
    return `fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round"`;
  };

  const getFullSvg = (size = 24) => {
    const attrs = getSvgAttributes();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${icon.viewBox}" ${attrs}>${icon.content}</svg>`;
  };

  const handleCopySvg = () => {
    handleCopy(getFullSvg(24), "svg");
  };

  const handleOpenInV0 = () => {
    const svg = getFullSvg(24);
    const prompt = encodeURIComponent(
      `Create a beautiful component using this icon:\n\n${svg}\n\nMake it interactive with hover states.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={onSelect}
          className={`flex items-center justify-center w-11 h-11 shrink-0 cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 ${styles.container}`}
        >
          <div
            className={`w-5 h-5 ${styles.icon}`}
            dangerouslySetInnerHTML={{
              __html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="${icon.viewBox}" ${getSvgAttributes()}>${icon.content}</svg>`,
            }}
          />
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover border-border">
        <ContextMenuLabel className="font-mono text-xs text-muted-foreground">
          {icon.sourceId}:{icon.normalizedName}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => handleCopy(icon.normalizedName, "name")}>
          {copied === "name" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy name
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyComponent}>
          {copied === "component" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy component
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopySvg}>
          {copied === "svg" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy SVG
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
