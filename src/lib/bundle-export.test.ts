import { describe, expect, it } from "vitest";
import {
  generateBundleExport,
  getBundleExportFileName,
  getBundleExportIcons,
} from "./bundle-export";
import type { BundleIcon } from "@/types/database";

const baseIcon: BundleIcon = {
  id: "lucide:arrow-right",
  name: "Arrow Right",
  normalizedName: "arrow-right",
  sourceId: "lucide",
  svg: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  viewBox: "0 0 24 24",
  strokeWidth: "2",
  defaultFill: false,
  defaultStroke: true,
};

describe("saved bundle export generation", () => {
  it("exports saved bundle icons as React components", () => {
    const result = generateBundleExport("Navigation Set", {
      icons: [baseIcon],
      format: "react",
    });

    expect(result.fileName).toBe("navigation-set.tsx");
    expect(result.mimeType).toBe("text/plain");
    expect(result.exportedIconCount).toBe(1);
    expect(result.content).toContain('import type { SVGProps } from "react";');
    expect(result.content).toContain("export function ArrowRight");
    expect(result.content).toContain('Identifier: lucide:arrow-right');
    expect(result.content).toContain(baseIcon.svg);
  });

  it("exports legacy bundle icons that stored SVG in content", () => {
    const legacyIcon = {
      ...baseIcon,
      svg: "",
      content: '<path d="M4 4h16v16H4z" />',
      normalizedName: "square",
    } as BundleIcon & { content: string };

    const result = generateBundleExport("Legacy", {
      icons: [legacyIcon],
      format: "json",
    });

    expect(result.fileName).toBe("legacy.json");
    expect(result.mimeType).toBe("application/json");
    expect(JSON.parse(result.content)).toEqual([
      expect.objectContaining({
        name: "square",
        content: legacyIcon.content,
      }),
    ]);
  });

  it("normalizes stroke width and viewBox before exporting", () => {
    const phosphorIcon: BundleIcon = {
      ...baseIcon,
      id: "phosphor:bell",
      name: "Bell",
      normalizedName: "bell",
      sourceId: "phosphor",
      svg: '<path d="M128 32" stroke-width="4" />',
      viewBox: "0 0 256 256",
      strokeWidth: "4",
    };

    const icons = getBundleExportIcons({
      icons: [phosphorIcon],
      normalizeStrokes: true,
      targetStrokeWidth: 1.5,
      normalizeViewbox: true,
    });

    expect(icons[0]).toMatchObject({
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
    });
    expect(icons[0]?.content).toContain('d="M12 3"');
    expect(icons[0]?.content).toContain('stroke-width="1.5"');
  });

  it("falls back to a safe filename when bundle name has no slug characters", () => {
    expect(getBundleExportFileName("!!!", "svg")).toBe("bundle.svg");
  });
});
