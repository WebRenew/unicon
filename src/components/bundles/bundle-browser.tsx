"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@/components/icons/ui/arrow-left";
import { PackageIcon } from "@/components/icons/ui/package";
import { GlobeIcon } from "@/components/icons/ui/globe";
import { SearchIcon } from "@/components/icons/ui/search";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { SparklesIcon } from "@/components/icons/ui/sparkles";
import { CheckIcon } from "@/components/icons/ui/check";
import { XIcon } from "@/components/icons/ui/x";
import { FilterIcon } from "@/components/icons/ui/filter";
import { SlidersHorizontalIcon } from "@/components/icons/ui/sliders-horizontal";
import { ChevronsUpDownIcon } from "@/components/icons/ui/chevrons-up-down";
import { DownloadIcon } from "@/components/icons/ui/download";
import { ChevronLeftIcon } from "@/components/icons/ui/chevron-left";
import { ChevronRightIcon } from "@/components/icons/ui/chevron-right";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { StyledIcon, SIZE_PRESETS, STROKE_PRESETS, type SizePreset, type StrokePreset } from "@/components/icons/styled-icon";
import { generateRenderableSvg, normalizeViewBoxInContent, STANDARD_VIEWBOX } from "@/lib/icon-utils";
import { analyzeViewBoxMixing } from "@/lib/bundle-utils";
import type { Bundle, BundleIcon } from "@/types/database";
import type { IconData, IconLibrary } from "@/types/icon";

interface BundleBrowserProps {
  bundle: Bundle;
  categories: string[];
  initialIcons: IconData[];
  totalIconCount: number;
  countBySource: Record<string, number>;
  onUpdate: (bundle: Bundle) => void;
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
  iconoir: "bg-teal-500",
};

const SOURCE_COLORS_SELECTED: Record<string, string> = {
  lucide: "bg-orange-500/69",
  phosphor: "bg-emerald-500/69",
  hugeicons: "bg-violet-500/69",
  heroicons: "bg-blue-500/69",
  tabler: "bg-cyan-500/69",
  feather: "bg-pink-500/69",
  remix: "bg-red-500/69",
  "simple-icons": "bg-gray-500/69",
  iconoir: "bg-teal-500/69",
};

const SOURCE_OPTIONS = [
  "all",
  "lucide",
  "phosphor",
  "hugeicons",
  "heroicons",
  "tabler",
  "feather",
  "remix",
  "simple-icons",
  "iconoir",
] as const;

const ICONS_PER_PAGE = 200;

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function BundleBrowser({ bundle, categories, initialIcons, totalIconCount, countBySource, onUpdate }: BundleBrowserProps) {
  // Bundle state
  const [bundleIcons, setBundleIcons] = useState<BundleIcon[]>(
    Array.isArray(bundle.icons) ? bundle.icons : []
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

  // Memoize grid style
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

  // Fetch icons when search/filters/page change
  useEffect(() => {
    // Cancel previous request
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

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedSource, selectedCategory]);

  // Icon operations
  const handleAddIcon = useCallback((icon: IconData) => {
    if (bundleIconIds.has(icon.id)) {
      // Remove if already in bundle
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

  // Rendering helper for bundle icons (with normalization)
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

    return (
      <div
        className="text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
        style={{ width: iconSize, height: iconSize }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }, [normalizeStrokes, targetStrokeWidth, normalizeViewbox, targetViewbox, iconSize]);

  const hasStrokeIcons = bundleIcons.some((i) => i.defaultStroke !== false || !i.defaultFill);
  const viewBoxAnalysis = useMemo(() => analyzeViewBoxMixing(bundleIcons.map(i => ({ viewBox: i.viewBox ?? "0 0 24 24" }))), [bundleIcons]);
  const hasMixedViewBox = viewBoxAnalysis.hasInconsistency;

  return (
    <div className="min-h-screen px-4 lg:px-20 xl:px-40">
      {/* Hero Section - Bundle Info */}
      <div className="pt-8 pb-6 border-b border-border">
        {/* Back link */}
        <Link
          href="/bundles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to bundles
        </Link>

        {/* Bundle header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20">
            <PackageIcon className="w-8 h-8 text-[var(--accent-mint)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{bundle.name}</h1>
              {bundle.is_public && (
                <GlobeIcon className="w-5 h-5 text-[var(--accent-aqua)]" />
              )}
            </div>
            {bundle.description && (
              <p className="text-muted-foreground">{bundle.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {bundleIcons.length} icon{bundleIcons.length !== 1 ? "s" : ""} in bundle
            </p>
          </div>

          {/* Save button */}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-aqua)] text-black text-sm font-medium hover:bg-[var(--accent-aqua)]/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Save changes
            </button>
          )}
        </div>

        {/* Bundle options */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Normalize strokes */}
          <label className={`flex items-center gap-2 cursor-pointer ${!hasStrokeIcons ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={normalizeStrokes}
              onChange={(e) => {
                setNormalizeStrokes(e.target.checked);
                setHasChanges(true);
              }}
              disabled={!hasStrokeIcons}
              className="w-4 h-4 rounded border-black/20 dark:border-white/20 bg-transparent"
            />
            <span className="text-sm text-muted-foreground">Normalize strokes</span>
          </label>

          {normalizeStrokes && hasStrokeIcons && (
            <select
              value={targetStrokeWidth}
              onChange={(e) => {
                setTargetStrokeWidth(Number(e.target.value));
                setHasChanges(true);
              }}
              className="text-sm px-2 py-1 rounded bg-black/5 dark:bg-white/5 border-0 text-foreground"
            >
              <option value={1.5}>1.5px</option>
              <option value={2}>2px</option>
              <option value={2.5}>2.5px</option>
            </select>
          )}

          {hasMixedViewBox && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizeViewbox}
                onChange={(e) => {
                  setNormalizeViewbox(e.target.checked);
                  setHasChanges(true);
                }}
                className="w-4 h-4 rounded border-black/20 dark:border-white/20 bg-transparent"
              />
              <span className="text-sm text-muted-foreground">Normalize viewBox</span>
            </label>
          )}

          {/* Export button */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-auto"
          >
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Bundle Icons Section - ABOVE filters */}
      {bundleIcons.length > 0 && (
        <div className="py-6 border-b border-border bg-[var(--accent-mint)]/5 -mx-4 lg:-mx-20 xl:-mx-40 px-4 lg:px-20 xl:px-40">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            In this bundle ({bundleIcons.length})
          </h2>
          <div className="grid gap-3" style={gridStyle}>
            {bundleIcons.map((icon) => (
              <div
                key={icon.id}
                className="group relative flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 hover:scale-105 overflow-hidden rounded-xl dark:bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] bg-[linear-gradient(to_bottom,#fff_0%,#f5f5f5_8%,#eee_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.1)] dark:border-t dark:border-[#666]/30 border border-black/10 ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-[hsl(0,0%,3%)]"
                style={{ width: containerSize, height: containerSize }}
                title={`${icon.normalizedName} (${icon.sourceId})`}
              >
                {renderBundleIcon(icon)}
                
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveIcon(icon.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                  title="Remove from bundle"
                >
                  <XIcon className="w-3 h-3" />
                </button>
                
                {/* Selected indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center z-10 group-hover:opacity-0 transition-opacity">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Library Tabs - Like Homepage */}
      <div className="hidden md:flex flex-wrap items-center gap-2 text-xs pt-8 mb-6">
        <button
          onClick={() => setSelectedSource("all")}
          aria-label="Show all libraries"
          aria-pressed={selectedSource === "all"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-[background-color,border-color,color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20 ${
            selectedSource === "all"
              ? "bg-black/90 dark:bg-white/90 text-white dark:text-black border-2 border-black dark:border-white"
              : "bg-transparent border-2 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:border-black/20 dark:hover:border-white/20 hover:text-black/80 dark:hover:text-white/80"
          }`}
        >
          <span className="font-medium">All Libraries</span>
          <span className="opacity-70">• {totalIconCount.toLocaleString("en-US")}</span>
        </button>
        {Object.entries(countBySource).map(([source, count]) => (
          <button
            key={source}
            onClick={() => setSelectedSource(source as IconLibrary)}
            aria-label={`Filter by ${source} library`}
            aria-pressed={selectedSource === source}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20 ${
              selectedSource === source
                ? `${SOURCE_COLORS_SELECTED[source]} text-white border-2 border-current shadow-sm`
                : "bg-transparent border-2 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:border-black/20 dark:hover:border-white/20 hover:text-black/80 dark:hover:text-white/80"
            }`}
          >
            <span className={`w-2 h-2 rounded-full transition-colors duration-300 ease-out ${selectedSource === source ? "bg-white" : SOURCE_COLORS[source]}`} />
            <span className="capitalize font-medium">{source}</span>
            <span className={selectedSource === source ? "opacity-90" : "opacity-70"}>
              {count?.toLocaleString("en-US")}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-4 w-full max-w-[40rem]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 z-10" />
        <div className="search-gradient-border rounded-lg p-[1px]">
          <input
            type="text"
            placeholder="Search icons to add to your bundle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[hsl(0,0%,3%)] rounded-lg pl-10 pr-12 py-2.5 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 text-sm focus:outline-none focus:ring-0 focus:bg-gray-50 dark:focus:bg-[hsl(0,0%,5%)] transition-colors duration-500"
          />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          {isLoading && (
            <Loader2Icon className="w-4 h-4 text-black/40 dark:text-white/40 animate-spin" />
          )}
          {!isLoading && debouncedSearch && searchType === "semantic" && (
            <SparklesIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          )}
        </div>
      </div>

      {/* AI feedback */}
      {expandedQuery && debouncedSearch && (
        <div className="mb-4 flex items-start gap-2 text-xs text-black/40 dark:text-white/40">
          <SparklesIcon className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
          <span>AI expanded: <span className="text-black/60 dark:text-white/60">{expandedQuery}</span></span>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Row 1: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
          >
            <FilterIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Filters</span>
            <svg
              className={`w-3 h-3 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filtersExpanded && (
            <>
              {/* Library filter - mobile only (desktop uses tabs above) */}
              <div className="flex items-center gap-2 md:hidden">
                <span className="text-[10px] font-mono text-black/50 dark:text-white/50 uppercase">Library</span>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCE_OPTIONS.map((source) => (
                    <button
                      key={source}
                      onClick={() => setSelectedSource(source)}
                      className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                        selectedSource === source
                          ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                          : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                    >
                      {source === "all" ? "All" : source}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10 md:hidden" />

              {/* Category filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-black/50 dark:text-white/50 uppercase">Category</span>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex h-7 items-center justify-between gap-2 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 text-xs font-mono text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 min-w-[140px]">
                      {selectedCategory === "all" ? "All Categories" : toTitleCase(selectedCategory)}
                      <ChevronsUpDownIcon className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search categories..." className="text-xs" />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all" onSelect={() => { setSelectedCategory("all"); setCategoryOpen(false); }} className="text-xs font-mono">
                            <CheckIcon className={`mr-2 h-3 w-3 ${selectedCategory === "all" ? "opacity-100" : "opacity-0"}`} />
                            All Categories
                          </CommandItem>
                          {categories.map((cat) => (
                            <CommandItem key={cat} value={cat} onSelect={() => { setSelectedCategory(cat); setCategoryOpen(false); }} className="text-xs font-mono">
                              <CheckIcon className={`mr-2 h-3 w-3 ${selectedCategory === cat ? "opacity-100" : "opacity-0"}`} />
                              {toTitleCase(cat)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>

        {/* Row 2: Display controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={() => setControlsExpanded(!controlsExpanded)}
            className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
          >
            <SlidersHorizontalIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Controls</span>
            <svg
              className={`w-3 h-3 transition-transform ${controlsExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {controlsExpanded && (
            <>
              {/* Size */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-black/50 dark:text-white/50 uppercase">Size</span>
                <div className="flex rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                  {(Object.keys(SIZE_PRESETS) as SizePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSizePreset(preset)}
                      className={`px-2.5 py-1.5 text-xs font-mono transition-all ${
                        sizePreset === preset
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {SIZE_PRESETS[preset].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10" />

              {/* Stroke weight */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-black/50 dark:text-white/50 uppercase">Weight</span>
                <div className="flex rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                  {(Object.keys(STROKE_PRESETS) as StrokePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setStrokePreset(preset)}
                      className={`px-3 py-1.5 text-xs font-mono transition-all ${
                        strokePreset === preset
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {STROKE_PRESETS[preset].label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Browse Icons Grid */}
      <div className="pb-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-black/40 dark:text-white/40 text-xs">
            Page {page + 1} of {totalPages} • {totalResults.toLocaleString("en-US")} icons
            {" • "}Click to add/remove from bundle
            {isLoading && <Loader2Icon className="inline ml-2 w-3 h-3 animate-spin" />}
          </p>
        </div>

        {/* Icon Grid */}
        {browseIcons.length > 0 ? (
          <>
            <div className="grid gap-3" style={gridStyle}>
              {browseIcons.map((icon) => (
                <StyledIcon
                  key={icon.id}
                  icon={icon}
                  style="metal"
                  isSelected={bundleIconIds.has(icon.id)}
                  onToggleCart={handleAddIcon}
                  strokeWeight={strokeWeight}
                  iconSize={iconSize}
                  containerSize={containerSize}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 text-sm font-mono rounded-lg transition-colors ${
                          pageNum === page
                            ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                            : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="w-8 h-8 text-black/40 dark:text-white/40 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-12 h-12 text-black/20 dark:text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-black/60 dark:text-white/60">No icons found</h3>
            <p className="text-sm text-black/40 dark:text-white/40 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Created {new Date(bundle.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {bundle.updated_at !== bundle.created_at && (
            <> · Last updated {new Date(bundle.updated_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}</>
          )}
        </p>
      </div>
    </div>
  );
}
