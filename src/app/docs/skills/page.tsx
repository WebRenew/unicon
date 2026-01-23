import { Metadata } from "next";
import Link from "next/link";
import { SparklesIcon } from "@/components/icons/ui/sparkles";
import { DownloadIcon } from "@/components/icons/ui/download";
import { CopyButton } from "@/components/ui/copy-button";
import { skillEntries } from "@/lib/skills";
import { DocsPageNav, getDocsNavLinks } from "@/components/docs-page-nav";
import { CopyPageButton } from "@/components/copy-page-button";

const PAGE_MARKDOWN = `# Unicon Skills Registry

Download Unicon skills for AI assistants. Install once and let your assistant generate icons on demand.

## What is a Skill?

A skill is a markdown document that teaches AI assistants how to use Unicon. Once installed, your assistant can search for icons, generate components, and bundle icons automatically.

## Available Skills

### Unicon
Help users add icons to React, Vue, Svelte, or web projects using the Unicon CLI and API.

Tags: icons, cli, ai-assistants, api

Download: https://unicon.webrenew.com/skills/unicon.md

### Unicon MCP
Guide setup and usage of the Unicon MCP server in Claude, Cursor, and other MCP clients.

Tags: mcp, ai-assistants, icons, setup

Download: https://unicon.webrenew.com/skills/unicon-mcp.md

## Install with the CLI

\`\`\`bash
# List supported IDEs
unicon skill --list

# Install for specific IDE
unicon skill --ide cursor
unicon skill --ide claude

# Install for all IDEs
unicon skill --all
\`\`\`

Supported IDEs:
- Claude Code
- Cursor
- Windsurf
- Agent
- Antigravity
- OpenCode
- Codex
- Aider

## Direct Downloads

Download skills directly from the registry:

- Registry JSON: https://unicon.webrenew.com/skills/index.json
- Unicon Skill: https://unicon.webrenew.com/skills/unicon.md
- MCP Skill: https://unicon.webrenew.com/skills/unicon-mcp.md

Place the markdown file in your assistant's rules directory.
`;

export const metadata: Metadata = {
  title: "Skills Registry | Unicon",
  description: "Download Unicon skills for AI assistants. Install once and let your assistant generate icons on demand.",
  keywords: [
    "unicon skills",
    "ai assistant skills",
    "cursor rules",
    "claude skills",
    "developer workflow",
  ],
  alternates: {
    canonical: "/docs/skills",
  },
  openGraph: {
    title: "Unicon Skills Registry",
    description: "Download Unicon skills for AI assistants and add icon workflows to your tools.",
    url: "https://unicon.webrenew.com/docs/skills",
    type: "website",
  },
};

interface CodeBlockProps {
  readonly children: string;
  readonly title?: string;
}

function CodeBlock({ children, title }: CodeBlockProps) {
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

export default function SkillsDocsPage() {
  return (
    <div className="w-full py-10 px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--accent-lavender)]/10 border border-[var(--accent-lavender)]/20">
            <SparklesIcon className="w-6 h-6 text-[var(--accent-lavender)]" />
          </div>
          <CopyPageButton markdown={PAGE_MARKDOWN} />
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--accent-lavender)]/10 text-[var(--accent-lavender)] border border-[var(--accent-lavender)]/30">
            Skills Registry
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Unicon Skills</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Install Unicon skills in your AI assistant to generate icons and bundles automatically.
          Skills are plain markdown files you can audit, version, and share.
        </p>
      </div>

      <div className="space-y-16">
        <section id="install-with-the-cli">
          <h2 className="text-2xl font-bold mb-4">What is a Skill?</h2>
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground leading-relaxed">
              Unicon skills teach AI assistants how to search, bundle, and generate icons. They are designed
              for tools like Claude Code, Cursor, and Windsurf and can be installed locally for private use
              or shared across teams.
            </p>
          </div>
        </section>

        <section id="direct-downloads">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Available Skills</h2>
            <Link
              href="/skills/index.json"
              className="text-sm text-[var(--accent-aqua)] hover:text-[var(--accent-aqua)]/80 underline"
            >
              Download registry JSON
            </Link>
          </div>
          <div className="grid gap-4">
            {skillEntries.map((skill) => (
              <div
                key={skill.id}
                className="p-5 rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{skill.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      Updated {skill.updatedAt}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-mono rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={skill.publicPath}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background hover:bg-accent transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Install with the CLI</h2>
          <CodeBlock title="Terminal">{`unicon skill --list
unicon skill --ide cursor
unicon skill --ide claude
unicon skill --all`}</CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            Use the CLI to install skills into your assistant&apos;s config folder. Each file is readable and
            versioned so you can review it before enabling.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Direct Downloads</h2>
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              Prefer manual installs? Download the markdown files directly from the registry JSON and
              store them in your assistant&apos;s rules directory.
            </p>
          </div>
        </section>

        {/* Page Navigation */}
        <DocsPageNav {...getDocsNavLinks("/docs/skills")} />
      </div>
    </div>
  );
}
