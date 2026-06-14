import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BundleBrowser } from "./bundle-browser";
import type { Bundle } from "@/types/database";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const bundle: Bundle = {
  id: "bundle-1",
  user_id: "user-1",
  name: "Navigation Icons",
  description: null,
  is_public: false,
  share_slug: null,
  stroke_preset: null,
  normalize_strokes: false,
  target_stroke_width: null,
  normalize_viewbox: false,
  target_viewbox: null,
  icons: [
    {
      id: "lucide:arrow-right",
      name: "Arrow Right",
      normalizedName: "arrow-right",
      sourceId: "lucide",
      svg: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      defaultFill: false,
      defaultStroke: true,
    },
  ],
  icon_count: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("BundleBrowser export", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickAnchor: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:bundle-export");
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    clickAnchor = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    clickAnchor.mockRestore();
    vi.unstubAllGlobals();
  });

  it("downloads the saved bundle export from the header export menu", () => {
    render(
      <BundleBrowser
        bundle={bundle}
        categories={[]}
        initialIcons={[]}
        totalIconCount={0}
        countBySource={{}}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickAnchor).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:bundle-export");
  });
});
