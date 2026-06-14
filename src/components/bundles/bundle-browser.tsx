"use client";

import { useState } from "react";
import Link from "next/link";
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
import { CopyIcon } from "@/components/icons/ui/copy";
import { FileCodeIcon } from "@/components/icons/ui/file-code";
import { FileJsonIcon } from "@/components/icons/ui/file-json";
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
import { generateBundleExport, type BundleExportFormat } from "@/lib/bundle-export";
import { toast } from "sonner";
import type { Bundle } from "@/types/database";
import type { IconData, IconLibrary } from "@/types/icon";
import { useBundleBrowser } from "./use-bundle-browser";

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

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function BundleBrowser({ bundle, categories, initialIcons, totalIconCount, countBySource, onUpdate }: BundleBrowserProps) {
  const [exportFormat, setExportFormat] = useState<BundleExportFormat>("react");
  const [copiedExport, setCopiedExport] = useState(false);
  const {
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
    strokePreset,
    setStrokePreset,
    sizePreset,
    setSizePreset,
    controlsExpanded,
    setControlsExpanded,
    strokeWeight,
    iconSize,
    containerSize,
    bundleIconIds,
    totalPages,
    gridStyle,
    hasStrokeIcons,
    hasMixedViewBox,
    handleAddIcon,
    handleRemoveIcon,
    handleSave,
    renderBundleIcon,
  } = useBundleBrowser({ bundle, initialIcons, totalIconCount, onUpdate });

  const createExport = () => generateBundleExport(bundle.name, {
    icons: bundleIcons,
    format: exportFormat,
    normalizeStrokes,
    targetStrokeWidth,
    normalizeViewbox,
  });

  const handleCopyExport = async () => {
    const exportResult = createExport();
    if (exportResult.exportedIconCount === 0) {
      toast.error("No exportable icons in this bundle");
      return;
    }

    await navigator.clipboard.writeText(exportResult.content);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
    toast.success("Bundle copied");
  };

  const handleDownloadExport = () => {
    const exportResult = createExport();
    if (exportResult.exportedIconCount === 0) {
      toast.error("No exportable icons in this bundle");
      return;
    }

    const blob = new Blob([exportResult.content], { type: exportResult.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${exportResult.fileName}`);
  };

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

          <Popover>
            <PopoverTrigger asChild>
              <button
                disabled={bundleIcons.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                <DownloadIcon className="w-4 h-4" />
                Export
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setExportFormat("react")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-mono transition-colors ${
                      exportFormat === "react"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <FileCodeIcon className="w-3.5 h-3.5" />
                    React
                  </button>
                  <button
                    onClick={() => setExportFormat("svg")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-mono transition-colors ${
                      exportFormat === "svg"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <FileCodeIcon className="w-3.5 h-3.5" />
                    SVG
                  </button>
                  <button
                    onClick={() => setExportFormat("json")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-mono transition-colors ${
                      exportFormat === "json"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <FileJsonIcon className="w-3.5 h-3.5" />
                    JSON
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyExport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
                  >
                    <CopyIcon className="w-4 h-4" />
                    {copiedExport ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownloadExport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bundle Icons Section - ABOVE filters */}
      {bundleIcons.length > 0 && (
        <div className="py-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            In this bundle ({bundleIcons.length})
          </h2>
          <div className="grid gap-4 pt-1" style={gridStyle}>
            {bundleIcons.map((icon) => {
              const svgHtml = renderBundleIcon(icon);
              return (
                <div
                  key={icon.id}
                  className="group relative flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 hover:scale-105 rounded-xl dark:bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] bg-[linear-gradient(to_bottom,#fff_0%,#f5f5f5_8%,#eee_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.1)] dark:border-t dark:border-[#666]/30 border border-black/10"
                  style={{ width: containerSize, height: containerSize }}
                  title={`${icon.normalizedName} (${icon.sourceId})`}
                >
                  {svgHtml && (
                    <div
                      className="text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
                      style={{ width: iconSize, height: iconSize }}
                      // SVG content is from trusted icon library data, not user input
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  )}

                  {/* Remove button on hover */}
                  <button
                    onClick={() => handleRemoveIcon(icon.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                    title="Remove from bundle"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
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
