"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TerminalIcon } from "@/components/icons/ui/terminal";
import { CodeIcon } from "@/components/icons/ui/code";
import { BookOpenIcon } from "@/components/icons/ui/book-open";
import { SparklesIcon } from "@/components/icons/ui/sparkles";
import { MCPIcon } from "@/components/icons/mcp-icon";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Getting Started",
    href: "/docs",
    icon: BookOpenIcon,
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs#getting-started" },
      { title: "Why Unicon?", href: "/docs#why-unicon" },
    ],
  },
  {
    title: "CLI Tool",
    href: "/cli",
    icon: TerminalIcon,
    items: [
      { title: "Overview", href: "/cli" },
      { title: "Installation", href: "/cli#installation" },
      { title: "Commands", href: "/cli#commands" },
      { title: "Config File", href: "/cli#config-file" },
      { title: "Workflow", href: "/cli#workflow" },
    ],
  },
  {
    title: "MCP Integration",
    href: "/docs/mcp",
    icon: MCPIcon,
    items: [
      { title: "Overview", href: "/docs/mcp" },
      { title: "Claude Code", href: "/docs/mcp/claude-code" },
      { title: "SSE Transport", href: "/docs/mcp/sse" },
      { title: "Claude Desktop", href: "/docs/mcp#claude-desktop" },
      { title: "Cursor IDE", href: "/docs/mcp#cursor" },
      { title: "Troubleshooting", href: "/docs/mcp#troubleshooting" },
    ],
  },
  {
    title: "Skills Registry",
    href: "/docs/skills",
    icon: SparklesIcon,
    items: [
      { title: "Overview", href: "/docs/skills" },
      { title: "Install with CLI", href: "/docs/skills#install-with-the-cli" },
      { title: "Direct Downloads", href: "/docs/skills#direct-downloads" },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    icon: CodeIcon,
    items: [
      { title: "Overview", href: "/docs/api" },
      { title: "GET /api/icons", href: "/docs/api#get-icons" },
      { title: "POST /api/search", href: "/docs/api#post-search" },
      { title: "Rate Limits", href: "/docs/api#rate-limits" },
      { title: "Examples", href: "/docs/api#examples" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border bg-background py-6 lg:block">
      <div className="px-6 space-y-6">
        {navigation.map((section) => (
          <div key={section.href}>
            <Link
              href={section.href}
              className={cn(
                "flex items-center gap-2 text-sm font-semibold mb-3 transition-colors",
                pathname === section.href
                  ? "text-[var(--accent-lavender)]"
                  : "text-muted-foreground hover:text-[var(--accent-lavender)]"
              )}
            >
              {section.icon && <section.icon className="w-4 h-4" />}
              {section.title}
            </Link>
            {section.items && (
              <ul className="space-y-2 border-l border-border pl-4">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block text-sm transition-colors py-1",
                        pathname === item.href
                          ? "text-[var(--accent-aqua)] font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
