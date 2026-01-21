/**
 * Shared icon generation utilities for consistent SVG output.
 * 
 * This module normalizes stroke attributes, accessibility props, and
 * output generation across all export paths (CLI, UI, components).
 */

import type { IconData } from "@/types/icon";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Icon source identifiers */
export type IconSource = "lucide" | "phosphor" | "hugeicons";

/** Determines how the icon renders: fill-based or stroke-based */
export type IconRenderMode = "fill" | "stroke";

/** Default stroke configuration for consistent rendering */
export interface StrokeConfig {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: "round" | "butt" | "square";
  strokeLinejoin: "round" | "miter" | "bevel";
}


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default stroke configuration - matches Lucide/Feather icon conventions */
export const DEFAULT_STROKE: StrokeConfig = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines rendering mode based on icon properties.
 * - Fill-based icons (Phosphor, Bootstrap, Remix): use fill="currentColor"
 * - Stroke-based icons (Lucide, Heroicons, Feather, Tabler): use stroke="currentColor"
 */
export function getIconRenderMode(icon: Pick<IconData, "defaultStroke" | "defaultFill">): IconRenderMode {
  // Use defaultFill if true and defaultStroke is false
  return icon.defaultFill && !icon.defaultStroke ? "fill" : "stroke";
}

/**
 * Convert kebab-case to PascalCase for component names.
 */
export function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Attribute Generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate raw SVG attributes (kebab-case) for use in .svg files and dangerouslySetInnerHTML.
 * Sets stroke on <svg>, paths inherit.
 */
export function getSvgAttributesRaw(
  icon: Pick<IconData, "defaultStroke" | "defaultFill" | "strokeWidth">,
  overrideStrokeWidth?: number
): string {
  const mode = getIconRenderMode(icon);
  
  if (mode === "fill") {
    return 'fill="currentColor"';
  }
  
  const strokeWidth = overrideStrokeWidth ?? (parseFloat(icon.strokeWidth || "2") || DEFAULT_STROKE.strokeWidth);
  
  return [
    'fill="none"',
    'stroke="currentColor"',
    `stroke-width="${strokeWidth}"`,
    `stroke-linecap="${DEFAULT_STROKE.strokeLinecap}"`,
    `stroke-linejoin="${DEFAULT_STROKE.strokeLinejoin}"`,
  ].join(" ");
}

/**
 * Generate JSX attributes (camelCase) for React components.
 * Uses curly braces for numeric values (strokeWidth={2}).
 */
export function getSvgAttributesJsx(
  icon: Pick<IconData, "defaultStroke" | "defaultFill" | "strokeWidth">,
  overrideStrokeWidth?: number
): string {
  const mode = getIconRenderMode(icon);

  if (mode === "fill") {
    return 'fill="currentColor"';
  }
  
  const strokeWidth = overrideStrokeWidth ?? (parseFloat(icon.strokeWidth || "2") || DEFAULT_STROKE.strokeWidth);
  
  return [
    'fill="none"',
    'stroke="currentColor"',
    `strokeWidth={${strokeWidth}}`,
    `strokeLinecap="${DEFAULT_STROKE.strokeLinecap}"`,
    `strokeLinejoin="${DEFAULT_STROKE.strokeLinejoin}"`,
  ].join(" ");
}


// ─────────────────────────────────────────────────────────────────────────────
// Full SVG Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete raw SVG string (for copy/download).
 */
export function generateRawSvg(
  icon: Pick<IconData, "viewBox" | "content" | "defaultStroke" | "defaultFill" | "strokeWidth">,
  options: { width?: number; height?: number; strokeWidth?: number } = {}
): string {
  const { width = 24, height = 24, strokeWidth } = options;
  const attrs = getSvgAttributesRaw(icon, strokeWidth);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${icon.viewBox}" ${attrs} aria-hidden="true" focusable="false">${icon.content}</svg>`;
}

/**
 * Generate a complete SVG string for rendering in React (dangerouslySetInnerHTML).
 */
export function generateRenderableSvg(
  icon: Pick<IconData, "viewBox" | "content" | "defaultStroke" | "defaultFill" | "strokeWidth">,
  options: { size?: number; strokeWidth?: number; color?: string } = {}
): string {
  const { size = 24, strokeWidth, color } = options;
  const mode = getIconRenderMode(icon);
  const effectiveStrokeWidth = strokeWidth ?? (parseFloat(icon.strokeWidth || "2") || DEFAULT_STROKE.strokeWidth);
  
  let styleAttrs: string;
  if (mode === "fill") {
    styleAttrs = `fill="${color || "currentColor"}"`;
  } else {
    styleAttrs = [
      'fill="none"',
      `stroke="${color || "currentColor"}"`,
      `stroke-width="${effectiveStrokeWidth}"`,
      `stroke-linecap="${DEFAULT_STROKE.strokeLinecap}"`,
      `stroke-linejoin="${DEFAULT_STROKE.strokeLinejoin}"`,
    ].join(" ");
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${icon.viewBox}" ${styleAttrs} aria-hidden="true" focusable="false">${icon.content}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Code Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a React component string.
 */
export function generateReactComponent(
  icon: Pick<IconData, "normalizedName" | "viewBox" | "content" | "defaultStroke" | "defaultFill" | "strokeWidth">
): string {
  const componentName = toPascalCase(icon.normalizedName);
  const attrs = getSvgAttributesJsx(icon);
  
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
}

/**
 * Generate a full React component file with imports.
 */
export function generateReactFile(
  icons: Pick<IconData, "normalizedName" | "viewBox" | "content" | "defaultStroke" | "defaultFill" | "strokeWidth">[]
): string {
  const components = icons.map(generateReactComponent);
  
  return `/**
 * Icon components generated by @webrenew/unicon
 * @see https://unicon.webrenew.com
 */
import type { SVGProps } from "react";

${components.join("\n\n")}
`;
}


/**
 * Generate an SVG bundle (multiple SVGs concatenated).
 */
export function generateSvgBundle(
  icons: Pick<IconData, "normalizedName" | "viewBox" | "content" | "defaultStroke" | "defaultFill" | "strokeWidth">[]
): string {
  return icons
    .map((icon) => {
      const attrs = getSvgAttributesRaw(icon);
      return `<!-- ${icon.normalizedName} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs} aria-hidden="true" focusable="false">
  ${icon.content}
</svg>`;
    })
    .join("\n\n");
}

/**
 * Generate a JSON export.
 */
export function generateJsonBundle(
  icons: Pick<IconData, "id" | "normalizedName" | "sourceId" | "viewBox" | "content" | "tags" | "category">[]
): string {
  return JSON.stringify(
    icons.map((icon) => ({
      id: icon.id,
      name: icon.normalizedName,
      source: icon.sourceId,
      viewBox: icon.viewBox,
      content: icon.content,
      tags: icon.tags,
      category: icon.category,
    })),
    null,
    2
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage Example Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a usage example for a React component.
 */
export function generateUsageExample(iconName: string): string {
  const componentName = toPascalCase(iconName);
  return `<${componentName} className="size-5" />`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Icon Color Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null;
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Calculate relative luminance of a color (0 = darkest, 1 = lightest)
 * Uses WCAG formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  
  const rLinear = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gLinear = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bLinear = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine if a hex color is dark (needs inversion in dark mode)
 * Returns true if the color is too dark to see on a dark background
 */
export function isDarkColor(hexColor: string | null): boolean {
  if (!hexColor) return false;
  
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  
  // Only invert truly black/near-black colors (below 0.05 luminance)
  // Examples: #000000 = 0.0, #1a1a1a ≈ 0.01, #333333 ≈ 0.05
  // This prevents inverting dark grays and other non-black colors
  return luminance < 0.05;
}

/**
 * Get the appropriate color for a brand icon based on theme
 * Inverts dark colors in dark mode for visibility
 */
export function getBrandIconColor(brandColor: string | null, isDarkMode: boolean): string | undefined {
  if (!brandColor) return undefined;
  
  // If in dark mode and the brand color is dark, return white instead
  if (isDarkMode && isDarkColor(brandColor)) {
    return "#ffffff";
  }
  
  return brandColor;
}
