"use client";

import { cn } from "@/lib/utils";
import { DEFAULT_STROKE } from "@/lib/icon-utils";

interface IconRendererProps {
  svgContent: string;
  viewBox?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  /** Set to "fill" for fill-based icons (e.g., Phosphor) */
  renderMode?: "stroke" | "fill";
}

export function IconRenderer({
  svgContent,
  viewBox = "0 0 24 24",
  size = 24,
  strokeWidth = DEFAULT_STROKE.strokeWidth,
  color = "currentColor",
  className,
  renderMode = "stroke",
}: IconRendererProps) {
  // Build consistent stroke attributes
  const strokeAttrs = renderMode === "fill"
    ? `fill="${color}"`
    : `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="${DEFAULT_STROKE.strokeLinecap}" stroke-linejoin="${DEFAULT_STROKE.strokeLinejoin}"`;

  // Build a complete SVG with accessibility attributes
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" ${strokeAttrs} aria-hidden="true" focusable="false">${svgContent}</svg>`;

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      dangerouslySetInnerHTML={{ __html: fullSvg }}
    />
  );
}
