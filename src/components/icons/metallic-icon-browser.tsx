"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Github, Loader2, ChevronLeft, ChevronRight, Package, Sparkles } from "lucide-react";
import { StyledIcon } from "./styled-icon";
import { IconCart } from "./icon-cart";
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

const ICONS_PER_PAGE = 160;

export function MetallicIconBrowser({
  initialIcons,
  totalCount,
  countBySource,
}: MetallicIconBrowserProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");
  const [icons, setIcons] = useState<IconData[]>(initialIcons.slice(0, ICONS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<string>("text");
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<IconData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemIds = new Set(cartItems.map((item) => item.id));

  const totalPages = Math.ceil(totalResults / ICONS_PER_PAGE);

  const toggleCartItem = useCallback((icon: IconData) => {
    setCartItems((prev) => {
      const exists = prev.some((item) => item.id === icon.id);
      if (exists) {
        return prev.filter((item) => item.id !== icon.id);
      }
      return [...prev, icon];
    });
  }, []);

  const removeCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch icons when search, source, or page changes
  const fetchIcons = useCallback(
    async (pageNum: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(ICONS_PER_PAGE),
          offset: String(pageNum * ICONS_PER_PAGE),
        });
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (selectedSource !== "all") params.set("source", selectedSource);

        const res = await fetch(`/api/icons?${params}`);
        const data = await res.json();

        setIcons(data.icons);
        setSearchType(data.searchType ?? "text");
        setExpandedQuery(data.expandedQuery ?? null);
        // Estimate total based on hasMore
        if (!data.hasMore && data.icons.length < ICONS_PER_PAGE) {
          setTotalResults(pageNum * ICONS_PER_PAGE + data.icons.length);
        }
      } catch (error) {
        console.error("Failed to fetch icons:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, selectedSource]
  );

  // Refetch when filters change - reset to page 0
  useEffect(() => {
    setPage(0);
    fetchIcons(0);
  }, [debouncedSearch, selectedSource, fetchIcons]);

  // Fetch when page changes
  useEffect(() => {
    if (page > 0) {
      fetchIcons(page);
    }
  }, [page, fetchIcons]);

  const goToPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-mono"
          >
            <Package className="w-4 h-4" />
            Bundle
            {cartItems.length > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-emerald-500 text-white text-xs rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
          <a
            href="https://github.com/WebRenew/unicon"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
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
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Try 'business icons' or 'celebration' — AI understands intent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && search && (
            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
          )}
          {!isLoading && search && searchType === "semantic" && (
            <span title="AI-powered search">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </span>
          )}
        </div>
      </div>
      
      {/* AI Search Feedback */}
      {expandedQuery && debouncedSearch && (
        <div className="mb-6 flex items-start gap-2 text-xs text-white/40">
          <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
          <span>
            AI expanded to: <span className="text-white/60">{expandedQuery}</span>
          </span>
        </div>
      )}

      {/* Source filters */}
      <div className="flex flex-wrap gap-2 mb-8">
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
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs">
          Page {page + 1} of {totalPages} • {totalResults.toLocaleString()} icons
          {isLoading && <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />}
        </p>
      </div>

      {/* Icon Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : icons.length > 0 ? (
        <>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-3">
            {icons.map((icon) => (
              <StyledIcon
                key={icon.id}
                icon={icon}
                style="metal"
                isSelected={cartItemIds.has(icon.id)}
                onToggleCart={toggleCartItem}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 text-sm font-mono rounded-lg transition-colors ${
                      pageNum === page
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-lg font-medium text-white/60">No icons found</h3>
          <p className="text-sm text-white/40 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Cart Drawer */}
      <IconCart
        items={cartItems}
        onRemove={removeCartItem}
        onClear={clearCart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsCartOpen(false)}
        />
      )}
    </div>
  );
}
