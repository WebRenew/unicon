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

  it("ignores a stale unfiltered response that resolves after a newer filtered one", async () => {
    const { result } = renderHook(() => useIconBrowser({ initialIcons: [], totalCount: 0 }));

    // Mount triggers the initial, unfiltered fetch.
    await waitFor(() => expect(pending).toHaveLength(1));
    const staleRequest = pending[0]!;
    expect(staleRequest.url).not.toContain("source=");

    // User picks a library while the first request is still in flight.
    await act(async () => {
      result.current.setSelectedSource("remix");
    });
    await waitFor(() => expect(pending).toHaveLength(2));
    const remixRequest = pending[1]!;
    expect(remixRequest.url).toContain("source=remix");

    // The newer (filtered) request resolves first.
    await act(async () => {
      remixRequest.resolve([makeIcon("remix-a", "remix"), makeIcon("remix-b", "remix")]);
    });
    await waitFor(() =>
      expect(result.current.icons.map((icon) => icon.id)).toEqual(["remix-a", "remix-b"]),
    );

    // The older (unfiltered) request resolves afterwards — it must not clobber state.
    await act(async () => {
      staleRequest.resolve([makeIcon("lucide-x", "lucide"), makeIcon("tabler-y", "tabler")]);
      await tick();
    });

    expect(result.current.icons.map((icon) => icon.id)).toEqual(["remix-a", "remix-b"]);
    expect(result.current.icons.every((icon) => icon.sourceId === "remix")).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("swallows AbortError from a superseded request and applies the current one", async () => {
    const { result } = renderHook(() => useIconBrowser({ initialIcons: [], totalCount: 0 }));
    await waitFor(() => expect(pending).toHaveLength(1));

    await act(async () => {
      result.current.setSelectedSource("remix");
    });
    await waitFor(() => expect(pending).toHaveLength(2));

    // The superseded first request rejects with an AbortError (as a real abort would).
    await act(async () => {
      pending[0]!.reject(new DOMException("Aborted", "AbortError"));
      await tick();
    });

    // The current request still resolves and updates state normally.
    await act(async () => {
      pending[1]!.resolve([makeIcon("remix-a", "remix")]);
    });
    await waitFor(() => expect(result.current.icons.map((icon) => icon.id)).toEqual(["remix-a"]));
    expect(result.current.isLoading).toBe(false);
  });
});
