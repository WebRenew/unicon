"use client";

import { cn } from "@/lib/utils";

interface IconRendererProps {
  svgContent: string;
  viewBox?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function IconRenderer({
  svgContent,
  viewBox = "0 0 24 24",
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  className,
}: IconRendererProps) {
  // Build a complete SVG with the inner content
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`;

  // Replace colors in the content
  const modifiedSvg = fullSvg
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`);

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      dangerouslySetInnerHTML={{ __html: modifiedSvg }}
    />
  );
}
