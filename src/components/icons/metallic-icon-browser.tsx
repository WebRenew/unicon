"use client";

import Lenis from "lenis";
import { useEffect, useState, useMemo } from "react";
import { Search, Github, Copy, Check, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StyledIcon, ICON_STYLES, type IconStyle } from "./styled-icon";
import { useIconSearch } from "@/hooks/use-icon-search";
import type { IconData, IconLibrary } from "@/types/icon";

interface MetallicIconBrowserProps {
  initialIcons: IconData[];
  totalCount: number;
  countBySource: Record<string, number>;
}

const SOURCE_COLORS: Record<string, string> = {
  lucide: "bg-orange-500",
  phosphor: "bg-emerald-500",
  hugeicons: "bg-violet-500",
};

export function MetallicIconBrowser({
  initialIcons,
  totalCount,
  countBySource,
}: MetallicIconBrowserProps) {
  const [activeStyle, setActiveStyle] = useState<IconStyle>("metal");
  const [styleCopied, setStyleCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");

  const { icons, isSearching, searchType } = useIconSearch({ initialIcons });

  // Filter icons based on search and source
  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesSearch =
        search === "" ||
        icon.normalizedName.toLowerCase().includes(search.toLowerCase()) ||
        icon.name.toLowerCase().includes(search.toLowerCase()) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesSource = selectedSource === "all" || icon.sourceId === selectedSource;

      return matchesSearch && matchesSource;
    });
  }, [icons, search, selectedSource]);

  const handleCopyStyle = async () => {
    await navigator.clipboard.writeText(ICON_STYLES[activeStyle].css);
    setStyleCopied(true);
    setTimeout(() => setStyleCopied(false), 2000);
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,3%)] p-4 lg:px-20 xl:px-40 lg:pt-20 lg:pb-40">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦄</span>
          <span className="font-mono text-white/60 text-xs tracking-widest uppercase">
            UNICON
          </span>
        </div>
        <a
          href="https://github.com/WebRenew/unicon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
      </header>

      {/* Hero */}
      <h1 className="font-mono font-thin text-3xl md:text-4xl lg:text-5xl text-white mb-4 text-balance tracking-tighter leading-tight">
        Just the icons you need. Zero bloat.
      </h1>
      <p className="text-white/50 text-sm md:text-base max-w-xl mb-4">
        Pick icons from popular libraries, preview styles, copy the code. Like shadcn, but for
        icons.
      </p>

      {/* Stats */}
      <div className="flex gap-4 text-xs mb-8">
        {Object.entries(countBySource).map(([source, count]) => (
          <div key={source} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${SOURCE_COLORS[source]}`} />
            <span className="text-white/40 capitalize">
              {source}: {count?.toLocaleString()}
            </span>
          </div>
        ))}
        <span className="text-white/60">• {totalCount.toLocaleString()} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search icons... (try 'celebration' or 'navigation')"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
        />
        {isSearching && (
          <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
        )}
      </div>

      {/* Source filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "lucide", "phosphor", "hugeicons"] as const).map((source) => (
          <button
            key={source}
            onClick={() => setSelectedSource(source)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
              selectedSource === source
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {source === "all" ? "All" : source}
          </button>
        ))}
        {search.length >= 3 && (
          <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
            {searchType === "semantic" ? "🧠 AI Search" : "📝 Text Search"}
          </Badge>
        )}
      </div>

      {/* Style tabs and copy button */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <Tabs value={activeStyle} onValueChange={(v) => setActiveStyle(v as IconStyle)}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger
              value="metal"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Metal
            </TabsTrigger>
            <TabsTrigger
              value="brutal"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Brutal
            </TabsTrigger>
            <TabsTrigger
              value="glow"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 font-mono"
            >
              Glow
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <button
          onClick={handleCopyStyle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 text-sm font-mono transition-colors duration-200 border border-white/20 hover:border-white/30"
        >
          {styleCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {styleCopied ? "Copied!" : "Copy Style"}
        </button>
      </div>

      {/* Results count */}
      <p className="text-white/40 text-xs mb-4">
        {filteredIcons.length === icons.length
          ? `${icons.length.toLocaleString()} icons`
          : `${filteredIcons.length.toLocaleString()} of ${icons.length.toLocaleString()} icons`}
      </p>

      {/* Icon Grid */}
      {filteredIcons.length > 0 ? (
        <div className="flex flex-wrap gap-4 justify-start">
          {filteredIcons.map((icon) => (
            <StyledIcon key={icon.id} icon={icon} style={activeStyle} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-lg font-medium text-white/60">No icons found</h3>
          <p className="text-sm text-white/40 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
