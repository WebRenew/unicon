import {
  generateJsonBundle,
  generateReactFile,
  generateSvgBundle,
  normalizeIcons,
  STANDARD_VIEWBOX,
} from "@/lib/icon-utils";
import type { BundleIcon } from "@/types/database";
import type { IconData } from "@/types/icon";

export type BundleExportFormat = "react" | "svg" | "json";

interface BundleExportOptions {
  icons: BundleIcon[];
  format: BundleExportFormat;
  normalizeStrokes?: boolean;
  targetStrokeWidth?: number | null;
  normalizeViewbox?: boolean;
}

export interface BundleExportResult {
  content: string;
  fileName: string;
  mimeType: string;
  exportedIconCount: number;
}

function getIconContent(icon: BundleIcon): string {
  return icon.svg || (icon as unknown as { content?: string }).content || "";
}

function getDefaultViewBox(icon: BundleIcon): string {
  return icon.sourceId === "phosphor" ? "0 0 256 256" : STANDARD_VIEWBOX;
}

function getExtension(format: BundleExportFormat): string {
  switch (format) {
    case "react":
      return "tsx";
    case "svg":
      return "svg";
    case "json":
      return "json";
  }
}

function getMimeType(format: BundleExportFormat): string {
  switch (format) {
    case "json":
      return "application/json";
    case "svg":
      return "image/svg+xml";
    case "react":
      return "text/plain";
  }
}

export function getBundleExportFileName(name: string, format: BundleExportFormat): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "bundle"}.${getExtension(format)}`;
}

export function getBundleExportIcons(options: Omit<BundleExportOptions, "format">): IconData[] {
  const icons = options.icons
    .map((icon): IconData | null => {
      const content = getIconContent(icon);
      if (!content) return null;

      return {
        id: icon.id,
        name: icon.name,
        normalizedName: icon.normalizedName,
        sourceId: icon.sourceId,
        category: null,
        tags: [],
        viewBox: icon.viewBox || getDefaultViewBox(icon),
        content,
        pathData: null,
        defaultStroke: icon.defaultStroke ?? true,
        defaultFill: icon.defaultFill ?? false,
        strokeWidth: icon.strokeWidth ?? null,
        brandColor: null,
      };
    })
    .filter((icon): icon is IconData => icon !== null);

  if (!options.normalizeStrokes && !options.normalizeViewbox) {
    return icons;
  }

  return normalizeIcons(icons, {
    ...(options.normalizeStrokes && {
      strokeWidth: options.targetStrokeWidth ?? 2,
      skipFillIcons: true,
    }),
    ...(options.normalizeViewbox && { viewBox: STANDARD_VIEWBOX }),
  });
}

export function generateBundleExport(
  name: string,
  options: BundleExportOptions
): BundleExportResult {
  const icons = getBundleExportIcons(options);
  let content: string;

  switch (options.format) {
    case "react":
      content = generateReactFile(icons);
      break;
    case "svg":
      content = generateSvgBundle(icons);
      break;
    case "json":
      content = generateJsonBundle(icons);
      break;
  }

  return {
    content,
    fileName: getBundleExportFileName(name, options.format),
    mimeType: getMimeType(options.format),
    exportedIconCount: icons.length,
  };
}
