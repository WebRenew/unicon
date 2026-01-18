import { IconBrowser } from "@/components/icons/icon-browser";
import { sampleIcons } from "@/data/sample-icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-violet-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Unicon</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Icons
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              CLI
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Beautiful icons,{" "}
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              your way
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse icons from Lucide, Phosphor, and Huge Icons. Copy to clipboard, customize styles, or open in v0.
          </p>
        </div>
      </section>

      {/* Icon Browser */}
      <main className="container mx-auto px-6 pb-12">
        <IconBrowser icons={sampleIcons} />
      </main>
    </div>
  );
}
