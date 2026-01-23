import { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon } from "@/components/icons/ui/check-circle";
import { AlertCircleIcon } from "@/components/icons/ui/alert-circle";
import { SparklesIcon } from "@/components/icons/ui/sparkles";
import { CopyButton } from "@/components/ui/copy-button";
import { MCPIcon } from "@/components/icons/mcp-icon";
import { DocsPageNav, getDocsNavLinks } from "@/components/docs-page-nav";
import { CopyPageButton } from "@/components/copy-page-button";

const PAGE_MARKDOWN = `# Unicon for Claude Code

Complete guide to using Unicon with Claude Code (Anthropic's CLI coding assistant).

## Quick Start

### 1. Add MCP Server

Run this single command to add the Unicon MCP server:

\`\`\`bash
claude mcp add unicon -- npx -y @webrenew/unicon-mcp-server
\`\`\`

### 2. Install the Unicon Skill (Recommended)

For the best experience, install the Unicon skill which teaches Claude how to use the icon tools effectively:

\`\`\`bash
npx @webrenew/unicon skill --ide claude      # npm
pnpm dlx @webrenew/unicon skill --ide claude # pnpm
bunx @webrenew/unicon skill --ide claude     # bun
\`\`\`

This creates \`.claude/skills/unicon/SKILL.md\` in your project with comprehensive documentation Claude can reference.

### 3. Verify Setup

\`\`\`bash
claude mcp list
\`\`\`

You should see \`unicon\` in the list.

## Why Install the Skill?

The MCP server gives Claude the *tools* to work with icons. The skill gives Claude the *knowledge* of how to use them effectively.

### Without Skill:
- Claude has access to tools but may not know optimal usage patterns
- May need multiple attempts to find the right icons
- Might not know about all available libraries and formats

### With Skill:
- Claude understands Unicon's capabilities immediately
- Knows to search before getting specific icons
- Understands the difference between icon libraries
- Can recommend the best format for your project
- Follows best practices automatically

## Available MCP Tools

| Tool | Description |
|------|-------------|
| search_icons | AI-powered semantic icon search |
| get_icon | Get a single icon by ID in any format |
| get_multiple_icons | Get multiple icons at once |
| list_libraries | List all 8 icon libraries |
| list_categories | Browse icons by category |
| get_starter_pack | Get curated icon sets |

## Example Prompts

Once set up, you can ask Claude things like:

- "Add a home icon to my header component"
- "Search for icons related to user settings"
- "Get React components for home, settings, and profile icons"
- "What icon libraries are available?"
- "Find notification icons from Lucide"
- "Add dashboard icons to my sidebar"

## Installing the Skill

### Via CLI (Recommended)

\`\`\`bash
npx @webrenew/unicon skill --ide claude      # npm
pnpm dlx @webrenew/unicon skill --ide claude # pnpm
bunx @webrenew/unicon skill --ide claude     # bun
\`\`\`

### Manual Installation

1. Create the directory:
\`\`\`bash
mkdir -p .claude/skills/unicon
\`\`\`

2. Download the skill:
\`\`\`bash
curl -o .claude/skills/unicon/SKILL.md https://unicon.webrenew.com/skills/unicon.md
\`\`\`

### Global Installation

To make the skill available across all projects:

\`\`\`bash
mkdir -p ~/.claude/skills/unicon
curl -o ~/.claude/skills/unicon/SKILL.md https://unicon.webrenew.com/skills/unicon.md
\`\`\`

## Skill Contents

The Unicon skill teaches Claude:

- All CLI commands and their options
- When to use each output format (React, Vue, Svelte, SVG)
- How to search effectively with semantic queries
- Icon library characteristics (stroke vs fill icons)
- Best practices for icon bundling
- Tree-shaking recommendations
- Generated component patterns

## Troubleshooting

### MCP Server Not Working

1. Verify installation:
\`\`\`bash
claude mcp list
\`\`\`

2. Remove and re-add if needed:
\`\`\`bash
claude mcp remove unicon
claude mcp add unicon -- npx -y @webrenew/unicon-mcp-server
\`\`\`

### Skill Not Being Used

- Ensure the skill file exists at \`.claude/skills/unicon/SKILL.md\`
- Check file permissions are readable
- Try starting a new conversation

### Icons Not Found

- Use search_icons first to find correct icon IDs
- Icon IDs follow format: \`source:name\` (e.g., \`lucide:home\`)
- Try broader search terms

## Best Practices

1. **Install both MCP and Skill**: They work together for the best experience
2. **Commit the skill file**: Add \`.claude/skills/unicon/SKILL.md\` to git so your team benefits
3. **Be descriptive**: Use natural language like "loading spinner" instead of exact icon names
4. **Specify format**: Tell Claude if you want React, Vue, Svelte, or SVG output
5. **Batch requests**: Ask for multiple icons in one prompt when possible
`;

export const metadata: Metadata = {
  title: "Claude Code Integration | Unicon",
  description: "Complete guide to using Unicon with Claude Code. Install MCP server and skill for the best icon development experience.",
  keywords: [
    "claude code",
    "claude cli",
    "anthropic claude",
    "mcp server",
    "ai coding assistant",
    "icon development",
    "claude skills",
  ],
  alternates: {
    canonical: "/docs/mcp/claude-code",
  },
  openGraph: {
    title: "Unicon for Claude Code",
    description: "Complete guide to using Unicon with Claude Code. Install MCP server and skill for the best experience.",
    url: "https://unicon.webrenew.com/docs/mcp/claude-code",
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

export default function ClaudeCodeDocsPage() {
  return (
    <div className="w-full py-10 px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--accent-lavender)]/10 border border-[var(--accent-lavender)]/20">
            <MCPIcon className="w-6 h-6 text-[var(--accent-lavender)]" size={24} />
          </div>
          <CopyPageButton markdown={PAGE_MARKDOWN} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Unicon for Claude Code</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Complete guide to using Unicon with Claude Code (Anthropic&apos;s CLI coding assistant).
        </p>
      </div>

      <div className="space-y-12">
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent-aqua)] text-background text-sm flex items-center justify-center font-bold">1</span>
                Add MCP Server
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Run this single command to add the Unicon MCP server:
              </p>
              <CodeBlock title="Terminal">{`claude mcp add unicon -- npx -y @webrenew/unicon-mcp-server`}</CodeBlock>
            </div>

            <div className="p-5 rounded-xl border-2 border-[var(--accent-lavender)]/30 bg-[var(--accent-lavender)]/5">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent-lavender)] text-background text-sm flex items-center justify-center font-bold">2</span>
                <SparklesIcon className="w-5 h-5 text-[var(--accent-lavender)]" />
                Install the Unicon Skill (Recommended)
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                For the best experience, install the Unicon skill which teaches Claude how to use the icon tools effectively:
              </p>
              <CodeBlock title="Terminal">{`npx @webrenew/unicon skill --ide claude      # npm
pnpm dlx @webrenew/unicon skill --ide claude # pnpm
bunx @webrenew/unicon skill --ide claude     # bun`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-3">
                This creates <code className="text-[var(--accent-aqua)]">.claude/skills/unicon/SKILL.md</code> in your project.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent-mint)] text-background text-sm flex items-center justify-center font-bold">3</span>
                Verify Setup
              </h3>
              <CodeBlock title="Terminal">{`claude mcp list`}</CodeBlock>
              <p className="text-sm text-muted-foreground mt-3">
                You should see <code className="text-[var(--accent-aqua)]">unicon</code> in the list.
              </p>
            </div>
          </div>
        </section>

        {/* Why Install Skill */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Why Install the Skill?</h2>
          <p className="text-muted-foreground mb-6">
            The MCP server gives Claude the <strong>tools</strong> to work with icons. The skill gives Claude the <strong>knowledge</strong> of how to use them effectively.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5" />
                Without Skill
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  Claude has tools but may not know optimal usage patterns
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  May need multiple attempts to find right icons
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  Might not know about all libraries and formats
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <h3 className="font-semibold text-[var(--accent-mint)] mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                With Skill
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Understands Unicon&apos;s capabilities immediately
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Knows to search before getting specific icons
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Understands differences between icon libraries
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Can recommend best format for your project
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Follows best practices automatically
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Available Tools */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Available MCP Tools</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Tool</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">search_icons</td>
                  <td className="py-3 px-4 text-muted-foreground">AI-powered semantic icon search</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_icon</td>
                  <td className="py-3 px-4 text-muted-foreground">Get a single icon by ID in any format</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_multiple_icons</td>
                  <td className="py-3 px-4 text-muted-foreground">Get multiple icons at once</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">list_libraries</td>
                  <td className="py-3 px-4 text-muted-foreground">List all 8 icon libraries</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">list_categories</td>
                  <td className="py-3 px-4 text-muted-foreground">Browse icons by category</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_starter_pack</td>
                  <td className="py-3 px-4 text-muted-foreground">Get curated icon sets</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Example Prompts */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Example Prompts</h2>
          <p className="text-muted-foreground mb-4">
            Once set up, you can ask Claude things like:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Add a home icon to my header component",
              "Search for icons related to user settings",
              "Get React components for home, settings, and profile icons",
              "What icon libraries are available?",
              "Find notification icons from Lucide",
              "Add dashboard icons to my sidebar",
            ].map((prompt) => (
              <div key={prompt} className="p-3 rounded-lg border border-border bg-card text-sm">
                &ldquo;{prompt}&rdquo;
              </div>
            ))}
          </div>
        </section>

        {/* Installing the Skill */}
        <section id="installing-skill">
          <h2 className="text-2xl font-bold mb-6">Installing the Skill</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Via CLI (Recommended)</h3>
              <CodeBlock title="Terminal">{`npx @webrenew/unicon skill --ide claude      # npm
pnpm dlx @webrenew/unicon skill --ide claude # pnpm
bunx @webrenew/unicon skill --ide claude     # bun`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Manual Installation</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">1. Create the directory:</p>
                <CodeBlock>{`mkdir -p .claude/skills/unicon`}</CodeBlock>
                <p className="text-sm text-muted-foreground">2. Download the skill:</p>
                <CodeBlock>{`curl -o .claude/skills/unicon/SKILL.md https://unicon.webrenew.com/skills/unicon.md`}</CodeBlock>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Global Installation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                To make the skill available across all projects:
              </p>
              <CodeBlock>{`mkdir -p ~/.claude/skills/unicon
curl -o ~/.claude/skills/unicon/SKILL.md https://unicon.webrenew.com/skills/unicon.md`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Skill Contents */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Skill Contents</h2>
          <p className="text-muted-foreground mb-4">
            The Unicon skill teaches Claude:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "All CLI commands and their options",
              "When to use each output format (React, Vue, Svelte, SVG)",
              "How to search effectively with semantic queries",
              "Icon library characteristics (stroke vs fill)",
              "Best practices for icon bundling",
              "Tree-shaking recommendations",
              "Generated component patterns",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-[var(--accent-mint)] shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link 
              href="/docs/skills" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background hover:bg-accent transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              View Skills Registry
            </Link>
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">MCP Server Not Working</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Verify installation:</p>
                <CodeBlock>{`claude mcp list`}</CodeBlock>
                <p>2. Remove and re-add if needed:</p>
                <CodeBlock>{`claude mcp remove unicon
claude mcp add unicon -- npx -y @webrenew/unicon-mcp-server`}</CodeBlock>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Skill Not Being Used</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure the skill file exists at <code className="text-[var(--accent-aqua)]">.claude/skills/unicon/SKILL.md</code></li>
                <li>• Check file permissions are readable</li>
                <li>• Try starting a new conversation</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Icons Not Found</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use search_icons first to find correct icon IDs</li>
                <li>• Icon IDs follow format: <code className="text-[var(--accent-aqua)]">source:name</code> (e.g., <code className="text-[var(--accent-aqua)]">lucide:home</code>)</li>
                <li>• Try broader search terms</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="space-y-3">
            {[
              { title: "Install both MCP and Skill", desc: "They work together for the best experience" },
              { title: "Commit the skill file", desc: "Add .claude/skills/unicon/SKILL.md to git so your team benefits" },
              { title: "Be descriptive", desc: "Use natural language like \"loading spinner\" instead of exact icon names" },
              { title: "Specify format", desc: "Tell Claude if you want React, Vue, Svelte, or SVG output" },
              { title: "Batch requests", desc: "Ask for multiple icons in one prompt when possible" },
            ].map((item, i) => (
              <div key={item.title} className="flex gap-3 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
                <span className="w-6 h-6 rounded-full bg-[var(--accent-mint)] text-background text-sm flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <strong className="text-foreground">{item.title}</strong>
                  <span className="text-muted-foreground"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Page Navigation */}
        <DocsPageNav {...getDocsNavLinks("/docs/mcp/claude-code")} />
      </div>
    </div>
  );
}
