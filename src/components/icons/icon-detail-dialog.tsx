"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyIcon } from "@/components/icons/ui/copy";
import { CheckIcon } from "@/components/icons/ui/check";
import { ExternalLinkIcon } from "@/components/icons/ui/external-link";
import { DownloadIcon } from "@/components/icons/ui/download";
import { IconRenderer } from "./icon-renderer";
import type { IconData } from "@/types/icon";
import { cn } from "@/lib/utils";
import {
  getBrandIconColor,
  toPascalCase,
  getSvgAttributesJsx,
  generateRawSvg,
  generateUsageExample
} from "@/lib/icon-utils";

interface IconDetailDialogProps {
  icon: IconData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CopyType = "svg" | "react" | "vue" | "svelte" | "usage" | "id" | "color";

const libraryInfo: Record<string, { name: string; url: string; color: string }> = {
  lucide: { name: "Lucide Icons", url: "https://lucide.dev", color: "text-orange-600" },
  phosphor: { name: "Phosphor Icons", url: "https://phosphoricons.com", color: "text-emerald-600" },
  hugeicons: { name: "Hugeicons", url: "https://hugeicons.com", color: "text-violet-600" },
  heroicons: { name: "Heroicons", url: "https://heroicons.com", color: "text-blue-600" },
  tabler: { name: "Tabler Icons", url: "https://tabler.io/icons", color: "text-cyan-600" },
  feather: { name: "Feather Icons", url: "https://feathericons.com", color: "text-gray-600" },
  remix: { name: "Remix Icon", url: "https://remixicon.com", color: "text-indigo-600" },
  "simple-icons": { name: "Simple Icons", url: "https://simpleicons.org", color: "text-slate-600" },
};

export function IconDetailDialog({ icon, open, onOpenChange }: IconDetailDialogProps) {
  const [copied, setCopied] = useState<CopyType | null>(null);
  const { resolvedTheme } = useTheme();

  if (!icon) return null;

  const isDarkMode = resolvedTheme === "dark";
  const strokeWidth = icon.strokeWidth ? parseFloat(icon.strokeWidth) : 2;
  const brandColor = getBrandIconColor(icon.brandColor, isDarkMode);
  const componentName = toPascalCase(icon.normalizedName);
  const library = libraryInfo[icon.sourceId];

  const handleCopy = async (text: string, type: CopyType) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getReactComponent = () => {
    const attrs = getSvgAttributesJsx(icon, strokeWidth);
    return `import { SVGProps } from 'react';

export function ${componentName}({ className, ...props }: SVGProps<SVGSVGElement>) {
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

  const getVueComponent = () => {
    return `<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${icon.viewBox}"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-bind="$attrs"
  >
    ${icon.content}
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  strokeWidth?: number;
}>();
</script>`;
  };

  const getSvelteComponent = () => {
    return `<script lang="ts">
  export let strokeWidth: number = ${strokeWidth};
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${icon.viewBox}"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  {...$$restProps}
>
  ${icon.content}
</svg>`;
  };

  const downloadSvg = () => {
    const svgContent = generateRawSvg(icon, { strokeWidth });
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icon.normalizedName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{icon.normalizedName}</span>
            <Badge variant="secondary" className="text-xs">
              {icon.sourceId}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {icon.name} from {library?.name || icon.sourceId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Large icon preview with multiple sizes */}
          <div className="flex items-center justify-center gap-6 py-8 bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <IconRenderer
                  svgContent={icon.content}
                  viewBox={icon.viewBox}
                  size={48}
                  strokeWidth={strokeWidth}
                  renderMode={icon.defaultFill ? "fill" : "stroke"}
                  {...(brandColor ? { color: brandColor } : {})}
                />
              </div>
              <span className="text-xs text-muted-foreground">48px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 flex items-center justify-center">
                <IconRenderer
                  svgContent={icon.content}
                  viewBox={icon.viewBox}
                  size={80}
                  strokeWidth={strokeWidth}
                  renderMode={icon.defaultFill ? "fill" : "stroke"}
                  {...(brandColor ? { color: brandColor } : {})}
                />
              </div>
              <span className="text-xs text-muted-foreground">80px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 flex items-center justify-center">
                <IconRenderer
                  svgContent={icon.content}
                  viewBox={icon.viewBox}
                  size={112}
                  strokeWidth={strokeWidth}
                  renderMode={icon.defaultFill ? "fill" : "stroke"}
                  {...(brandColor ? { color: brandColor } : {})}
                />
              </div>
              <span className="text-xs text-muted-foreground">112px</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Icon ID</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {icon.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(icon.id, "id")}
                >
                  {copied === "id" ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Library</span>
              <div className="mt-1">
                <a
                  href={library?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("flex items-center gap-1 hover:underline", library?.color)}
                >
                  {library?.name}
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
            </div>

            {icon.category && (
              <div>
                <span className="text-muted-foreground">Category</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {icon.category}
                  </Badge>
                </div>
              </div>
            )}

            {icon.brandColor && (
              <div>
                <span className="text-muted-foreground">Brand Color</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: icon.brandColor }}
                  />
                  <code className="text-xs font-mono">{icon.brandColor}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => icon.brandColor && handleCopy(icon.brandColor, "color")}
                  >
                    {copied === "color" ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <CopyIcon className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {icon.tags && icon.tags.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {icon.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Copy Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Copy Code</h4>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleCopy(generateRawSvg(icon, { strokeWidth }), "svg")}
              >
                {copied === "svg" ? (
                  <CheckIcon className="mr-2 h-4 w-4" />
                ) : (
                  <CopyIcon className="mr-2 h-4 w-4" />
                )}
                SVG
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleCopy(getReactComponent(), "react")}
              >
                {copied === "react" ? (
                  <CheckIcon className="mr-2 h-4 w-4" />
                ) : (
                  <CopyIcon className="mr-2 h-4 w-4" />
                )}
                React
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleCopy(getVueComponent(), "vue")}
              >
                {copied === "vue" ? (
                  <CheckIcon className="mr-2 h-4 w-4" />
                ) : (
                  <CopyIcon className="mr-2 h-4 w-4" />
                )}
                Vue
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleCopy(getSvelteComponent(), "svelte")}
              >
                {copied === "svelte" ? (
                  <CheckIcon className="mr-2 h-4 w-4" />
                ) : (
                  <CopyIcon className="mr-2 h-4 w-4" />
                )}
                Svelte
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCopy(generateUsageExample(icon.normalizedName), "usage")}
            >
              {copied === "usage" ? (
                <CheckIcon className="mr-2 h-4 w-4" />
              ) : (
                <CopyIcon className="mr-2 h-4 w-4" />
              )}
              Usage Example
            </Button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="default" className="flex-1" onClick={downloadSvg}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download SVG
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const prompt = encodeURIComponent(
                  `Create a beautiful component using this ${icon.name} icon:\n\n${generateRawSvg(icon, { strokeWidth })}\n\nMake it interactive with hover states and animations.`
                );
                window.open(`https://v0.dev/?q=${prompt}`, "_blank");
              }}
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Open in v0
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
