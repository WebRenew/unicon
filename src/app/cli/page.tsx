import { Metadata } from "next";
import {
  Package,
  Terminal,
  FileCode,
  FolderSync,
  Plus,
  Search,
  List,
  Info,
  Download,
  Eye,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata: Metadata = {
  title: "CLI | Unicon",
  description: "Command-line interface for searching and bundling icons. Install via npm, search 14,000+ icons, and generate tree-shakeable React, Vue, or Svelte components. Open source icon CLI tool.",
  keywords: [
    "icon cli",
    "command line icons",
    "npm icon tool",
    "icon bundler",
    "react icon cli",
    "vue icon cli",
    "svelte icon cli",
    "tree shaking icons",
    "icon generator",
    "cli tool",
    "developer tools",
    "icon search cli",
    "offline icon tool",
  ],
  alternates: {
    canonical: "/cli",
  },
  openGraph: {
    title: "Unicon CLI — Icon Bundler for Command Line",
    description: "Search and bundle icons from the command line. Generate tree-shakeable components for React, Vue, and Svelte.",
    url: "https://unicon.webrenew.com/cli",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unicon CLI — Icon Bundler for Command Line",
    description: "Search and bundle icons from the command line. Generate tree-shakeable components.",
  },
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-white/10 bg-black/40">
      {title && (
        <div className="px-3 py-2 border-b border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
          <span>{title}</span>
          <CopyButton value={children} />
        </div>
      )}
      {!title && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton value={children} />
        </div>
      )}
      <pre className="p-3 md:p-4 overflow-x-auto text-xs md:text-sm font-mono text-white/80 max-w-full">
        <code className="break-all md:break-normal">{children}</code>
      </pre>
    </div>
  );
}

function CommandCard({
  icon: Icon,
  command,
  description,
  example,
}: {
  icon: React.ElementType;
  command: string;
  description: string;
  example: string;
}) {
  return (
    <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden">
      <div className="flex items-center gap-2 md:gap-3 mb-3">
        <div className="p-1.5 md:p-2 rounded-lg bg-white/5 shrink-0">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <code className="text-white font-mono font-medium text-sm md:text-base break-all">{command}</code>
      </div>
      <p className="text-white/60 text-sm mb-4">{description}</p>
      <CodeBlock>{example}</CodeBlock>
    </div>
  );
}

export default function CLIPage() {
  return (
    <main className="min-h-screen bg-[hsl(0,0%,3%)] text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <div className="flex items-center gap-2 md:gap-3 mb-4 flex-wrap">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
              <Terminal className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-mono bg-white/5 text-white/50">
              @webrenew/unicon
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Unicon CLI</h1>
          <p className="text-base md:text-xl text-white/60 max-w-2xl">
            Search and bundle icons from 8 libraries via command line. Define your icon sets once, 
            regenerate anytime with a single command.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10 md:space-y-16">
        {/* Quick Start */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Quick Start</h2>
          <div className="space-y-4">
            <CodeBlock title="Install globally">npm install -g @webrenew/unicon</CodeBlock>
            <p className="text-white/50 text-sm">Or use directly with npx:</p>
            <CodeBlock>npx @webrenew/unicon search &quot;dashboard&quot;</CodeBlock>
          </div>
        </section>

        {/* Commands */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Commands</h2>
          <div className="grid gap-4">
            <CommandCard
              icon={Search}
              command="unicon search <query>"
              description="Search for icons by name, keyword, or concept. Uses AI-powered semantic search for better results."
              example={`unicon search "settings gear"
unicon search "dashboard" --category Dashboards
unicon search "arrow" --source lucide --limit 10`}
            />

            <CommandCard
              icon={Download}
              command="unicon get <name>"
              description="Get a single icon and output to stdout. Perfect for piping to clipboard or a file."
              example={`unicon get home
unicon get home --format vue
unicon get settings --format svelte -o ./settings.svelte`}
            />

            <CommandCard
              icon={Info}
              command="unicon info <name>"
              description="Show detailed information about an icon including source, category, tags, and viewBox."
              example={`unicon info home
unicon info arrow-right --source phosphor`}
            />

            <CommandCard
              icon={Package}
              command="unicon bundle"
              description="Bundle icons into tree-shakeable components. Creates one file per icon by default for optimal bundling."
              example={`unicon bundle --category Dashboards -o ./icons
unicon bundle --query "home" --format vue -o ./icons
unicon bundle --format svg --single-file -o ./all.svg`}
            />

            <CommandCard
              icon={FileCode}
              command="unicon init"
              description="Initialize a .uniconrc.json config file in your project with example bundle configurations."
              example={`unicon init
unicon init --force  # Overwrite existing`}
            />

            <CommandCard
              icon={FolderSync}
              command="unicon sync"
              description="Generate all bundles defined in your .uniconrc.json config file."
              example={`unicon sync
unicon sync --name dashboard  # Sync specific bundle
unicon sync --dry-run         # Preview changes`}
            />

            <CommandCard
              icon={Plus}
              command="unicon add <name>"
              description="Add a new bundle configuration to your .uniconrc.json file."
              example={`unicon add social --category Social
unicon add nav --query "arrow menu" --limit 30
unicon add files --source lucide --format vue`}
            />

            <CommandCard
              icon={List}
              command="unicon categories"
              description="List all available icon categories."
              example={`unicon categories
unicon categories --json`}
            />

            <CommandCard
              icon={Eye}
              command="unicon preview <name>"
              description="Show ASCII art preview of an icon directly in the terminal."
              example={`unicon preview home
unicon preview star --width 24 --height 24
unicon preview arrow --source phosphor`}
            />

            <CommandCard
              icon={Layers}
              command="unicon sources"
              description="List all 8 available icon libraries with version info and icon counts."
              example={`unicon sources
unicon sources --json`}
            />

            <CommandCard
              icon={Database}
              command="unicon cache"
              description="Manage local cache for offline use. Icons are cached for 24 hours."
              example={`unicon cache --stats  # Show cache info
unicon cache --clear  # Clear all cached data`}
            />
          </div>
        </section>

        {/* Workflow */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Typical Workflow</h2>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono flex items-center justify-center">1</span>
              <div>
                <p className="text-white/80 text-sm font-medium">Initialize config</p>
                <code className="text-xs text-white/50">unicon init</code>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono flex items-center justify-center">2</span>
              <div>
                <p className="text-white/80 text-sm font-medium">Search for icons you need</p>
                <code className="text-xs text-white/50">unicon search &quot;dashboard&quot;</code>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono flex items-center justify-center">3</span>
              <div>
                <p className="text-white/80 text-sm font-medium">Add bundles to your config</p>
                <code className="text-xs text-white/50">unicon add dashboard --category Dashboards</code>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-mono flex items-center justify-center">4</span>
              <div>
                <p className="text-white/80 text-sm font-medium">Generate all bundles</p>
                <code className="text-xs text-white/50">unicon sync</code>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center justify-center">✓</span>
              <div>
                <p className="text-white/80 text-sm font-medium">Import and use</p>
                <code className="text-xs text-white/50">{`import { Home, Settings } from "./icons/dashboard"`}</code>
              </div>
            </div>
          </div>
        </section>

        {/* Config File */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Config File</h2>
          <p className="text-white/60 mb-4 md:mb-6 text-sm md:text-base">
            Define your icon bundles in <code className="text-cyan-400 text-xs md:text-sm">.uniconrc.json</code> and 
            regenerate them anytime with <code className="text-cyan-400 text-xs md:text-sm">unicon sync</code>.
          </p>
          <CodeBlock title=".uniconrc.json">{`{
  "bundles": [
    {
      "name": "dashboard",
      "category": "Dashboards",
      "limit": 50,
      "format": "react",
      "output": "./src/icons/dashboard.tsx"
    },
    {
      "name": "navigation",
      "query": "arrow chevron menu home",
      "limit": 30,
      "format": "react", 
      "output": "./src/icons/navigation.tsx"
    },
    {
      "name": "social",
      "category": "Social",
      "source": "phosphor",
      "format": "svg",
      "output": "./public/icons/social.svg"
    }
  ]
}`}</CodeBlock>
        </section>

        {/* Output Formats */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Output Formats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-cyan-400">react</h3>
              <p className="text-white/50 text-xs md:text-sm mb-2 md:mb-3">TypeScript React components.</p>
              <code className="text-xs text-white/40">.tsx</code>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-green-400">vue</h3>
              <p className="text-white/50 text-xs md:text-sm mb-2 md:mb-3">Vue 3 SFC components.</p>
              <code className="text-xs text-white/40">.vue</code>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-orange-400">svelte</h3>
              <p className="text-white/50 text-xs md:text-sm mb-2 md:mb-3">Svelte components.</p>
              <code className="text-xs text-white/40">.svelte</code>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-emerald-400">svg</h3>
              <p className="text-white/50 text-xs md:text-sm mb-2 md:mb-3">Raw SVG markup.</p>
              <code className="text-xs text-white/40">.svg</code>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-purple-400">json</h3>
              <p className="text-white/50 text-xs md:text-sm mb-2 md:mb-3">Icon data as JSON.</p>
              <code className="text-xs text-white/40">.json</code>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Icon Sources</h2>
          <p className="text-white/60 mb-4 text-sm">
            Access 14,700+ icons from 8 popular icon libraries:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <h3 className="font-mono font-medium mb-1 text-orange-400">lucide</h3>
              <p className="text-white/50 text-xs">1,456 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="font-mono font-medium mb-1 text-emerald-400">phosphor</h3>
              <p className="text-white/50 text-xs">7,488 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <h3 className="font-mono font-medium mb-1 text-violet-400">hugeicons</h3>
              <p className="text-white/50 text-xs">3,000+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <h3 className="font-mono font-medium mb-1 text-blue-400">heroicons</h3>
              <p className="text-white/50 text-xs">292 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <h3 className="font-mono font-medium mb-1 text-cyan-400">tabler</h3>
              <p className="text-white/50 text-xs">3,000+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-500/20 bg-gray-500/5">
              <h3 className="font-mono font-medium mb-1 text-gray-400">feather</h3>
              <p className="text-white/50 text-xs">287 icons</p>
            </div>
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <h3 className="font-mono font-medium mb-1 text-indigo-400">remix</h3>
              <p className="text-white/50 text-xs">2,000+ icons</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-500/5">
              <h3 className="font-mono font-medium mb-1 text-slate-400">simple-icons</h3>
              <p className="text-white/50 text-xs">2,000+ brand logos</p>
            </div>
          </div>
        </section>

        {/* MCP Server */}
        <section>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold">AI Assistant Integration</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">NEW</span>
          </div>
          <div className="p-5 md:p-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Use Unicon with Claude & Cursor</h3>
                <p className="text-white/60 text-sm mb-4">
                  Connect Unicon to AI assistants via Model Context Protocol (MCP). 
                  Search and generate icon components using natural language.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-white/50 text-xs mb-2">Install the MCP server:</p>
                <CodeBlock>npx @webrenew/unicon-mcp-server</CodeBlock>
              </div>

              <div>
                <p className="text-white/50 text-xs mb-2">Add to Claude Desktop config:</p>
                <CodeBlock title="claude_desktop_config.json">{`{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@webrenew/unicon-mcp-server"]
    }
  }
}`}</CodeBlock>
              </div>

              <div className="pt-2">
                <p className="text-white/50 text-xs mb-3">Then ask Claude:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 items-start">
                    <span className="text-purple-400">→</span>
                    <span className="text-white/70">&quot;Search for dashboard icons in Lucide&quot;</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-purple-400">→</span>
                    <span className="text-white/70">&quot;Get the React component for lucide:home&quot;</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-purple-400">→</span>
                    <span className="text-white/70">&quot;Generate Vue components for social media icons&quot;</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex gap-3 text-xs">
                <a 
                  href="https://github.com/WebRenew/unicon/blob/main/docs/mcp-quickstart.md" 
                  className="text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quick Start Guide →
                </a>
                <a 
                  href="https://github.com/WebRenew/unicon/blob/main/docs/mcp-integration.md" 
                  className="text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Full Documentation →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Tree Shaking */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Tree-Shaking</h2>
          <div className="p-4 md:p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-white/80 text-sm mb-4">
              Unlike <code className="text-white/60">npm install lucide-react</code> which downloads thousands of icons,
              the CLI generates <strong>only the icons you need</strong> as individual files.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/60">One component per file = true tree-shaking</span>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/60">No external dependencies to ship</span>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/60">Import only what you use: <code className="text-cyan-400">{`import { Home } from "./icons"`}</code></span>
              </div>
            </div>
          </div>
        </section>

        {/* Caching */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Offline Support</h2>
          <div className="p-4 md:p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-white/60 text-sm mb-4">
              The CLI automatically caches icon data locally at <code className="text-cyan-400">~/.unicon/cache</code> for 
              24 hours. This enables faster subsequent searches and partial offline usage.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-white/5 text-white/50">unicon cache --stats</span>
              <span className="px-2 py-1 rounded bg-white/5 text-white/50">unicon cache --clear</span>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center py-8">
          <p className="text-white/40 mb-4">Ready to bundle some icons?</p>
          <CodeBlock>npx @webrenew/unicon init</CodeBlock>
        </section>
      </div>
    </main>
  );
}
