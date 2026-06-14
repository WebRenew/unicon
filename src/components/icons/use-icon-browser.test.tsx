import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iconSearchCache } from "@/lib/search-cache";
import type { IconData } from "@/types/icon";
import { useIconBrowser } from "./use-icon-browser";

function makeIcon(id: string, sourceId: string): IconData {
  return {
    id,
    name: id,
    normalizedName: id,
    sourceId,
    category: null,
    tags: [],
    viewBox: "0 0 24 24",
    content: "",
    pathData: null,
    defaultStroke: false,
    defaultFill: false,
    strokeWidth: null,
    brandColor: null,
  };
}

interface PendingRequest {
  url: string;
  resolve: (icons: IconData[]) => void;
  reject: (error: unknown) => void;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("useIconBrowser request sequencing", () => {
  let pending: PendingRequest[];

  beforeEach(() => {
    iconSearchCache.clear();
    pending = [];
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input.toString();
      return new Promise<Response>((resolveResponse, rejectResponse) => {
        pending.push({
          url,
          resolve: (icons) =>
            resolveResponse(
              new Response(JSON.stringify({ icons, searchType: "text", hasMore: false }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            ),
          reject: rejectResponse,
        });
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    iconSearchCache.clear();
  });

  it("uses the server-rendered first page without a duplicate fetch", async () => {
    const initialIcons = [makeIcon("lucide-a", "lucide"), makeIcon("tabler-b", "tabler")];

    const { result, rerender } = renderHook(
      ({ icons, totalCount }) => useIconBrowser({ initialIcons: icons, totalCount }),
      {
        initialProps: { icons: initialIcons, totalCount: initialIcons.length },
      },
    );

    expect(result.current.icons.map((icon) => icon.id)).toEqual(["lucide-a", "tabler-b"]);

    await act(async () => {
      await tick();
    });

    rerender({ icons: [...initialIcons], totalCount: initialIcons.length });

    await act(async () => {
      await tick();
    });

    expect(result.current.icons.map((icon) => icon.id)).toEqual(["lucide-a", "tabler-b"]);
    expect(pending).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("requests fast text mode for typed searches", async () => {
    const { result } = renderHook(() => useIconBrowser({ initialIcons: [], totalCount: 0 }));

    await act(async () => {
      result.current.setSearch("arrow");
    });

    await waitFor(() => expect(pending).toHaveLength(1));
    expect(pending[0]!.url).toContain("q=arrow");
    expect(pending[0]!.url).toContain("ai=false");

    await act(async () => {
      pending[0]!.resolve([makeIcon("arrow", "lucide")]);
    });
  });

  it("ignores a stale filtered response that resolves after a newer filtered one", async () => {
    const { result } = renderHook(() => useIconBrowser({ initialIcons: [], totalCount: 0 }));

    await act(async () => {
      result.current.setSelectedSource("remix");
    });
    await waitFor(() => expect(pending).toHaveLength(1));
    const staleRequest = pending[0]!;
    expect(staleRequest.url).toContain("source=remix");

    await act(async () => {
      result.current.setSelectedSource("lucide");
    });
    await waitFor(() => expect(pending).toHaveLength(2));
    const lucideRequest = pending[1]!;
    expect(lucideRequest.url).toContain("source=lucide");

    // The newer (filtered) request resolves first.
    await act(async () => {
      lucideRequest.resolve([makeIcon("lucide-a", "lucide"), makeIcon("lucide-b", "lucide")]);
    });
    await waitFor(() =>
      expect(result.current.icons.map((icon) => icon.id)).toEqual(["lucide-a", "lucide-b"]),
    );

    // The older filtered request resolves afterwards — it must not clobber state.
    await act(async () => {
      staleRequest.resolve([makeIcon("remix-x", "remix"), makeIcon("remix-y", "remix")]);
      await tick();
    });

    expect(result.current.icons.map((icon) => icon.id)).toEqual(["lucide-a", "lucide-b"]);
    expect(result.current.icons.every((icon) => icon.sourceId === "lucide")).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("swallows AbortError from a superseded request and applies the current one", async () => {
    const { result } = renderHook(() => useIconBrowser({ initialIcons: [], totalCount: 0 }));

    await act(async () => {
      result.current.setSelectedSource("remix");
    });
    await waitFor(() => expect(pending).toHaveLength(1));

    await act(async () => {
      result.current.setSelectedSource("lucide");
    });
    await waitFor(() => expect(pending).toHaveLength(2));

    // The superseded first request rejects with an AbortError (as a real abort would).
    await act(async () => {
      pending[0]!.reject(new DOMException("Aborted", "AbortError"));
      await tick();
    });

    // The current request still resolves and updates state normally.
    await act(async () => {
      pending[1]!.resolve([makeIcon("lucide-a", "lucide")]);
    });
    await waitFor(() => expect(result.current.icons.map((icon) => icon.id)).toEqual(["lucide-a"]));
    expect(result.current.isLoading).toBe(false);
  });
});
