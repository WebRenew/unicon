import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("CopyPageButton", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("should toggle to copied state when clicked", async () => {
    render(<CopyPageButton markdown="# Docs" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy page as Markdown" }));

    expect(
      await screen.findByRole("button", { name: "Copied page content" })
    ).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Docs");
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
