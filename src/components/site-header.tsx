import Link from "next/link";
import { Github, Terminal, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MCPIcon } from "@/components/icons/mcp-icon";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 lg:px-20 xl:px-40">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl" aria-hidden="true">🦄</span>
            <span className="font-mono text-muted-foreground text-xs tracking-widest uppercase">
              UNICON
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/docs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-[var(--accent-lavender)] hover:bg-[var(--accent-lavender)]/5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Docs
            </Link>
            <Link
              href="/cli"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-[var(--accent-aqua)] hover:bg-[var(--accent-aqua)]/5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              CLI
            </Link>
            <Link
              href="/docs/mcp"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-[var(--accent-lavender)] hover:bg-[var(--accent-lavender)]/5 transition-colors"
            >
              <MCPIcon className="w-3.5 h-3.5" size={14} />
              MCP
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/WebRenew/unicon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
