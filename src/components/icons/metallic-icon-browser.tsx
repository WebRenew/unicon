"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Github, Loader2, ChevronLeft, ChevronRight, Package, Sparkles, SlidersHorizontal } from "lucide-react";
import { StyledIcon, STROKE_PRESETS, SIZE_PRESETS, type StrokePreset, type SizePreset } from "./styled-icon";
import { IconCart } from "./icon-cart";
import { ThemeToggle } from "@/components/theme-toggle";
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
  
  // Display presets - persisted to localStorage
  const [strokePreset, setStrokePreset] = useState<StrokePreset>("regular");
  const [sizePreset, setSizePreset] = useState<SizePreset>("m");
  const strokeWeight = STROKE_PRESETS[strokePreset].value;
  const { icon: iconSize, container: containerSize } = SIZE_PRESETS[sizePreset];

  // Estimate columns based on viewport width
  // Use null initially to show all icons during SSR, then calculate on client
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  
  useEffect(() => {
    // Set initial width on mount
    setViewportWidth(window.innerWidth);
    
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate columns based on viewport and known page padding
  // During SSR/initial render (viewportWidth is null), show all icons
  const iconsToShow = (() => {
    if (viewportWidth === null) {
      // SSR or before hydration - show all icons, CSS will handle layout
      return icons;
    }
    
    // Match the page padding: p-4 lg:px-20 xl:px-40
    let padding = 16 * 2; // p-4 = 1rem = 16px each side
    if (viewportWidth >= 1280) padding = 160 * 2; // xl:px-40 = 10rem = 160px
    else if (viewportWidth >= 1024) padding = 80 * 2; // lg:px-20 = 5rem = 80px
    
    const containerWidth = viewportWidth - padding;
    const gap = 12; // gap-3
    const estimatedColumns = Math.max(4, Math.floor((containerWidth + gap) / (containerSize + gap)));
    
    // Trim icons to complete rows
    const completeRowCount = Math.floor(icons.length / estimatedColumns);
    return completeRowCount > 0 
      ? icons.slice(0, completeRowCount * estimatedColumns)
      : icons;
  })();

  
  // Cart state - persisted to localStorage
  const [cartItems, setCartItems] = useState<IconData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemIds = new Set(cartItems.map((item) => item.id));

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      // Load cart
      const savedCart = localStorage.getItem("unicon-bundle");
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as IconData[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        }
      }
      // Load stroke preset
      const savedStroke = localStorage.getItem("unicon-stroke-preset");
      if (savedStroke && savedStroke in STROKE_PRESETS) {
        setStrokePreset(savedStroke as StrokePreset);
      }
      // Load size preset
      const savedSize = localStorage.getItem("unicon-size-preset");
      if (savedSize && savedSize in SIZE_PRESETS) {
        setSizePreset(savedSize as SizePreset);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem("unicon-bundle", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("unicon-bundle");
      }
    } catch (error) {
      console.error("Failed to save bundle to localStorage:", error);
    }
  }, [cartItems]);

  // Save display presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("unicon-stroke-preset", strokePreset);
    } catch (error) {
      console.error("Failed to save stroke preset to localStorage:", error);
    }
  }, [strokePreset]);

  useEffect(() => {
    try {
      localStorage.setItem("unicon-size-preset", sizePreset);
    } catch (error) {
      console.error("Failed to save size preset to localStorage:", error);
    }
  }, [sizePreset]);

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
    <div className="min-h-screen bg-white dark:bg-[hsl(0,0%,3%)] p-4 lg:px-20 xl:px-40 lg:pt-20 lg:pb-40 transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🦄</span>
          <span className="font-mono text-black/60 dark:text-white/60 text-xs tracking-widest uppercase">
            UNICON
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm font-mono"
          >
            <Package className="w-4 h-4" />
            Bundle
            {cartItems.length > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-emerald-500 text-white text-xs rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
          <ThemeToggle />
          <a
            href="https://github.com/WebRenew/unicon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <h1 className="font-mono font-thin text-3xl md:text-4xl lg:text-5xl text-black dark:text-white mb-4 text-balance tracking-tighter leading-tight">
        Just the icons you need. Zero bloat.
      </h1>
      <p className="text-black/50 dark:text-white/50 text-sm md:text-base max-w-xl mb-4">
        Pick icons from popular libraries, preview styles, copy the code. Like shadcn, but for
        icons.
      </p>

      {/* Stats */}
      <div className="flex gap-4 text-xs mb-8">
        {Object.entries(countBySource).map(([source, count]) => (
          <div key={source} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${SOURCE_COLORS[source]}`} />
            <span className="text-black/40 dark:text-white/40 capitalize">
              {source}: {count?.toLocaleString()}
            </span>
          </div>
        ))}
        <span className="text-black/60 dark:text-white/60">• {totalCount.toLocaleString()} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
        <label htmlFor="icon-search-main" className="sr-only">Search icons</label>
        <input
          id="icon-search-main"
          type="text"
          placeholder="Try 'business icons' or 'celebration'…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-black/[0.07] dark:focus:bg-white/[0.07] transition-colors"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && search && (
            <Loader2 className="w-4 h-4 text-black/40 dark:text-white/40 animate-spin" />
          )}
          {!isLoading && search && searchType === "semantic" && (
            <span title="AI-powered search" aria-hidden="true">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            </span>
          )}
        </div>
      </div>

      {/* AI Search Feedback */}
      {expandedQuery && debouncedSearch && (
        <div className="mb-6 flex items-start gap-2 text-xs text-black/40 dark:text-white/40">
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            AI expanded to: <span className="text-black/60 dark:text-white/60">{expandedQuery}</span>
          </span>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Row 1: Library Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-wider">
            Library
          </span>
          <div className="flex flex-wrap gap-2">
            {(["all", "lucide", "phosphor", "hugeicons"] as const).map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                  selectedSource === source
                    ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                    : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
                }`}
              >
                {source === "all" ? "All" : source}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Display Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-black/40 dark:text-white/40">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Controls
            </span>
          </div>

          {/* Size Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-black/30 dark:text-white/30 uppercase tracking-wider">
              Size
            </span>
            <div className="flex rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
              {(Object.keys(SIZE_PRESETS) as SizePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSizePreset(preset)}
                  title={SIZE_PRESETS[preset].px}
                  className={`relative px-2.5 py-1.5 text-xs font-mono transition-all ${
                    sizePreset === preset
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {SIZE_PRESETS[preset].label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-black/30 dark:text-white/30">
              {SIZE_PRESETS[sizePreset].px}
            </span>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10" />

          {/* Stroke Weight Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-black/30 dark:text-white/30 uppercase tracking-wider">
              Weight
            </span>
            <div className="flex rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
              {(Object.keys(STROKE_PRESETS) as StrokePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setStrokePreset(preset)}
                  className={`relative px-3 py-1.5 text-xs font-mono transition-all ${
                    strokePreset === preset
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {/* Visual stroke indicator */}
                  <span className="flex items-center gap-1.5">
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={STROKE_PRESETS[preset].value * 1.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-70"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">{STROKE_PRESETS[preset].label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-black/40 dark:text-white/40 text-xs">
          Page {page + 1} of {totalPages} • {totalResults.toLocaleString()} icons
          {isLoading && <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />}
        </p>
      </div>

      {/* Icon Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-black/40 dark:text-white/40 animate-spin" />
        </div>
      ) : icons.length > 0 ? (
        <>
          <div 
            className="grid gap-3"
            style={{ 
              gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)`,
              justifyContent: 'center',
            }}
          >
            {iconsToShow.map((icon) => (
              <StyledIcon
                key={icon.id}
                icon={icon}
                style="metal"
                isSelected={cartItemIds.has(icon.id)}
                onToggleCart={toggleCartItem}
                strokeWeight={strokeWeight}
                iconSize={iconSize}
                containerSize={containerSize}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              aria-label="Go to previous page"
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    aria-label={`Go to page ${pageNum + 1}`}
                    aria-current={pageNum === page ? "page" : undefined}
                    className={`w-9 h-9 text-sm font-mono rounded-lg transition-colors ${
                      pageNum === page
                        ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                        : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
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
              aria-label="Go to next page"
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-lg font-medium text-black/60 dark:text-white/60">No icons found</h3>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">Try adjusting your search or filters</p>
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
        <button
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsCartOpen(false)}
          aria-label="Close bundle drawer"
        />
      )}
    </div>
  );
}
