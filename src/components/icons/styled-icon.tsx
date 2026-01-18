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
      "rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)] border-t border-[#999]/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),inset_-8px_-8px_16px_rgba(255,255,255,0.2),inset_8px_8px_16px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,0,0,0.6)]",
    icon: "text-white/80",
    css: `/* Metal Icon Style */
.metal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(to bottom, #555 0%, #222 8%, #111 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.5);
  border-top: 1px solid rgba(153,153,153,0.4);
}`,
  },
  brutal: {
    container:
      "rounded-none bg-white border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px]",
    icon: "text-black",
    css: `/* Brutal Icon Style */
.brutal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 0;
  background: white; border: 4px solid black;
  box-shadow: 4px 4px 0 0 #000;
}`,
  },
  glow: {
    container:
      "rounded-2xl bg-[linear-gradient(135deg,rgba(15,15,20,0.95)_0%,rgba(10,10,15,0.98)_100%)] border border-[rgba(168,85,247,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:shadow-[0_4px_32px_rgba(236,72,153,0.15),0_8px_48px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(200,120,200,0.2)]",
    icon: "text-[rgba(180,150,200,0.7)] hover:text-[rgba(200,160,220,0.9)]",
    css: `/* Glow Icon Style */
.glow-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(15,15,20,0.95) 0%, rgba(10,10,15,0.98) 100%);
  border: 1px solid rgba(168,85,247,0.08);
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

  const handleCopySvg = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.content}</svg>`;
    handleCopy(svg, "svg");
  };

  const handleOpenInV0 = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.content}</svg>`;
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
          className={`flex items-center justify-center w-12 h-12 shrink-0 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-110 active:scale-95 ${styles.container}`}
        >
          <div
            className={`w-6 h-6 ${styles.icon}`}
            dangerouslySetInnerHTML={{
              __html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round">${icon.content}</svg>`,
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
