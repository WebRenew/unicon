"use client";

import { useEffect, useState, useCallback } from "react";
import { SearchIcon } from "@/components/icons/ui/search";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { ChevronLeftIcon } from "@/components/icons/ui/chevron-left";
import { ChevronRightIcon } from "@/components/icons/ui/chevron-right";
import { SparklesIcon } from "@/components/icons/ui/sparkles";
import { SlidersHorizontalIcon } from "@/components/icons/ui/sliders-horizontal";
import { FilterIcon } from "@/components/icons/ui/filter";
import { CheckIcon } from "@/components/icons/ui/check";
import { ChevronsUpDownIcon } from "@/components/icons/ui/chevrons-up-down";
import { PackagePlusIcon } from "@/components/icons/ui/package-plus";
import { AlertTriangleIcon } from "@/components/icons/ui/alert-triangle";
import { Trash2Icon } from "@/components/icons/ui/trash-2";
import { toast } from "sonner";
import { StyledIcon, STROKE_PRESETS, SIZE_PRESETS, type StrokePreset, type SizePreset } from "./styled-icon";
import { IconCart } from "./icon-cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { IconData, IconLibrary } from "@/types/icon";

/** Convert string to Title Case */
function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface MetallicIconBrowserProps {
  initialIcons: IconData[];
  totalCount: number;
  countBySource: Record<string, number>;
  categories: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  lucide: "bg-orange-500",
  phosphor: "bg-emerald-500",
  hugeicons: "bg-violet-500",
  heroicons: "bg-blue-500",
  tabler: "bg-cyan-500",
  feather: "bg-pink-500",
  remix: "bg-red-500",
  "simple-icons": "bg-gray-500",
};

// Icons per page - sized for large screens (4K: ~50 columns × 8 rows = 400)
const ICONS_PER_PAGE = 320;

export function MetallicIconBrowser({
  initialIcons,
  totalCount,
  countBySource,
  categories,
}: MetallicIconBrowserProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [icons, setIcons] = useState<IconData[]>(initialIcons.slice(0, ICONS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<string>("text");
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  // Display presets - persisted to localStorage
  const [strokePreset, setStrokePreset] = useState<StrokePreset>("regular");
  const [sizePreset, setSizePreset] = useState<SizePreset>("m");
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const strokeWeight = STROKE_PRESETS[strokePreset].value;
  const { icon: iconSize, container: containerSize } = SIZE_PRESETS[sizePreset];

  // Estimate columns based on viewport width
  // Use null initially to show all icons during SSR, then calculate on client
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    // Set initial width on mount
    setViewportWidth(window.innerWidth);

    const handleResize = () => setViewportWidth(window.innerWidth);
    const handleOpenCart = () => setIsCartOpen(true);

    window.addEventListener('resize', handleResize);
    window.addEventListener('openCart', handleOpenCart);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('openCart', handleOpenCart);
    };
  }, []);

  // Calculate columns based on viewport and known page padding
  const estimatedColumns = (() => {
    if (viewportWidth === null) return 10; // SSR fallback

    // Match the page padding: p-4 lg:px-20 xl:px-40
    let padding = 16 * 2; // p-4 = 1rem = 16px each side
    if (viewportWidth >= 1280) padding = 160 * 2; // xl:px-40 = 10rem = 160px
    else if (viewportWidth >= 1024) padding = 80 * 2; // lg:px-20 = 5rem = 80px

    const containerWidth = viewportWidth - padding;
    const gap = 12; // gap-3
    return Math.max(4, Math.floor((containerWidth + gap) / (containerSize + gap)));
  })();

  // During SSR/initial render (viewportWidth is null), show all icons
  // Otherwise, trim to complete rows
  const iconsToShow = (() => {
    if (viewportWidth === null) {
      // SSR or before hydration - show all icons, CSS will handle layout
      return icons;
    }

    // Trim to complete rows
    const completeRows = Math.floor(icons.length / estimatedColumns);
    return completeRows > 0
      ? icons.slice(0, completeRows * estimatedColumns)
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
      // Notify header of cart changes
      window.dispatchEvent(new Event("cartUpdate"));
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

  // Confirmation dialog for large bundles
  const [confirmBundleOpen, setConfirmBundleOpen] = useState(false);
  const [pendingBundleIcons, setPendingBundleIcons] = useState<IconData[]>([]);

  // Add multiple icons to bundle (skip duplicates)
  const performAddToBundle = useCallback((iconsToAdd: IconData[]) => {
    setCartItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newIcons = iconsToAdd.filter((icon) => !existingIds.has(icon.id));
      if (newIcons.length === 0) {
        toast.info("All icons already in bundle");
        return prev;
      }
      toast.success(`Added ${newIcons.length} icon${newIcons.length > 1 ? "s" : ""} to bundle`);
      return [...prev, ...newIcons];
    });
  }, []);

  // Show confirmation for large bundles (>50 icons)
  const addAllToBundle = useCallback((iconsToAdd: IconData[]) => {
    const existingIds = new Set(cartItems.map((item) => item.id));
    const newIcons = iconsToAdd.filter((icon) => !existingIds.has(icon.id));

    if (newIcons.length === 0) {
      toast.info("All icons already in bundle");
      return;
    }

    if (newIcons.length > 50) {
      setPendingBundleIcons(newIcons);
      setConfirmBundleOpen(true);
    } else {
      performAddToBundle(iconsToAdd);
    }
  }, [cartItems, performAddToBundle]);

  // Check if any filters are active
  const hasActiveFilters = selectedSource !== "all" || selectedCategory !== "all" || debouncedSearch.length > 0;

  // Count icons not yet in bundle from current view
  const iconsNotInBundle = icons.filter((icon) => !cartItemIds.has(icon.id));
  const canBundleAll = hasActiveFilters && iconsNotInBundle.length > 0;

  const removeCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Add icons by name (for starter packs)
  const addIconsByName = useCallback(async (iconNames: string[]) => {
    try {
      // Fetch icons by exact name match using the names parameter
      const params = new URLSearchParams({
        names: iconNames.join(","),
      });
      const res = await fetch(`/api/icons?${params}`);
      if (!res.ok) throw new Error("Failed to fetch icons");

      const data = await res.json();
      const fetchedIcons: IconData[] = data.icons || [];

      if (fetchedIcons.length > 0) {
        performAddToBundle(fetchedIcons);
        toast.success(`Added ${fetchedIcons.length} icons to bundle`);
      } else {
        toast.error("No icons found for this pack");
      }
    } catch (error) {
      console.error("Failed to add starter pack:", error);
      toast.error("Failed to add starter pack");
    }
  }, [performAddToBundle]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch icons when search, source, category, or page changes
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
        if (selectedCategory !== "all") params.set("category", selectedCategory);

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
    [debouncedSearch, selectedSource, selectedCategory]
  );

  // Refetch when filters change - reset to page 0
  useEffect(() => {
    setPage(0);
    fetchIcons(0);
  }, [fetchIcons]);

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
    <div className="min-h-screen bg-white dark:bg-[hsl(0,0%,3%)] lg:pt-14 transition-colors">
      <div className="p-4 lg:px-20 xl:px-40 lg:pt-6 lg:pb-40">

        <h1 className="font-sans font-semibold text-3xl md:text-4xl lg:text-5xl text-black dark:text-white mb-4 text-balance tracking-tighter leading-tight">
          Just the icons you need. Zero bloat.
        </h1>
        <p className="text-black/50 dark:text-white/50 text-sm md:text-base max-w-xl mb-4">
          Pick icons from popular libraries, preview styles, copy the code. Like shadcn, but for
          icons.
        </p>

        {/* Stats */}
        <div className="hidden md:flex gap-4 text-xs mb-8">
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
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
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
              <Loader2Icon className="w-4 h-4 text-black/40 dark:text-white/40 animate-spin" />
            )}
            {!isLoading && search && searchType === "semantic" && (
              <span title="AI-powered search" aria-hidden="true">
                <SparklesIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </span>
            )}
          </div>
        </div>

        {/* AI Search Feedback */}
        {expandedQuery && debouncedSearch && (
          <div className="mb-6 flex items-start gap-2 text-xs text-black/40 dark:text-white/40">
            <SparklesIcon className="w-3 h-3 text-purple-500 dark:text-purple-400 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              AI expanded to: <span className="text-black/60 dark:text-white/60">{expandedQuery}</span>
            </span>
          </div>
        )}

        {/* Filters & Controls */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Row 1: Filters (collapsible) */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filters toggle button */}
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                <FilterIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  Filters
                </span>
                <svg
                  className={`w-3 h-3 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {/* Show active filter count */}
                {(selectedSource !== "all" || selectedCategory !== "all") && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-black/10 dark:bg-white/10 rounded">
                    {(selectedSource !== "all" ? 1 : 0) + (selectedCategory !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Filters content - visible when expanded */}
              {filtersExpanded && (
                <>
                  {/* Library */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-black/30 dark:text-white/30 uppercase tracking-wider">
                      Library
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "lucide", "phosphor", "hugeicons", "heroicons", "tabler", "feather", "remix", "simple-icons"] as const).map((source) => (
                        <button
                          key={source}
                          onClick={() => setSelectedSource(source)}
                          className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all ${selectedSource === source
                            ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                            : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
                            }`}
                        >
                          {source === "all" ? "All" : source}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10" />

                  {/* Category Combobox */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-black/30 dark:text-white/30 uppercase tracking-wider">
                      Category
                    </span>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <button
                          role="combobox"
                          aria-expanded={categoryOpen}
                          aria-controls="category-listbox"
                          className="flex h-7 items-center justify-between gap-2 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 text-xs font-mono text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[140px]"
                        >
                          {selectedCategory === "all"
                            ? "All Categories"
                            : toTitleCase(selectedCategory)}
                          <ChevronsUpDownIcon className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search categories..." className="text-xs" />
                          <CommandList id="category-listbox">
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setSelectedCategory("all");
                                  setCategoryOpen(false);
                                }}
                                className="text-xs font-mono"
                              >
                                <CheckIcon
                                  className={`mr-2 h-3 w-3 ${selectedCategory === "all" ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                All Categories
                              </CommandItem>
                              {categories.map((cat) => (
                                <CommandItem
                                  key={cat}
                                  value={cat}
                                  onSelect={() => {
                                    setSelectedCategory(cat);
                                    setCategoryOpen(false);
                                  }}
                                  className="text-xs font-mono"
                                >
                                  <CheckIcon
                                    className={`mr-2 h-3 w-3 ${selectedCategory === cat ? "opacity-100" : "opacity-0"
                                      }`}
                                  />
                                  {toTitleCase(cat)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Bundle All Button - visible when filters active */}
                  {canBundleAll && (
                    <>
                      <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10" />
                      <button
                        onClick={() => {
                          addAllToBundle(icons);
                          setIsCartOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--accent-mint)]/10 dark:bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 dark:hover:bg-[var(--accent-mint)]/30 border border-[var(--accent-mint)]/20 dark:border-[var(--accent-mint)]/30 transition-all"
                      >
                        <PackagePlusIcon className="w-3.5 h-3.5" />
                        Bundle All ({iconsNotInBundle.length})
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Clear Bundle Button - visible when bundle has items and filters expanded - positioned on the right */}
            {filtersExpanded && cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all"
              >
                <Trash2Icon className="w-3.5 h-3.5" />
                Clear Bundle ({cartItems.length})
              </button>
            )}
          </div>

          {/* Actions when panel collapsed */}
          {!filtersExpanded && (canBundleAll || cartItems.length > 0) && (
            <div className="flex items-center justify-between gap-3 -mt-2 mb-2">
              {/* Bundle All action - visible when filters active */}
              {canBundleAll && (
                <button
                  onClick={() => {
                    addAllToBundle(icons);
                    setIsCartOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--accent-mint)]/10 dark:bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 dark:hover:bg-[var(--accent-mint)]/30 border border-[var(--accent-mint)]/20 dark:border-[var(--accent-mint)]/30 transition-all"
                >
                  <PackagePlusIcon className="w-3.5 h-3.5" />
                  Bundle All {icons.length} Filtered Icons
                  {iconsNotInBundle.length < icons.length && (
                    <span className="text-[var(--accent-mint)]/70">
                      (+{iconsNotInBundle.length} new)
                    </span>
                  )}
                </button>
              )}

              {/* Clear Bundle action - positioned on the right */}
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all ml-auto"
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                  Clear Bundle ({cartItems.length} icons)
                </button>
              )}
            </div>
          )}

          {/* Row 2: Display Controls (collapsible) */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
            {/* Controls toggle button */}
            <button
              onClick={() => setControlsExpanded(!controlsExpanded)}
              className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
            >
              <SlidersHorizontalIcon className={`w-3.5 h-3.5 transition-transform ${controlsExpanded ? 'rotate-90' : ''}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider">
                Controls
              </span>
              <svg
                className={`w-3 h-3 transition-transform ${controlsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Controls content - visible when expanded */}
            {controlsExpanded && (
              <>
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
                        className={`relative px-2.5 py-1.5 text-xs font-mono transition-all ${sizePreset === preset
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
                        className={`relative px-3 py-1.5 text-xs font-mono transition-all ${strokePreset === preset
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
                            className="opacity-70 hidden sm:block"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          {STROKE_PRESETS[preset].label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-black/40 dark:text-white/40 text-xs">
            Page {page + 1} of {totalPages} • {totalResults.toLocaleString()} icons
            {isLoading && <Loader2Icon className="inline ml-2 w-3 h-3 animate-spin" />}
          </p>
        </div>

        {/* Icon Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="w-8 h-8 text-black/40 dark:text-white/40 animate-spin" />
          </div>
        ) : icons.length > 0 ? (
          <>
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)`,
                justifyContent: 'start',
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
                <ChevronLeftIcon className="w-4 h-4" />
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
                      className={`w-9 h-9 text-sm font-mono rounded-lg transition-colors ${pageNum === page
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
                <ChevronRightIcon className="w-4 h-4" />
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
          onAddPack={addIconsByName}
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

        {/* Confirmation Dialog for Large Bundles */}
        <Dialog open={confirmBundleOpen} onOpenChange={setConfirmBundleOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
                Add {pendingBundleIcons.length} Icons?
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                You&apos;re about to add a large number of icons to your bundle.
                This may increase your bundle size significantly.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <button
                onClick={() => setConfirmBundleOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  performAddToBundle(pendingBundleIcons);
                  setConfirmBundleOpen(false);
                  setPendingBundleIcons([]);
                  setIsCartOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-mint)] text-black hover:bg-[var(--accent-mint)]/80 transition-colors"
              >
                Add All {pendingBundleIcons.length} Icons
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer with trademark disclaimer */}
      </div>
    </div>
  );
}
