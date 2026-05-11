import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { iconSearchCache } from "@/lib/search-cache";
import { useEventListener } from "@/lib/use-event-listener";
import { toast } from "sonner";
import { SIZE_PRESETS, STROKE_PRESETS, type SizePreset, type StrokePreset } from "./styled-icon";
import type { IconData, IconLibrary } from "@/types/icon";

// Keep homepage payload and first render lighter while preserving dense browsing.
const ICONS_PER_PAGE = 160;

interface UseIconBrowserParams {
  initialIcons: IconData[];
  totalCount: number;
}

function buildIconSearchParams(opts: {
  limit: number;
  offset: number;
  query?: string | undefined;
  source?: string | undefined;
  category?: string | undefined;
}): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(opts.limit),
    offset: String(opts.offset),
  });
  if (opts.query) params.set("q", opts.query);
  if (opts.source && opts.source !== "all") params.set("source", opts.source);
  if (opts.category && opts.category !== "all") params.set("category", opts.category);
  return params;
}

export function useIconBrowser({ initialIcons, totalCount }: UseIconBrowserParams) {
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
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const estimatedColumns = (() => {
    if (viewportWidth === null) return 10;
    let padding = 16 * 2;
    if (viewportWidth >= 1280) padding = 160 * 2;
    else if (viewportWidth >= 1024) padding = 80 * 2;
    const containerWidth = viewportWidth - padding;
    const gap = 12;
    return Math.max(4, Math.floor((containerWidth + gap) / (containerSize + gap)));
  })();

  const iconsToShow = (() => {
    if (viewportWidth === null) return icons;
    const completeRows = Math.floor(icons.length / estimatedColumns);
    return completeRows > 0 ? icons.slice(0, completeRows * estimatedColumns) : icons;
  })();

  // Cart state - persisted to localStorage
  const [cartItems, setCartItems] = useState<IconData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemIds = new Set(cartItems.map((item) => item.id));

  // Hover state for library chip highlighting
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

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
      const savedCart = localStorage.getItem("unicon-bundle");
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as IconData[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        }
      }
      const savedStroke = localStorage.getItem("unicon-stroke-preset");
      if (savedStroke && savedStroke in STROKE_PRESETS) {
        setStrokePreset(savedStroke as StrokePreset);
      }
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

  const hasActiveFilters = selectedSource !== "all" || selectedCategory !== "all" || debouncedSearch.length > 0;
  const hasDebouncedSearch = debouncedSearch.length > 0;
  const iconsNotInBundleCount = icons.filter((icon) => !cartItemIds.has(icon.id)).length;
  const canBundleAll = hasActiveFilters && iconsNotInBundleCount > 0;

  const removeCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const addIconsByName = useCallback(async (iconNames: string[]) => {
    try {
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

  // Track the latest in-flight request so slower stale responses (e.g. an
  // unfiltered search that resolves after the user picks a library) never
  // overwrite the current results. Refs are stable across renders.
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch icons - defined as a useCallback
  const fetchIcons = useCallback(
    async (pageNum: number) => {
      const requestId = ++requestIdRef.current;
      const isCurrent = () => requestId === requestIdRef.current;

      const applyResults = (result: {
        icons: IconData[];
        searchType?: string;
        expandedQuery?: string | null;
        hasMore?: boolean;
      }) => {
        if (!isCurrent()) return;
        setIcons(result.icons);
        setSearchType(result.searchType ?? "text");
        setExpandedQuery(result.expandedQuery ?? null);
        if (!result.hasMore && result.icons.length < ICONS_PER_PAGE) {
          setTotalResults(pageNum * ICONS_PER_PAGE + result.icons.length);
        }
      };

      // A newer request supersedes any in-flight one.
      abortRef.current?.abort();
      abortRef.current = null;

      const cacheKey = {
        q: debouncedSearch || '',
        source: selectedSource,
        category: selectedCategory,
        limit: ICONS_PER_PAGE,
        offset: pageNum * ICONS_PER_PAGE,
      };

      const cached = iconSearchCache.get(cacheKey);
      if (cached) {
        applyResults(cached);
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const params = buildIconSearchParams({
          limit: ICONS_PER_PAGE,
          offset: pageNum * ICONS_PER_PAGE,
          query: debouncedSearch || undefined,
          source: selectedSource,
          category: selectedCategory,
        });

        const res = await fetch(`/api/icons?${params}`, { signal: controller.signal });
        const data = await res.json();

        iconSearchCache.set(cacheKey, {
          icons: data.icons,
          searchType: data.searchType,
          expandedQuery: data.expandedQuery,
          hasMore: data.hasMore,
        });

        applyResults(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        logger.error("Failed to fetch icons:", error);
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    },
    [debouncedSearch, selectedSource, selectedCategory]
  );

  // Use a ref for fetchIcons to avoid stale closures in effects
  // without adding fetchIcons to their dependency arrays (which would cause double-fetching)
  const fetchIconsRef = useRef(fetchIcons);
  fetchIconsRef.current = fetchIcons;

  // Refetch when filters change - reset to page 0
  useEffect(() => {
    setPage(0);
    fetchIconsRef.current(0);
  }, [debouncedSearch, selectedSource, selectedCategory]);

  // Fetch when page changes (but not when filters change, since that's handled above)
  useEffect(() => {
    if (page > 0) {
      fetchIconsRef.current(page);
    }
  }, [page]);

  // Abort any in-flight request on unmount so it can't update state afterwards.
  useEffect(() => () => abortRef.current?.abort(), []);

  const goToPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    // Search/filter state
    search,
    setSearch,
    debouncedSearch,
    hasDebouncedSearch,
    selectedSource,
    setSelectedSource,
    selectedCategory,
    setSelectedCategory,
    categoryOpen,
    setCategoryOpen,
    filtersExpanded,
    setFiltersExpanded,
    isLoading,
    searchType,
    expandedQuery,

    // Display presets
    strokePreset,
    setStrokePreset,
    sizePreset,
    setSizePreset,
    controlsExpanded,
    setControlsExpanded,
    strokeWeight,
    iconSize,
    containerSize,

    // Icons data
    icons,
    iconsToShow,
    page,
    totalPages,
    totalResults,
    gridStyle,
    goToPage,

    // Cart state
    cartItems,
    isCartOpen,
    setIsCartOpen,
    cartItemIds,
    toggleCartItem,
    removeCartItem,
    clearCart,
    addIconsByName,

    // Bundle all
    canBundleAll,
    iconsNotInBundleCount,
    handleBundleAll,
    confirmBundleOpen,
    setConfirmBundleOpen,
    pendingBundleIcons,
    handleConfirmBundleAdd,

    // Hover
    hoveredSource,
    setHoveredSource,
    hasActiveFilters,
  };
}
