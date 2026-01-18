"use client";

import { cn } from "@/lib/utils";

interface IconRendererProps {
  svgContent: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function IconRenderer({
  svgContent,
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  className,
}: IconRendererProps) {
  // Parse and modify the SVG content
  const modifiedSvg = svgContent
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`)
    .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    .replace(/fill="none"/g, 'fill="none"')
    .replace(/fill="currentColor"/g, `fill="${color}"`);

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      dangerouslySetInnerHTML={{ __html: modifiedSvg }}
    />
  );
}
