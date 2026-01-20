import { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  Terminal,
  Sparkles,
  FileCode,
  Search,
  Zap,
  Download,
  Palette,
  Code,
  Globe,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | Unicon",
  description: "Complete guide to using Unicon - browse 14,700+ icons from 8 libraries, use the CLI tool, or integrate with AI assistants via MCP.",
  keywords: [
    "icon library",
    "icon documentation",
    "react icons",
    "vue icons",
    "svelte icons",
    "icon cli",
    "mcp server",
    "ai integration",
    "icon tool",
  ],
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Unicon Documentation",
    description: "Browse, search, and export 14,700+ icons. CLI tool and AI assistant integration included.",
    url: "https://unicon.webrenew.com/docs",
    type: "website",
  },
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

function FeatureCard({ icon: Icon, title, description, href, external = false }: FeatureCardProps) {
  const LinkWrapper = external ? "a" : Link;
  const extraProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <LinkWrapper
      href={href}
      {...extraProps}
      className="group p-6 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-border shrink-0">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {external && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-auto" />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </LinkWrapper>
  );
}

export default function DocsPage() {
  return (
    <div className="container max-w-4xl py-10 px-4 md:px-6">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-border">
            <FileCode className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Everything you need to know about using Unicon — from browsing icons in the web interface to 
          integrating with your development workflow.
        </p>
      </div>

      <div className="space-y-16">
        {/* What is Unicon */}
        <section>
          <h2 className="text-2xl font-bold mb-6">What is Unicon?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Unicon is a comprehensive icon management tool that gives you access to{" "}
              <strong className="text-foreground">14,700+ icons</strong> from 8 popular icon libraries — 
              all in one place. Unlike traditional icon packages that bloat your bundle with thousands of 
              unused icons, Unicon lets you generate only the icons you need.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you prefer browsing icons visually, using a command-line interface, or letting AI 
              assistants find icons for you, Unicon has you covered.
            </p>
          </div>
        </section>

        {/* Icon Libraries */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Icon Libraries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <h3 className="font-mono font-medium mb-1 text-orange-400">Lucide</h3>
              <p className="text-muted-foreground text-xs">1,900+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="font-mono font-medium mb-1 text-emerald-400">Phosphor</h3>
              <p className="text-muted-foreground text-xs">1,500+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <h3 className="font-mono font-medium mb-1 text-violet-400">Hugeicons</h3>
              <p className="text-muted-foreground text-xs">1,800+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <h3 className="font-mono font-medium mb-1 text-blue-400">Heroicons</h3>
              <p className="text-muted-foreground text-xs">292 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <h3 className="font-mono font-medium mb-1 text-cyan-400">Tabler</h3>
              <p className="text-muted-foreground text-xs">4,600+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-500/20 bg-gray-500/5">
              <h3 className="font-mono font-medium mb-1 text-gray-400">Feather</h3>
              <p className="text-muted-foreground text-xs">287 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <h3 className="font-mono font-medium mb-1 text-indigo-400">Remix</h3>
              <p className="text-muted-foreground text-xs">2,800+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-500/5">
              <h3 className="font-mono font-medium mb-1 text-slate-400">Simple Icons</h3>
              <p className="text-muted-foreground text-xs">3,300+ brand logos</p>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section id="getting-started">
          <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
          <div className="grid gap-4">
            <FeatureCard
              icon={Globe}
              title="Web Interface"
              description="Browse and search icons visually. Copy React, Vue, Svelte components or raw SVG with one click."
              href="/"
            />
            <FeatureCard
              icon={Terminal}
              title="CLI Tool"
              description="Command-line interface for searching, bundling, and generating icon components. Perfect for CI/CD."
              href="/cli"
            />
            <FeatureCard
              icon={Sparkles}
              title="MCP Server (AI Integration)"
              description="Use Unicon with Claude Desktop, Cursor, or any MCP-compatible AI assistant."
              href="/docs/mcp"
            />
          </div>
        </section>

        {/* Key Features */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold">AI-Powered Search</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Semantic search understands intent. Search for &quot;celebration&quot; and find party, confetti, 
                and cake icons.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold">Tree-Shakeable</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate one file per icon for perfect tree-shaking. Only bundle icons you actually use.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Multi-Framework</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export as React, Vue 3, Svelte components, or plain SVG. Full TypeScript support.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold">Zero Dependencies</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generated components have no external dependencies. Copy and own your icons.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Bundle Builder</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Define icon bundles in config file. Regenerate anytime with a single command.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold">Customizable</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Control size, stroke width, colors, and all standard SVG properties.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
          <div className="grid gap-3">
            <FeatureCard
              icon={Terminal}
              title="CLI Documentation"
              description="Complete guide to the command-line interface including all commands and options."
              href="/cli"
            />
            <FeatureCard
              icon={Sparkles}
              title="MCP Integration Guide"
              description="Set up Unicon with Claude Desktop, Cursor, or other AI assistants."
              href="/docs/mcp"
            />
            <FeatureCard
              icon={FileCode}
              title="API Reference"
              description="REST API documentation for programmatic access to icons."
              href="/docs/api"
            />
            <FeatureCard
              icon={Code}
              title="GitHub Repository"
              description="View source code, report issues, or contribute to the project."
              href="https://github.com/WebRenew/unicon"
              external
            />
          </div>
        </section>

        {/* Why Unicon */}
        <section id="why-unicon">
          <h2 className="text-2xl font-bold mb-6">Why Unicon?</h2>
          <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-emerald-400 mb-2">Traditional Icon Packages</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Download thousands of unused icons</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Bloated bundle sizes</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Rely on bundler tree-shaking (unreliable)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400">✗</span>
                    <span>External dependencies to maintain</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold text-emerald-400 mb-2">Unicon Approach</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Generate only the icons you need</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Zero bundle bloat</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>One file per icon = perfect tree-shaking</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>No external dependencies</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Access 14,700+ icons from 8 libraries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="border-t border-border pt-12">
          <h2 className="text-2xl font-bold mb-6">Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <a
              href="https://github.com/WebRenew/unicon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <h3 className="font-semibold mb-2">Report Issues</h3>
              <p className="text-muted-foreground">Found a bug? Let us know on GitHub.</p>
            </a>
            <a
              href="https://github.com/WebRenew/unicon/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <h3 className="font-semibold mb-2">Discussions</h3>
              <p className="text-muted-foreground">Ask questions and share ideas.</p>
            </a>
            <a
              href="mailto:support@webrenew.com"
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-muted-foreground">Get in touch directly.</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
