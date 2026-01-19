import { Metadata } from "next";
import { Package, Terminal, FileCode, FolderSync, Plus, Search, List, Info, Download, Eye, Database } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata: Metadata = {
  title: "CLI | Unicon",
  description: "Command-line interface for searching and bundling icons from Unicon",
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
            Search and bundle icons from the command line. Define your icon sets once, 
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
            <CodeBlock>npx @webrenew/unicon search "dashboard"</CodeBlock>
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
              description="Bundle multiple icons into a file. Supports React, Vue, Svelte, SVG, and JSON formats."
              example={`unicon bundle --category Dashboards -o ./icons.tsx
unicon bundle --query "home" --format vue
unicon bundle --source phosphor --split -o ./icons`}
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
              icon={Database}
              command="unicon cache"
              description="Manage local cache for offline use. Icons are cached for 24 hours."
              example={`unicon cache --stats  # Show cache info
unicon cache --clear  # Clear all cached data`}
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="p-4 md:p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <h3 className="font-mono font-medium mb-2 text-orange-400">lucide</h3>
              <p className="text-white/50 text-xs md:text-sm">1,900+ beautiful & consistent icons</p>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="font-mono font-medium mb-2 text-emerald-400">phosphor</h3>
              <p className="text-white/50 text-xs md:text-sm">1,500+ flexible icons in 6 weights</p>
            </div>
            <div className="p-4 md:p-5 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <h3 className="font-mono font-medium mb-2 text-violet-400">hugeicons</h3>
              <p className="text-white/50 text-xs md:text-sm">1,800+ modern outlined icons</p>
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
