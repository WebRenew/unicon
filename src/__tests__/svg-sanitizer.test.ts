import { describe, expect, it } from "vitest";
import { sanitizeBundleIcons, sanitizeSvgContent } from "./helpers";
import { generateRenderableSvg } from "@/lib/icon-utils";

describe("sanitizeSvgContent", () => {
  it("removes script tags and event-handler attributes", () => {
    const input = `<path d="M1 1" onload="alert(1)" /><script>alert(1)</script><g onclick='evil()'><path d="M2 2" /></g>`;
    const sanitized = sanitizeSvgContent(input);

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onload=");
    expect(sanitized).not.toContain("onclick=");
    expect(sanitized).toContain(`<path d="M1 1"`);
    expect(sanitized).toContain("<g>");
  });

  it("removes unsafe javascript/data URLs", () => {
    const input = `<a href="javascript:alert(1)"><path d="M1 1" /></a><use xlink:href="data:text/html;base64,abcd" />`;
    const sanitized = sanitizeSvgContent(input);

    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("data:text/html");
    expect(sanitized).toContain("<a>");
    expect(sanitized).toContain("<use");
  });

  it("removes style attributes and scriptable data URLs", () => {
    const input = `<path d="M3 3" style="fill:url(javascript:alert(1));stroke:red" /><image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" /><use xlink:href="data:application/javascript,alert(1)" />`;
    const sanitized = sanitizeSvgContent(input);

    expect(sanitized).not.toContain("style=");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("data:");
    expect(sanitized).toContain(`<path d="M3 3" />`);
    expect(sanitized).toContain("<image");
    expect(sanitized).toContain("<use");
  });
});

describe("sanitizeBundleIcons", () => {
  it("sanitizes svg/content fields in icon payload arrays", () => {
    const payload = [
      { id: "lucide:alert", svg: `<script>alert(1)</script><path d="M1 1" onload="x()" />` },
      { id: "tabler:home", content: `<foreignObject><iframe src="javascript:1"></iframe></foreignObject><path d="M2 2" />` },
    ];

    const sanitized = sanitizeBundleIcons(payload);

    expect(sanitized).not.toBeNull();
    expect(sanitized?.[0]?.svg).toBe(`<path d="M1 1" />`);
    expect(sanitized?.[1]?.content).toBe(`<path d="M2 2" />`);
  });

  it("returns null for non-object array entries", () => {
    expect(sanitizeBundleIcons(["bad"])).toBeNull();
    expect(sanitizeBundleIcons({ bad: true })).toBeNull();
  });
});

describe("generateRenderableSvg", () => {
  it("sanitizes embedded SVG content before rendering", () => {
    const html = generateRenderableSvg({
      viewBox: "0 0 24 24",
      content: `<script>alert(1)</script><path d="M0 0" onclick="evil()" />`,
      defaultStroke: true,
      defaultFill: false,
      strokeWidth: "2",
    });

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick=");
    expect(html).toContain(`<path d="M0 0" />`);
  });
});
