import { Metadata } from "next";
import { CheckCircleIcon } from "@/components/icons/ui/check-circle";
import { AlertCircleIcon } from "@/components/icons/ui/alert-circle";
import { CopyButton } from "@/components/ui/copy-button";
import { MCPIcon } from "@/components/icons/mcp-icon";
import { MCPInstallButtons } from "@/components/mcp-install-buttons";

export const metadata: Metadata = {
  title: "MCP Integration | Unicon",
  description: "Integrate Unicon with Claude Desktop, Cursor, and other AI assistants via Model Context Protocol (MCP). Search and generate icon components using natural language.",
  keywords: [
    "mcp server",
    "model context protocol",
    "claude desktop",
    "cursor integration",
    "ai assistant",
    "icon mcp",
    "claude icons",
    "ai icons",
  ],
  alternates: {
    canonical: "/docs/mcp",
  },
  openGraph: {
    title: "Unicon MCP Integration — Use Icons with AI Assistants",
    description: "Connect Unicon to Claude, Cursor, and other AI assistants. Search and generate icon components using natural language.",
    url: "https://unicon.webrenew.com/docs/mcp",
    type: "website",
  },
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-muted/40">
      {title && (
        <div className="px-3 py-2 border-b border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
          <span>{title}</span>
          <CopyButton value={children} />
        </div>
      )}
      {!title && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton value={children} />
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground/80">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function MCPDocsPage() {
  return (
    <div className="w-full py-10 px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--accent-lavender)]/10 border border-[var(--accent-lavender)]/20">
            <MCPIcon className="w-6 h-6 text-[var(--accent-lavender)]" size={24} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--accent-lavender)]/10 text-[var(--accent-lavender)] border border-[var(--accent-lavender)]/30">
            MCP Server
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">MCP Integration</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Use Unicon with Claude Desktop, Cursor, and other AI assistants via the Model Context Protocol.
          Search and generate icon components using natural language.
        </p>
      </div>

      <div className="space-y-16">
        {/* Quick Install */}
        <section>
          <MCPInstallButtons />
        </section>

        {/* What is MCP */}
        <section>
          <h2 className="text-2xl font-bold mb-4">What is MCP?</h2>
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground leading-relaxed mb-4">
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-lavender)] hover:text-[var(--accent-lavender)]/80 underline"
              >
                Model Context Protocol (MCP)
              </a>{" "}
              is an open protocol that enables AI assistants to connect to external tools and data sources.
              The Unicon MCP Server lets AI assistants search through 14,700+ icons and generate
              framework-specific components on demand.
            </p>
            <p className="text-white/70 leading-relaxed">
              Instead of manually searching for icons and copying code, you can simply ask your AI assistant:
              <em className="text-foreground/90"> &quot;Give me React components for home, settings, and user icons from Lucide&quot;</em>
              {" "}— and get production-ready code instantly.
            </p>
          </div>
        </section>

        {/* Architecture */}
        <section>
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="text-sm font-semibold mb-3 text-[var(--accent-aqua)]">Desktop Apps (stdio)</h3>
              <div className="font-mono text-xs space-y-1 text-muted-foreground">
                <div>Claude Desktop / Cursor</div>
                <div className="text-center">↓ stdio</div>
                <div>Local Bridge (npx)</div>
                <div className="text-center">↓ HTTPS</div>
                <div>unicon.webrenew.com/api/mcp</div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="text-sm font-semibold mb-3 text-[var(--accent-lavender)]">Cloud IDEs (HTTP)</h3>
              <div className="font-mono text-xs space-y-1 text-muted-foreground">
                <div>v0 / Bolt / Lovable</div>
                <div className="text-center">↓ Streamable HTTP</div>
                <div>unicon.webrenew.com/api/mcp</div>
                <div className="text-center text-[var(--accent-mint)]">✓ Direct connection</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Desktop apps require a local bridge for stdio transport. Cloud IDEs connect directly via HTTP.
            Both methods provide the same functionality.
          </p>
        </section>

        {/* Quick Start - Claude Desktop */}
        <section id="claude-desktop">
          <h2 className="text-2xl font-bold mb-6">Quick Start: Claude Desktop</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">1</span>
                Locate your config file
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">macOS:</strong>
                </div>
                <CodeBlock>~/Library/Application Support/Claude/claude_desktop_config.json</CodeBlock>

                <div className="text-sm text-muted-foreground mt-4">
                  <strong className="text-foreground">Windows:</strong>
                </div>
                <CodeBlock>%APPDATA%\Claude\claude_desktop_config.json</CodeBlock>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">2</span>
                Add Unicon to your config
              </h3>
              <CodeBlock title="claude_desktop_config.json">{`{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@webrenew/unicon-mcp-server"]
    }
  }
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">3</span>
                Restart Claude Desktop
              </h3>
              <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-[var(--accent-lavender)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-[var(--accent-lavender)] font-semibold mb-1">Important</p>
                    <p className="text-muted-foreground">
                      You must completely quit and restart Claude (not just close the window).
                      On macOS, use Cmd+Q. On Windows, right-click the system tray icon and select &quot;Quit&quot;.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">✓</span>
                Verify installation
              </h3>
              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Look for the 🔌 icon in the bottom right corner of Claude Desktop.
                      Click it and you should see &quot;unicon&quot; in the list of MCP servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start - Claude Code */}
        <section id="claude-code">
          <h2 className="text-2xl font-bold mb-6">Quick Start: Claude Code (CLI)</h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Add the Unicon MCP server with a single command:
              </p>
              <CodeBlock title="Terminal">{`claude mcp add unicon -- npx -y @webrenew/unicon-mcp-server`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">✓</span>
                Verify installation
              </h3>
              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Run <code className="text-[var(--accent-aqua)]">claude mcp list</code> to verify &quot;unicon&quot; appears in your configured servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start - Cursor */}
        <section id="cursor">
          <h2 className="text-2xl font-bold mb-6">Quick Start: Cursor IDE</h2>

          <div className="space-y-6">
            <div>
              <div className="p-4 rounded-lg border border-[var(--accent-aqua)]/20 bg-[var(--accent-aqua)]/5 mb-6">
                <div className="flex gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-[var(--accent-aqua)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Easiest:</strong> Use the one-click install button at the top of this page to add Unicon to Cursor instantly.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">1</span>
                Open MCP settings
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                In Cursor, go to <strong className="text-foreground">Settings → MCP Servers</strong>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">2</span>
                Add server configuration
              </h3>
              <CodeBlock title="MCP Server Config">{`{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@webrenew/unicon-mcp-server"]
    }
  }
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-aqua)]/20 text-[var(--accent-aqua)] text-sm">3</span>
                Restart Cursor
              </h3>
              <p className="text-sm text-muted-foreground">
                Completely restart Cursor for the changes to take effect.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start - Cloud IDEs */}
        <section id="cloud-ides">
          <h2 className="text-2xl font-bold mb-6">Cloud IDEs (v0, Bolt, Lovable)</h2>

          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-border bg-card">
              <p className="text-muted-foreground leading-relaxed mb-4">
                For cloud-based environments that support URL-based MCP connections, use the Streamable HTTP endpoint directly — no local installation required.
              </p>
              <CodeBlock title="MCP Endpoint URL">{`https://unicon.webrenew.com/api/mcp`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Supported Platforms</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">v0 (Vercel)</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">Bolt</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">Lovable</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">Codespaces</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">Gitpod</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card text-center">
                  <span className="text-sm font-medium">Custom Agents</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[var(--accent-lavender)]/20 bg-[var(--accent-lavender)]/5">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Why two methods?</strong> Desktop apps like Claude Desktop and Cursor require a local bridge (stdio transport). Cloud IDEs can connect directly via HTTP.
              </p>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section id="usage-examples">
          <h2 className="text-2xl font-bold mb-6">Usage Examples</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">🔍 Search for Icons</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                  <div className="space-y-2">
                    <p className="text-foreground/90">&quot;Search for arrow icons in Lucide&quot;</p>
                    <p className="text-foreground/90">&quot;Find dashboard icons&quot;</p>
                    <p className="text-foreground/90">&quot;Show me social media icons from Simple Icons&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">📦 Get Single Icon</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                  <div className="space-y-2">
                    <p className="text-foreground/90">&quot;Get React component for lucide:arrow-right&quot;</p>
                    <p className="text-foreground/90">&quot;Generate Vue component for heroicons:bell&quot;</p>
                    <p className="text-foreground/90">&quot;Get SVG code for simple-icons:github&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">🎨 Get Multiple Icons</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                  <div className="space-y-2">
                    <p className="text-foreground/90">
                      &quot;Give me React components for home, settings, and user icons from Lucide&quot;
                    </p>
                    <p className="text-foreground/90">
                      &quot;Generate Svelte components for all arrow icons in Phosphor&quot;
                    </p>
                    <p className="text-foreground/90">
                      &quot;Get Vue components for social media icons with size 32&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">ℹ️ Get Information</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                  <div className="space-y-2">
                    <p className="text-foreground/90">&quot;What icon libraries are available in Unicon?&quot;</p>
                    <p className="text-foreground/90">&quot;How many icons does Unicon have?&quot;</p>
                    <p className="text-foreground/90">&quot;What categories exist?&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Tools */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Available Tools</h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-aqua)] font-semibold mb-2">unicon_search_icons</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Search through 14,700+ icons using AI-powered semantic search.
              </p>
              <div className="text-xs font-mono text-muted-foreground">
                <div>Parameters:</div>
                <div className="ml-4 mt-1">
                  <div>• query (required) - Search query</div>
                  <div>• source (optional) - Filter by library</div>
                  <div>• category (optional) - Filter by category</div>
                  <div>• limit (optional) - Max results (default: 20)</div>
                  <div>• offset (optional) - Skip results for pagination</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-aqua)] font-semibold mb-2">unicon_get_icon</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Retrieve source code for a specific icon in any format.
              </p>
              <div className="text-xs font-mono text-muted-foreground">
                <div>Parameters:</div>
                <div className="ml-4 mt-1">
                  <div>• iconId (required) - Icon ID (e.g., &quot;lucide:home&quot;)</div>
                  <div>• format (optional) - svg, react, vue, svelte, json</div>
                  <div>• size (optional) - Icon size in pixels</div>
                  <div>• strokeWidth (optional) - Stroke width</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-aqua)] font-semibold mb-2">unicon_get_multiple_icons</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Retrieve multiple icons in one request (max 50).
              </p>
              <div className="text-xs font-mono text-muted-foreground">
                <div>Parameters:</div>
                <div className="ml-4 mt-1">
                  <div>• iconIds (required) - Array of icon IDs</div>
                  <div>• format (optional) - Output format for all icons</div>
                  <div>• size (optional) - Size for all icons</div>
                  <div>• strokeWidth (optional) - Stroke width for all icons</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-aqua)] font-semibold mb-2">unicon_get_starter_pack</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get a curated starter pack of icons for common use cases.
              </p>
              <div className="text-xs font-mono text-muted-foreground">
                <div>Parameters:</div>
                <div className="ml-4 mt-1">
                  <div>• packId (required) - Pack ID (dashboard, ecommerce, social, brand-ai)</div>
                  <div>• format (optional) - Output format for all icons</div>
                  <div>• size (optional) - Size for all icons</div>
                  <div>• strokeWidth (optional) - Stroke width for all icons</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Resources */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Available Resources</h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-lavender)] font-semibold mb-2">unicon://sources</h3>
              <p className="text-sm text-muted-foreground">
                List all icon libraries with metadata (version, license, icon count).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-lavender)] font-semibold mb-2">unicon://categories</h3>
              <p className="text-sm text-muted-foreground">
                List all available icon categories for filtering.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-lavender)] font-semibold mb-2">unicon://stats</h3>
              <p className="text-sm text-muted-foreground">
                Get library statistics including total icon count and breakdown by source.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-mono text-[var(--accent-lavender)] font-semibold mb-2">unicon://starter_packs</h3>
              <p className="text-sm text-muted-foreground">
                List available starter packs with their icons for common use cases.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting">
          <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Server not appearing in Claude/Cursor</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Verify your JSON config is valid (no trailing commas)</p>
                <p>2. Completely restart the application (Cmd+Q on Mac)</p>
                <p>3. Check Developer Console for errors</p>
                <p>4. Try running manually: <code className="text-[var(--accent-aqua)]">npx -y @webrenew/unicon-mcp-server</code></p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Icon not found</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Verify icon ID format: <code className="text-[var(--accent-aqua)]">source:icon-name</code> (all lowercase)</p>
                <p>2. Use <code className="text-[var(--accent-aqua)]">unicon_search_icons</code> tool first to find the exact ID</p>
                <p>3. Check icon exists at{" "}
                  <a href="https://unicon.webrenew.com" className="text-[var(--accent-lavender)] hover:underline">
                    unicon.webrenew.com
                  </a>
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Slow responses</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>First request may be slower due to cold start (npx downloading the package)</p>
                <p>Subsequent requests should be fast</p>
                <p>Check your internet connection</p>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Configuration */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Advanced Configuration</h2>

          <div>
            <h3 className="text-lg font-semibold mb-3">Local Development</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Point to a local Unicon instance for development:
            </p>
            <CodeBlock title="claude_desktop_config.json">{`{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@webrenew/unicon-mcp-server"],
      "env": {
        "UNICON_API_URL": "http://localhost:3000/api/mcp"
      }
    }
  }
}`}</CodeBlock>
          </div>
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Best Practices</h2>

          <div className="space-y-3">
            <div className="flex gap-3 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Search before getting:</strong>
                <span className="text-muted-foreground"> Always search first to find the right icon ID</span>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Specify library:</strong>
                <span className="text-muted-foreground"> Be specific about which library to use for focused results</span>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Batch multiple icons:</strong>
                <span className="text-muted-foreground"> Use get_multiple_icons for multiple icons in one request</span>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <CheckCircleIcon className="w-5 h-5 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Use semantic search:</strong>
                <span className="text-muted-foreground"> Take advantage of AI search with descriptive queries</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
