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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SIZE_PRESETS, STROKE_PRESETS, type SizePreset, type StrokePreset } from "@/components/icons/styled-icon";
import { generateRenderableSvg, normalizeViewBoxInContent, STANDARD_VIEWBOX } from "@/lib/icon-utils";
import { analyzeViewBoxMixing } from "@/lib/bundle-utils";
import type { Bundle, BundleIcon } from "@/types/database";
import type { IconData, IconLibrary } from "@/types/icon";

interface BundleBrowserProps {
  bundle: Bundle;
  categories: string[];
  onUpdate: (bundle: Bundle) => void;
}

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

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function BundleBrowser({ bundle, categories, onUpdate }: BundleBrowserProps) {
  // Bundle state
  const [icons, setIcons] = useState<BundleIcon[]>(
    Array.isArray(bundle.icons) ? bundle.icons : []
  );
  const [normalizeStrokes, setNormalizeStrokes] = useState(bundle.normalize_strokes);
  const [targetStrokeWidth, setTargetStrokeWidth] = useState(bundle.target_stroke_width ?? 2);
  const [normalizeViewbox, setNormalizeViewbox] = useState(bundle.normalize_viewbox ?? false);
  const targetViewbox = STANDARD_VIEWBOX;
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<IconData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<string>("text");
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  // Display presets
  const [strokePreset, setStrokePreset] = useState<StrokePreset>("regular");
  const [sizePreset, setSizePreset] = useState<SizePreset>("m");
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const { icon: iconSize, container: containerSize } = SIZE_PRESETS[sizePreset];

  const iconIds = useMemo(() => new Set(icons.map((i) => i.id)), [icons]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Perform search
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If no filters active, clear results
    if (!debouncedSearch.trim() && selectedSource === "all" && selectedCategory === "all") {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (debouncedSearch.trim()) params.set("q", debouncedSearch);
        if (selectedSource !== "all") params.set("source", selectedSource);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const res = await fetch(`/api/icons?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        
        if (!controller.signal.aborted) {
          setSearchResults(data.icons || []);
          setSearchType(data.searchType || "text");
          setExpandedQuery(data.expandedQuery || null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast.error("Search failed");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };
    doSearch();

    return () => controller.abort();
  }, [debouncedSearch, selectedSource, selectedCategory]);

  // Icon operations
  const handleAddIcon = useCallback((icon: IconData) => {
    if (iconIds.has(icon.id)) {
      toast.info("Icon already in bundle");
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
    setIcons((prev) => [...prev, bundleIcon]);
    setHasChanges(true);
    toast.success(`Added ${icon.normalizedName}`);
  }, [iconIds]);

  const handleRemoveIcon = useCallback((id: string) => {
    setIcons((prev) => prev.filter((i) => i.id !== id));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bundles/${bundle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icons: icons.map((icon) => ({
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
  }, [bundle.id, icons, normalizeStrokes, targetStrokeWidth, normalizeViewbox, targetViewbox, onUpdate]);

  // Rendering helpers
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

  const renderSearchIcon = useCallback((icon: IconData) => {
    const svgHtml = generateRenderableSvg(
      {
        viewBox: icon.viewBox,
        content: icon.content,
        defaultStroke: icon.defaultStroke ?? true,
        defaultFill: icon.defaultFill ?? false,
        strokeWidth: icon.strokeWidth ?? "2",
      },
      { size: iconSize }
    );

    return (
      <div
        className="text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
        style={{ width: iconSize, height: iconSize }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }, [iconSize]);

  const hasStrokeIcons = icons.some((i) => i.defaultStroke !== false || !i.defaultFill);
  const viewBoxAnalysis = useMemo(() => analyzeViewBoxMixing(icons.map(i => ({ viewBox: i.viewBox ?? "0 0 24 24" }))), [icons]);
  const hasMixedViewBox = viewBoxAnalysis.hasInconsistency;

  const isSearchActive = debouncedSearch.trim() || selectedSource !== "all" || selectedCategory !== "all";

  return (
    <div className="min-h-screen">
      {/* Hero Section - Bundle Info */}
      <div className="px-4 lg:px-20 xl:px-40 pt-8 pb-6 border-b border-border">
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
              {icons.length} icon{icons.length !== 1 ? "s" : ""}
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

      {/* Search Section */}
      <div className="px-4 lg:px-20 xl:px-40 py-6 border-b border-border bg-muted/30">
        {/* Search bar */}
        <div className="relative mb-4 w-full max-w-[40rem]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 z-10" />
          <input
            type="text"
            placeholder="Search icons to add to your bundle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[hsl(0,0%,3%)] rounded-lg pl-10 pr-12 py-2.5 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-[var(--accent-aqua)]/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {isSearching && search && (
              <Loader2Icon className="w-4 h-4 text-black/40 dark:text-white/40 animate-spin" />
            )}
            {!isSearching && search && searchType === "semantic" && (
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

        {/* Filters */}
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
              {/* Library filter */}
              <div className="flex items-center gap-2">
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

              <div className="hidden sm:block w-px h-5 bg-black/10 dark:bg-white/10" />

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

        {/* Display controls */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={() => setControlsExpanded(!controlsExpanded)}
            className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
          >
            <SlidersHorizontalIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Display</span>
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

      {/* Icon Grid */}
      <div className="px-4 lg:px-20 xl:px-40 py-8">
        {/* Search results */}
        {isSearchActive && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              {isSearching ? "Searching..." : `Search results (${searchResults.length})`}
            </h2>
            {searchResults.length > 0 ? (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)` }}
              >
                {searchResults.map((icon) => {
                  const isInBundle = iconIds.has(icon.id);
                  return (
                    <button
                      key={icon.id}
                      onClick={() => handleAddIcon(icon)}
                      disabled={isInBundle}
                      className={`group relative flex items-center justify-center rounded-lg border transition-all ${
                        isInBundle
                          ? "bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/30 cursor-default"
                          : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/5"
                      }`}
                      style={{ width: containerSize, height: containerSize }}
                      title={`${icon.normalizedName} (${icon.sourceId})`}
                    >
                      {renderSearchIcon(icon)}
                      {isInBundle && (
                        <CheckIcon className="absolute top-1 right-1 w-3 h-3 text-[var(--accent-mint)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : !isSearching && (
              <p className="text-muted-foreground text-sm">No icons found</p>
            )}
          </div>
        )}

        {/* Bundle icons */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            In this bundle ({icons.length})
          </h2>
          {icons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl">
              <PackageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No icons in this bundle</p>
              <p className="text-sm text-muted-foreground/60">Search for icons above to add them</p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fill, ${containerSize}px)` }}
            >
              {icons.map((icon) => (
                <div
                  key={icon.id}
                  className="group relative flex items-center justify-center rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors"
                  style={{ width: containerSize, height: containerSize }}
                  title={`${icon.normalizedName} (${icon.sourceId})`}
                >
                  {renderBundleIcon(icon)}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveIcon(icon.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove from bundle"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 lg:px-20 xl:px-40 py-8 border-t border-border">
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
