import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { logger } from "@/lib/logger";
import { CopyPageButton } from "./copy-page-button";

/**
 * Replicates Google Translate's DOM mutation: every non-empty text node is
 * replaced with nested <font> elements containing the (translated) text.
 * React's cached references to the original text nodes become detached, which
 * crashed reconciliation with insertBefore/removeChild NotFoundError before
 * the labels were wrapped in <span> elements (Sentry UNICON-A,
 * facebook/react#11538).
 */
function simulateGoogleTranslate(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.textContent?.trim()) {
      textNodes.push(node);
    }
  }
  for (const textNode of textNodes) {
    const inner = document.createElement("font");
    inner.textContent = textNode.textContent;
    const outer = document.createElement("font");
    outer.appendChild(inner);
    textNode.parentNode?.replaceChild(outer, textNode);
  }
}

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

describe("CopyPageButton", () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps findByRole's waitFor polling working under fake timers
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    // Drain the component's 2s reset timer before jsdom teardown — pending
    // timers firing after teardown are a documented CI flake in this repo
    // (see src/__tests__/setup.ts).
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
    vi.restoreAllMocks();
  });

  it("should toggle to copied state when clicked", async () => {
    render(<CopyPageButton markdown="# Docs" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy page as Markdown" }));

    expect(
      await screen.findByRole("button", { name: "Copied page content" })
    ).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Docs");
  });

  it("should revert to the copy label after 2 seconds", async () => {
    render(<CopyPageButton markdown="# Docs" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy page as Markdown" }));
    expect(
      await screen.findByRole("button", { name: "Copied page content" })
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByRole("button", { name: "Copy page as Markdown" })
    ).toBeInTheDocument();
  });

  it("should keep the copy label and log when the clipboard write fails", async () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    render(<CopyPageButton markdown="# Docs" />);
    const button = screen.getByRole("button", { name: "Copy page as Markdown" });
    (navigator.clipboard.writeText as Mock).mockRejectedValue(new Error("denied"));

    fireEvent.click(button);

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Copy page as Markdown" })
    ).toBeInTheDocument();
  });

  it("should not crash when clicked after Google Translate rewrites text nodes", async () => {
    render(<CopyPageButton markdown="# Docs" />);
    const button = screen.getByRole("button", { name: "Copy page as Markdown" });

    simulateGoogleTranslate(button);

    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: "Copied page content" })
    ).toBeInTheDocument();
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});
