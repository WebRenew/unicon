"use client";

import Link from "next/link";
import { GithubIcon } from "@/components/icons/ui/github";
import { TerminalIcon } from "@/components/icons/ui/terminal";
import { FileTextIcon } from "@/components/icons/ui/file-text";
import { PackageIcon } from "@/components/icons/ui/package";
import { ThemeToggle } from "@/components/theme-toggle";
import { MCPIcon } from "@/components/icons/mcp-icon";
import { useState, useEffect } from "react";
import type { IconData } from "@/types/icon";

export function HomeHeader() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Update cart count from localStorage
    const updateCartCount = () => {
      try {
        const savedCart = localStorage.getItem("unicon-bundle");
        if (savedCart) {
          const parsed = JSON.parse(savedCart) as IconData[];
          setCartCount(parsed.length);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for storage events and custom cart updates
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdate", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdate", updateCartCount);
    };
  }, []);

  const handleBundleClick = () => {
    // Dispatch event to open cart in MetallicIconBrowser
    window.dispatchEvent(new CustomEvent("openCart"));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60">
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
              <FileTextIcon className="w-3.5 h-3.5" />
              Docs
            </Link>
            <Link
              href="/cli"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-[var(--accent-aqua)] hover:bg-[var(--accent-aqua)]/5 transition-colors"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
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
          <button
            onClick={handleBundleClick}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--accent-mint)]/30 dark:bg-[var(--accent-mint)]/20 text-black/80 dark:text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/40 dark:hover:bg-[var(--accent-mint)]/30 border-2 border-[var(--accent-mint)]/50 dark:border-[var(--accent-mint)]/30 transition-all text-sm font-medium"
          >
            <PackageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Bundle</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-[var(--accent-mint)] text-black text-xs rounded-full font-semibold">
                {cartCount}
              </span>
            )}
          </button>
          <ThemeToggle />
          <a
            href="https://github.com/WebRenew/unicon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <GithubIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
