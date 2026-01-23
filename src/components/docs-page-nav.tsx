import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons/ui/chevron-left";
import { ChevronRightIcon } from "@/components/icons/ui/chevron-right";

interface NavLink {
  readonly href: string;
  readonly title: string;
}

export interface DocsPageNavProps {
  prev?: NavLink;
  next?: NavLink;
}

/**
 * Navigation links for docs pages - shows prev/next at the bottom of each page.
 */
export function DocsPageNav({ prev, next }: DocsPageNavProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Documentation pagination"
      className="flex items-center justify-between gap-4 border-t border-border pt-8 mt-12"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">
              Previous
            </span>
            <span className="font-medium">{prev.title}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">
              Next
            </span>
            <span className="font-medium">{next.title}</span>
          </div>
          <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

/**
 * Ordered list of docs pages for navigation.
 */
export const docsPageOrder: readonly NavLink[] = [
  { href: "/docs", title: "Getting Started" },
  { href: "/cli", title: "CLI Tool" },
  { href: "/docs/mcp", title: "MCP Integration" },
  { href: "/docs/mcp/claude-code", title: "Claude Code" },
  { href: "/docs/mcp/sse", title: "SSE Transport" },
  { href: "/docs/skills", title: "Skills Registry" },
  { href: "/docs/api", title: "API Reference" },
];

/**
 * Get prev/next links for a given docs page path.
 */
export function getDocsNavLinks(currentPath: string): DocsPageNavProps {
  const currentIndex = docsPageOrder.findIndex(
    (page) => page.href === currentPath
  );

  if (currentIndex === -1) return {};

  const result: DocsPageNavProps = {};

  const prevPage = docsPageOrder[currentIndex - 1];
  const nextPage = docsPageOrder[currentIndex + 1];

  if (prevPage) {
    result.prev = prevPage;
  }

  if (nextPage) {
    result.next = nextPage;
  }

  return result;
}
