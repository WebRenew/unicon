"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconRenderer } from "./icon-renderer";
import type { IconData, IconPreviewSettings } from "@/types/icon";
import { cn } from "@/lib/utils";
import { getBrandIconColor } from "@/lib/icon-utils";

interface IconPreviewProps {
  icon: IconData | null;
  onClose?: () => void;
}

const sizes = [16, 20, 24, 32, 40, 48];
const strokeWidths = [1, 1.5, 2, 2.5, 3];
const colors = [
  { name: "Current", value: "currentColor" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
];

export function IconPreview({ icon, onClose }: IconPreviewProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  
  const [settings, setSettings] = useState<IconPreviewSettings>({
    size: 48,
    strokeWidth: 2,
    color: "currentColor",
  });
  const [copied, setCopied] = useState<string | null>(null);

  // Compute effective color (adapts brand colors for dark mode)
  const effectiveColor = icon?.brandColor 
    ? getBrandIconColor(icon.brandColor, isDarkMode) || settings.color
    : settings.color;

  if (!icon) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-5xl mb-4 opacity-50">←</div>
        <h3 className="text-lg font-medium text-foreground/60">Select an icon</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Click on any icon to preview and customize
        </p>
      </div>
    );
  }

  const componentCode = `import { ${toPascalCase(icon.normalizedName)} } from "@/components/icons/${icon.normalizedName}";

<${toPascalCase(icon.normalizedName)} size={${settings.size}} strokeWidth={${settings.strokeWidth}} />`;

  // Use fill for fill-based icons (Simple Icons, etc.), stroke for others
  const svgCode = icon.defaultFill
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${settings.size}" height="${settings.size}" viewBox="${icon.viewBox}" fill="${effectiveColor}">${icon.content}</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${settings.size}" height="${settings.size}" viewBox="${icon.viewBox}" fill="none" stroke="${effectiveColor}" stroke-width="${settings.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${icon.content}</svg>`;

  async function copyToClipboard(text: string, type: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function openInV0() {
    const prompt = encodeURIComponent(
      `Create a component using this icon:\n\n${svgCode}\n\nMake it a beautiful, interactive button with this icon.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">{icon.normalizedName}</h3>
          <Badge variant="outline" className="mt-1 text-xs">
            {icon.sourceId}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close preview">
            ✕
          </Button>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center p-8 bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
        <div className="rounded-xl bg-background p-8 shadow-sm border">
          <IconRenderer
            svgContent={icon.content}
            viewBox={icon.viewBox}
            size={settings.size}
            strokeWidth={settings.strokeWidth}
            color={effectiveColor}
            renderMode={icon.defaultFill ? "fill" : "stroke"}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Size */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Size</label>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSettings((s) => ({ ...s, size }))}
                aria-label={`Set size to ${size} pixels`}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  settings.size === size
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-muted"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Stroke</label>
          <div className="flex flex-wrap gap-1.5">
            {strokeWidths.map((sw) => (
              <button
                key={sw}
                onClick={() => setSettings((s) => ({ ...s, strokeWidth: sw }))}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  settings.strokeWidth === sw
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-muted"
                )}
              >
                {sw}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setSettings((s) => ({ ...s, color: c.value }))}
                aria-label={`Set color to ${c.name}`}
                className={cn(
                  "w-7 h-7 rounded-md border-2 transition-[border-color,transform]",
                  settings.color === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                )}
                style={{
                  backgroundColor: c.value === "currentColor" ? undefined : c.value,
                  background: c.value === "currentColor"
                    ? "linear-gradient(135deg, #000 50%, #fff 50%)"
                    : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="default"
            className="w-full justify-start gap-2"
            onClick={() => copyToClipboard(componentCode, "component")}
          >
            {copied === "component" ? "✓ Copied!" : "📋 Copy Component"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => copyToClipboard(svgCode, "svg")}
          >
            {copied === "svg" ? "✓ Copied!" : "📄 Copy SVG"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={openInV0}
          >
            ⚡ Open in v0
          </Button>
        </div>
      </div>
    </div>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
