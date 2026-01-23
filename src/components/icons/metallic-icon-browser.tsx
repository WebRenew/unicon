"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { iconSearchCache } from "@/lib/search-cache";
import { useEventListener } from "@/lib/use-event-listener";
import { toast } from "sonner";
import { SIZE_PRESETS, STROKE_PRESETS, type SizePreset, type StrokePreset } from "./styled-icon";
import { MetallicIconBrowserHeader } from "./metallic-icon-browser-header";
import { MetallicIconBrowserResults } from "./metallic-icon-browser-results";
import { MetallicIconBrowserCartLayer } from "./metallic-icon-browser-cart-layer";
import type { IconData, IconLibrary } from "@/types/icon";

interface MetallicIconBrowserProps {
  initialIcons: IconData[];
  totalCount: number;
  countBySource: Record<string, number>;
  categories: string[];
}


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

  const handleResize = useCallback(() => {
    setViewportWidth(window.innerWidth);
  }, []);

  const handleOpenCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  useEffect(() => {
    setViewportWidth(window.innerWidth);
  }, []);

  useEventListener("resize", handleResize);
  useEventListener("openCart", handleOpenCart);

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
      logger.error("Failed to load settings from localStorage:", error);
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
      logger.error("Failed to save bundle to localStorage:", error);
    }
  }, [cartItems]);

  // Save display presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("unicon-stroke-preset", strokePreset);
    } catch (error) {
      logger.error("Failed to save stroke preset to localStorage:", error);
    }
  }, [strokePreset]);

  useEffect(() => {
    try {
      localStorage.setItem("unicon-size-preset", sizePreset);
    } catch (error) {
      logger.error("Failed to save size preset to localStorage:", error);
    }
  }, [sizePreset]);

  const totalPages = Math.ceil(totalResults / ICONS_PER_PAGE);

  // Memoize grid style object to prevent re-renders
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)`,
    justifyContent: 'start' as const,
  }), [containerSize]);

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

  const handleBundleAll = useCallback(() => {
    addAllToBundle(icons);
    setIsCartOpen(true);
  }, [addAllToBundle, icons]);

  const handleConfirmBundleAdd = useCallback(() => {
    performAddToBundle(pendingBundleIcons);
    setConfirmBundleOpen(false);
    setPendingBundleIcons([]);
    setIsCartOpen(true);
  }, [pendingBundleIcons, performAddToBundle]);

  // Check if any filters are active
  const hasActiveFilters = selectedSource !== "all" || selectedCategory !== "all" || debouncedSearch.length > 0;
  const hasDebouncedSearch = debouncedSearch.length > 0;

  // Count icons not yet in bundle from current view
  const iconsNotInBundleCount = icons.filter((icon) => !cartItemIds.has(icon.id)).length;
  const canBundleAll = hasActiveFilters && iconsNotInBundleCount > 0;

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
      } else {
        toast.error("No icons found for this pack");
      }
    } catch (error) {
      logger.error("Failed to add starter pack:", error);
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
        const cacheKey = {
          q: debouncedSearch || '',
          source: selectedSource,
          category: selectedCategory,
          limit: ICONS_PER_PAGE,
          offset: pageNum * ICONS_PER_PAGE,
        };

        // Check cache first
        const cached = iconSearchCache.get(cacheKey);
        if (cached) {
          setIcons(cached.icons);
          setSearchType(cached.searchType ?? "text");
          setExpandedQuery(cached.expandedQuery ?? null);
          if (!cached.hasMore && cached.icons.length < ICONS_PER_PAGE) {
            setTotalResults(pageNum * ICONS_PER_PAGE + cached.icons.length);
          }
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams({
          limit: String(ICONS_PER_PAGE),
          offset: String(pageNum * ICONS_PER_PAGE),
        });
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (selectedSource !== "all") params.set("source", selectedSource);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const res = await fetch(`/api/icons?${params}`);
        const data = await res.json();

        // Cache the result
        iconSearchCache.set(cacheKey, {
          icons: data.icons,
          searchType: data.searchType,
          expandedQuery: data.expandedQuery,
          hasMore: data.hasMore,
        });

        setIcons(data.icons);
        setSearchType(data.searchType ?? "text");
        setExpandedQuery(data.expandedQuery ?? null);
        // Estimate total based on hasMore
        if (!data.hasMore && data.icons.length < ICONS_PER_PAGE) {
          setTotalResults(pageNum * ICONS_PER_PAGE + data.icons.length);
        }
      } catch (error) {
        logger.error("Failed to fetch icons:", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSource, selectedCategory]);

  // Fetch when page changes (but not when filters change, since that's handled above)
  useEffect(() => {
    if (page > 0) {
      fetchIcons(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const goToPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(0,0%,3%)] lg:pt-14 transition-colors">
      <style jsx global>{`
        ::selection {
          background-color: var(--accent-aqua);
          color: black;
        }

        @property --gradient-stop {
          syntax: '<percentage>';
          initial-value: 8%;
          inherits: false;
        }

        @property --gradient-opacity {
          syntax: '<number>';
          initial-value: 1;
          inherits: false;
        }

        .search-gradient-border {
          --gradient-stop: 8%;
          --gradient-opacity: 1;
          background-image: linear-gradient(135deg, color-mix(in srgb, var(--accent-lavender), transparent calc((1 - var(--gradient-opacity)) * 100%)) 0%, rgba(0,0,0,0.1) var(--gradient-stop), rgba(0,0,0,0.1) 100%);
          transition: --gradient-stop 0.5s cubic-bezier(0.4, 0, 0.2, 1), --gradient-opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark .search-gradient-border {
          background-image: linear-gradient(135deg, color-mix(in srgb, var(--accent-lavender), transparent calc((1 - var(--gradient-opacity)) * 100%)) 0%, rgba(255,255,255,0.1) var(--gradient-stop), rgba(255,255,255,0.1) 100%);
        }
        .search-gradient-border:focus-within {
          --gradient-stop: 100%;
          --gradient-opacity: 0.4;
          transform: scale(1.01);
        }
      `}</style>
      <div className="p-4 lg:px-20 xl:px-40 lg:pt-6 lg:pb-40">
        <MetallicIconBrowserHeader
          totalCount={totalCount}
          countBySource={countBySource}
          search={search}
          hasDebouncedSearch={hasDebouncedSearch}
          onSearchChange={setSearch}
          isLoading={isLoading}
          searchType={searchType}
          expandedQuery={expandedQuery}
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categories}
          categoryOpen={categoryOpen}
          onCategoryOpenChange={setCategoryOpen}
          filtersExpanded={filtersExpanded}
          onFiltersExpandedChange={setFiltersExpanded}
          controlsExpanded={controlsExpanded}
          onControlsExpandedChange={setControlsExpanded}
          sizePreset={sizePreset}
          onSizePresetChange={setSizePreset}
          strokePreset={strokePreset}
          onStrokePresetChange={setStrokePreset}
          cartCount={cartItems.length}
          onClearCart={clearCart}
          canBundleAll={canBundleAll}
          iconsNotInBundleCount={iconsNotInBundleCount}
          onBundleAll={handleBundleAll}
        />

        <MetallicIconBrowserResults
          isLoading={isLoading}
          icons={icons}
          iconsToShow={iconsToShow}
          gridStyle={gridStyle}
          cartItemIds={cartItemIds}
          onToggleCart={toggleCartItem}
          strokeWeight={strokeWeight}
          iconSize={iconSize}
          containerSize={containerSize}
          page={page}
          totalPages={totalPages}
          totalResults={totalResults}
          onPageChange={goToPage}
        />

        <MetallicIconBrowserCartLayer
          items={cartItems}
          onRemove={removeCartItem}
          onClear={clearCart}
          onAddPack={addIconsByName}
          isCartOpen={isCartOpen}
          onCartClose={() => setIsCartOpen(false)}
          confirmBundleOpen={confirmBundleOpen}
          pendingBundleCount={pendingBundleIcons.length}
          onConfirmBundleOpenChange={setConfirmBundleOpen}
          onConfirmBundleAdd={handleConfirmBundleAdd}
        />
      </div>
    </div>
  );
}
