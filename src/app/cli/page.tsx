import { Metadata } from "next";
import { Package, Terminal, FileCode, FolderSync, Plus, Search, List } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI | Unicon",
  description: "Command-line interface for searching and bundling icons from Unicon",
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
      {title && (
        <div className="px-4 py-2 border-b border-white/10 text-xs font-mono text-white/50">
          {title}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-white/80">
        <code>{children}</code>
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
    <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <code className="text-white font-mono font-medium">{command}</code>
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
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
              <Terminal className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-white/50">
              @webrenew/unicon
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Unicon CLI</h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Search and bundle icons from the command line. Define your icon sets once, 
            regenerate anytime with a single command.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
          <div className="space-y-4">
            <CodeBlock title="Install globally">npm install -g @webrenew/unicon</CodeBlock>
            <p className="text-white/50 text-sm">Or use directly with npx:</p>
            <CodeBlock>npx @webrenew/unicon search "dashboard"</CodeBlock>
          </div>
        </section>

        {/* Commands */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Commands</h2>
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
              icon={Package}
              command="unicon bundle"
              description="Bundle icons into a file. Supports React components, raw SVG, or JSON formats."
              example={`unicon bundle --category Dashboards -o ./icons.tsx
unicon bundle --query "home menu" --format svg
unicon bundle --source phosphor --limit 50`}
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
unicon add files --source lucide --format svg`}
            />

            <CommandCard
              icon={List}
              command="unicon categories"
              description="List all available icon categories."
              example={`unicon categories
unicon categories --json`}
            />
          </div>
        </section>

        {/* Config File */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Config File</h2>
          <p className="text-white/60 mb-6">
            Define your icon bundles in <code className="text-cyan-400">.uniconrc.json</code> and 
            regenerate them anytime with <code className="text-cyan-400">unicon sync</code>.
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
          <h2 className="text-2xl font-bold mb-6">Output Formats</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-cyan-400">react</h3>
              <p className="text-white/50 text-sm mb-3">TypeScript React components with proper typing.</p>
              <code className="text-xs text-white/40">icons.tsx</code>
            </div>
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-emerald-400">svg</h3>
              <p className="text-white/50 text-sm mb-3">Raw SVG markup with comments for each icon.</p>
              <code className="text-xs text-white/40">icons.svg</code>
            </div>
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="font-mono font-medium mb-2 text-purple-400">json</h3>
              <p className="text-white/50 text-sm mb-3">JSON array with icon data and metadata.</p>
              <code className="text-xs text-white/40">icons.json</code>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Icon Sources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <h3 className="font-mono font-medium mb-2 text-orange-400">lucide</h3>
              <p className="text-white/50 text-sm">1,900+ beautiful & consistent icons</p>
            </div>
            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="font-mono font-medium mb-2 text-emerald-400">phosphor</h3>
              <p className="text-white/50 text-sm">1,500+ flexible icons in 6 weights</p>
            </div>
            <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <h3 className="font-mono font-medium mb-2 text-violet-400">hugeicons</h3>
              <p className="text-white/50 text-sm">1,800+ modern outlined icons</p>
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
