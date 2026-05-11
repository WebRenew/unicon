import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { SIZE_PRESETS, STROKE_PRESETS, type SizePreset, type StrokePreset } from "@/components/icons/styled-icon";
import { generateRenderableSvg, normalizeViewBoxInContent, STANDARD_VIEWBOX } from "@/lib/icon-utils";
import { analyzeViewBoxMixing } from "@/lib/bundle-utils";
import type { Bundle, BundleIcon } from "@/types/database";
import type { IconData, IconLibrary } from "@/types/icon";

const ICONS_PER_PAGE = 200;

interface UseBundleBrowserParams {
  bundle: Bundle;
  initialIcons: IconData[];
  totalIconCount: number;
  onUpdate: (bundle: Bundle) => void;
}

export function useBundleBrowser({
  bundle,
  initialIcons,
  totalIconCount,
  onUpdate,
}: UseBundleBrowserParams) {
  // Bundle state
  const [bundleIcons, setBundleIcons] = useState<BundleIcon[]>(
    () => (Array.isArray(bundle.icons) ? bundle.icons : []) as BundleIcon[]
  );
  const [normalizeStrokes, setNormalizeStrokes] = useState(bundle.normalize_strokes);
  const [targetStrokeWidth, setTargetStrokeWidth] = useState(bundle.target_stroke_width ?? 2);
  const [normalizeViewbox, setNormalizeViewbox] = useState(bundle.normalize_viewbox ?? false);
  const targetViewbox = STANDARD_VIEWBOX;
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Search/browse state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [browseIcons, setBrowseIcons] = useState<IconData[]>(initialIcons);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<string>("text");
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(totalIconCount);

  // Display presets
  const [strokePreset, setStrokePreset] = useState<StrokePreset>("regular");
  const [sizePreset, setSizePreset] = useState<SizePreset>("m");
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const strokeWeight = STROKE_PRESETS[strokePreset].value;
  const { icon: iconSize, container: containerSize } = SIZE_PRESETS[sizePreset];

  const bundleIconIds = useMemo(() => new Set(bundleIcons.map((i) => i.id)), [bundleIcons]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const totalPages = Math.ceil(totalResults / ICONS_PER_PAGE);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)`,
    justifyContent: 'start' as const,
  }), [containerSize]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Track if this is initial mount
  const isInitialMount = useRef(true);

  // Fetch icons when search/filters/page change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!debouncedSearch && selectedSource === "all" && selectedCategory === "all" && page === 0) {
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchIcons = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(ICONS_PER_PAGE),
          offset: String(page * ICONS_PER_PAGE),
        });
        if (debouncedSearch.trim()) params.set("q", debouncedSearch);
        if (selectedSource !== "all") params.set("source", selectedSource);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const res = await fetch(`/api/icons?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch icons");
        const data = await res.json();

        if (!controller.signal.aborted) {
          setBrowseIcons(data.icons || []);
          setTotalResults(data.total || 0);
          setSearchType(data.searchType || "text");
          setExpandedQuery(data.expandedQuery || null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast.error("Failed to load icons");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchIcons();

    return () => controller.abort();
  }, [debouncedSearch, selectedSource, selectedCategory, page]);

  // Reset page when filters change. React-blessed "compare-prev-value" pattern
  // avoids the setState-in-effect anti-pattern: React reruns the component
  // before effects fire, so the fetch effect below already sees page === 0.
  const filterKey = `${debouncedSearch}|${selectedSource}|${selectedCategory}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 0) setPage(0);
  }

  // Icon operations
  const handleAddIcon = useCallback((icon: IconData) => {
    if (bundleIconIds.has(icon.id)) {
      setBundleIcons((prev) => prev.filter((i) => i.id !== icon.id));
      setHasChanges(true);
      toast.success(`Removed ${icon.normalizedName}`);
      return;
    }
    const bundleIcon: BundleIcon = {
      id: icon.id,
      name: icon.name,
      normalizedName: icon.normalizedName,
      sourceId: icon.sourceId,
      svg: icon.content,
      viewBox: icon.viewBox,
      strokeWidth: icon.strokeWidth,
      defaultFill: icon.defaultFill,
      defaultStroke: icon.defaultStroke,
    };
    setBundleIcons((prev) => [...prev, bundleIcon]);
    setHasChanges(true);
    toast.success(`Added ${icon.normalizedName}`);
  }, [bundleIconIds]);

  const handleRemoveIcon = useCallback((id: string) => {
    setBundleIcons((prev) => prev.filter((i) => i.id !== id));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bundles/${bundle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icons: bundleIcons.map((icon) => ({
            id: icon.id,
            name: icon.name,
            normalizedName: icon.normalizedName,
            sourceId: icon.sourceId,
            svg: icon.svg,
            viewBox: icon.viewBox,
            strokeWidth: icon.strokeWidth,
            defaultFill: icon.defaultFill,
            defaultStroke: icon.defaultStroke,
          })),
          normalize_strokes: normalizeStrokes,
          target_stroke_width: normalizeStrokes ? targetStrokeWidth : null,
          normalize_viewbox: normalizeViewbox,
          target_viewbox: normalizeViewbox ? targetViewbox : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      onUpdate(data.bundle);
      setHasChanges(false);
      toast.success("Bundle saved");
    } catch {
      toast.error("Failed to save bundle");
    } finally {
      setIsSaving(false);
    }
  }, [bundle.id, bundleIcons, normalizeStrokes, targetStrokeWidth, normalizeViewbox, targetViewbox, onUpdate]);

  const renderBundleIcon = useCallback((icon: BundleIcon) => {
    const svgContent = icon.svg;
    if (!svgContent) return null;

    const defaultViewBox = icon.sourceId === "phosphor" ? "0 0 256 256" : "0 0 24 24";
    const iconViewBox = icon.viewBox ?? defaultViewBox;

    let content = svgContent;
    let viewBox = iconViewBox;
    if (normalizeViewbox && iconViewBox !== targetViewbox) {
      content = normalizeViewBoxInContent(svgContent, iconViewBox, targetViewbox);
      viewBox = targetViewbox;
    }

    const svgHtml = generateRenderableSvg(
      {
        viewBox,
        content,
        defaultStroke: icon.defaultStroke ?? true,
        defaultFill: icon.defaultFill ?? false,
        strokeWidth: icon.strokeWidth ?? "2",
      },
      {
        size: iconSize,
        ...(normalizeStrokes && { strokeWidth: targetStrokeWidth }),
      }
    );

    return svgHtml;
  }, [normalizeStrokes, targetStrokeWidth, normalizeViewbox, targetViewbox, iconSize]);

  const hasStrokeIcons = bundleIcons.some((i) => i.defaultStroke !== false || !i.defaultFill);
  const viewBoxAnalysis = useMemo(() => analyzeViewBoxMixing(bundleIcons.map(i => ({ viewBox: i.viewBox ?? "0 0 24 24" }))), [bundleIcons]);
  const hasMixedViewBox = viewBoxAnalysis.hasInconsistency;

  return {
    // Bundle state
    bundleIcons,
    normalizeStrokes,
    setNormalizeStrokes,
    targetStrokeWidth,
    setTargetStrokeWidth,
    normalizeViewbox,
    setNormalizeViewbox,
    isSaving,
    hasChanges,
    setHasChanges,

    // Search/browse state
    search,
    setSearch,
    debouncedSearch,
    selectedSource,
    setSelectedSource,
    selectedCategory,
    setSelectedCategory,
    categoryOpen,
    setCategoryOpen,
    filtersExpanded,
    setFiltersExpanded,
    browseIcons,
    isLoading,
    searchType,
    expandedQuery,
    page,
    setPage,
    totalResults,

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

    // Derived values
    bundleIconIds,
    totalPages,
    gridStyle,
    hasStrokeIcons,
    hasMixedViewBox,

    // Callbacks
    handleAddIcon,
    handleRemoveIcon,
    handleSave,
    renderBundleIcon,
  };
}
