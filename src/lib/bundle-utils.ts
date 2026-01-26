/**
 * Utilities for analyzing icon bundles for consistency
 */

import type { IconData } from "@/types/icon";
import {
  getLibraryMetadata,
  type LibraryMetadata,
} from "./icon-libraries";

export interface MixingAnalysis {
  /** Whether the bundle has inconsistent stroke widths */
  hasInconsistency: boolean;
  /** Stroke-based libraries in the bundle (excludes brand icons) */
  strokeLibraries: LibraryMetadata[];
  /** Map of stroke width -> library names */
  strokeWidthGroups: Map<number, string[]>;
  /** Human-readable recommendation, null if no issues */
  recommendation: string | null;
  /** Total icons analyzed (excludes brand icons) */
  strokeIconCount: number;
  /** Brand icons in bundle (not included in analysis) */
  brandIconCount: number;
}

export interface ViewBoxAnalysis {
  /** Whether the bundle has mixed viewBox sizes */
  hasInconsistency: boolean;
  /** Map of viewBox -> count of icons */
  viewBoxGroups: Map<string, number>;
  /** The most common viewBox (recommended target) */
  dominantViewBox: string;
  /** Human-readable recommendation, null if no issues */
  recommendation: string | null;
}

/**
 * Analyze a bundle for viewBox inconsistencies
 */
export function analyzeViewBoxMixing(icons: Pick<IconData, "viewBox">[]): ViewBoxAnalysis {
  const viewBoxGroups = new Map<string, number>();
  
  for (const icon of icons) {
    const count = viewBoxGroups.get(icon.viewBox) ?? 0;
    viewBoxGroups.set(icon.viewBox, count + 1);
  }
  
  // Find the most common viewBox
  let dominantViewBox = "0 0 24 24";
  let maxCount = 0;
  for (const [viewBox, count] of viewBoxGroups.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantViewBox = viewBox;
    }
  }
  
  const hasInconsistency = viewBoxGroups.size > 1;
  
  let recommendation: string | null = null;
  if (hasInconsistency) {
    const viewBoxList = Array.from(viewBoxGroups.entries())
      .map(([vb, count]) => `${vb} (${count} icons)`)
      .join(", ");
    recommendation = `Your bundle mixes icons with different viewBox sizes: ${viewBoxList}. Consider normalizing to ${dominantViewBox} for consistent sizing.`;
  }
  
  return {
    hasInconsistency,
    viewBoxGroups,
    dominantViewBox,
    recommendation,
  };
}

/**
 * Analyze a bundle of icons for mixing inconsistencies
 */
export function analyzeBundleMixing(icons: IconData[]): MixingAnalysis {
  // Group icons by source library
  const libraryIcons = new Map<string, IconData[]>();
  let brandIconCount = 0;

  for (const icon of icons) {
    const meta = getLibraryMetadata(icon.sourceId);

    // Skip brand icons - they're exempt from consistency checks
    if (meta.category === "brand") {
      brandIconCount++;
      continue;
    }

    const existing = libraryIcons.get(icon.sourceId) ?? [];
    existing.push(icon);
    libraryIcons.set(icon.sourceId, existing);
  }

  // Get unique stroke-based libraries
  const strokeLibraries = Array.from(libraryIcons.keys()).map(getLibraryMetadata);

  // Group libraries by their default stroke width
  const strokeWidthGroups = new Map<number, string[]>();
  for (const lib of strokeLibraries) {
    const existing = strokeWidthGroups.get(lib.defaultStrokeWidth) ?? [];
    existing.push(lib.name);
    strokeWidthGroups.set(lib.defaultStrokeWidth, existing);
  }

  // Check for inconsistency (more than one stroke width group)
  // But account for family relationships (lucide/feather are compatible)
  const uniqueFamilies = new Set<string>();
  for (const lib of strokeLibraries) {
    const familyKey = lib.family ?? lib.id;
    uniqueFamilies.add(familyKey);
  }

  // Only flag as inconsistent if:
  // 1. Multiple stroke width groups exist
  // 2. Libraries are not all in the same family
  const hasMultipleStrokeWidths = strokeWidthGroups.size > 1;
  const hasMultipleFamilies = uniqueFamilies.size > 1;
  const hasInconsistency = hasMultipleStrokeWidths && hasMultipleFamilies;

  // Generate recommendation
  let recommendation: string | null = null;
  if (hasInconsistency) {
    const widthsList = Array.from(strokeWidthGroups.entries())
      .map(([width, libs]) => `${width}px (${libs.join(", ")})`)
      .join(" and ");
    recommendation = `Your bundle mixes icons with different stroke weights: ${widthsList}. Consider normalizing for visual consistency.`;
  }

  return {
    hasInconsistency,
    strokeLibraries,
    strokeWidthGroups,
    recommendation,
    strokeIconCount: icons.length - brandIconCount,
    brandIconCount,
  };
}

/**
 * Get a summary of libraries in a bundle
 */
export function getBundleLibrarySummary(
  icons: IconData[]
): { sourceId: string; count: number; meta: LibraryMetadata }[] {
  const counts = new Map<string, number>();

  for (const icon of icons) {
    counts.set(icon.sourceId, (counts.get(icon.sourceId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([sourceId, count]) => ({
      sourceId,
      count,
      meta: getLibraryMetadata(sourceId),
    }))
    .sort((a, b) => b.count - a.count);
}
