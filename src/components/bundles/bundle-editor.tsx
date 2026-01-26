"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { XIcon } from "@/components/icons/ui/x";
import { PlusIcon } from "@/components/icons/ui/plus";
import { SearchIcon } from "@/components/icons/ui/search";
import { CheckIcon } from "@/components/icons/ui/check";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { PackageIcon } from "@/components/icons/ui/package";
import { generateRenderableSvg, normalizeViewBoxInContent, STANDARD_VIEWBOX } from "@/lib/icon-utils";
import { analyzeViewBoxMixing } from "@/lib/bundle-utils";
import { toast } from "sonner";
import type { Bundle, BundleIcon } from "@/types/database";
import type { IconData } from "@/types/icon";

interface BundleEditorProps {
  bundle: Bundle;
  onUpdate: (bundle: Bundle) => void;
}

export function BundleEditor({ bundle, onUpdate }: BundleEditorProps) {
  const [icons, setIcons] = useState<BundleIcon[]>(
    Array.isArray(bundle.icons) ? bundle.icons : []
  );
  const [normalizeStrokes, setNormalizeStrokes] = useState(bundle.normalize_strokes);
  const [targetStrokeWidth, setTargetStrokeWidth] = useState(bundle.target_stroke_width ?? 2);
  const [normalizeViewbox, setNormalizeViewbox] = useState(bundle.normalize_viewbox ?? false);
  // Always normalize to standard 24x24 viewBox
  const targetViewbox = STANDARD_VIEWBOX;
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Search panel state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IconData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const iconIds = useMemo(() => new Set(icons.map((i) => i.id)), [icons]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Cancel any in-flight request to prevent stale results
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery, limit: "50" });
        const res = await fetch(`/api/icons?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        // Only update if this request wasn't aborted
        if (!controller.signal.aborted) {
          setSearchResults(data.icons || []);
        }
      } catch (err) {
        // Ignore abort errors, they're expected when a new search starts
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        toast.error("Search failed");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };
    doSearch();

    // Cleanup: abort request if component unmounts or query changes
    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleRemoveIcon = useCallback((id: string) => {
    setIcons((prev) => prev.filter((i) => i.id !== id));
    setHasChanges(true);
  }, []);

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

  const handleNormalizeChange = useCallback((checked: boolean) => {
    setNormalizeStrokes(checked);
    setHasChanges(true);
  }, []);

  const handleStrokeWidthChange = useCallback((width: number) => {
    setTargetStrokeWidth(width);
    setHasChanges(true);
  }, []);

  const handleNormalizeViewboxChange = useCallback((checked: boolean) => {
    setNormalizeViewbox(checked);
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
  }, [bundle.id, icons, normalizeStrokes, targetStrokeWidth, normalizeViewbox, onUpdate]);

  const renderIcon = useCallback((icon: BundleIcon) => {
    const svgContent = icon.svg;
    if (!svgContent) return null;

    // Determine correct viewBox based on icon source (Phosphor uses 256x256, all others use 24x24)
    const defaultViewBox = icon.sourceId === "phosphor" ? "0 0 256 256" : "0 0 24 24";
    const iconViewBox = icon.viewBox ?? defaultViewBox;
    
    // Apply viewBox normalization if enabled and viewBox differs from target
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
        size: 24,
        ...(normalizeStrokes && { strokeWidth: targetStrokeWidth }),
      }
    );

    // SECURITY: SVG content from trusted icon libraries (Lucide, Phosphor, etc.), not user input
    return (
      <div
        className="w-6 h-6 text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }, [normalizeStrokes, targetStrokeWidth, normalizeViewbox]);

  const renderSearchIcon = useCallback((icon: IconData) => {
    const svgHtml = generateRenderableSvg(
      {
        viewBox: icon.viewBox,
        content: icon.content,
        defaultStroke: icon.defaultStroke ?? true,
        defaultFill: icon.defaultFill ?? false,
        strokeWidth: icon.strokeWidth ?? "2",
      },
      { size: 20 }
    );

    // SECURITY: SVG content from trusted icon libraries (Lucide, Phosphor, etc.), not user input
    return (
      <div
        className="w-5 h-5 text-black/70 dark:text-white/70 [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }, []);

  // Check if icon is stroke-based
  const hasStrokeIcons = icons.some((i) => i.defaultStroke !== false || !i.defaultFill);
  
  // Check if bundle has mixed viewBox sizes
  const viewBoxAnalysis = useMemo(() => analyzeViewBoxMixing(icons.map(i => ({ viewBox: i.viewBox ?? "0 0 24 24" }))), [icons]);
  const hasMixedViewBox = viewBoxAnalysis.hasInconsistency;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-mint)] text-black text-sm font-medium hover:bg-[var(--accent-mint)]/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add icons
          </button>

          {/* Normalize strokes toggle */}
          <label className={`flex items-center gap-2 cursor-pointer ${!hasStrokeIcons ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={normalizeStrokes}
              onChange={(e) => handleNormalizeChange(e.target.checked)}
              disabled={!hasStrokeIcons}
              className="w-4 h-4 rounded border-black/20 dark:border-white/20 bg-transparent text-black dark:text-white focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-sm text-muted-foreground">Normalize strokes</span>
          </label>

          {normalizeStrokes && hasStrokeIcons && (
            <select
              value={targetStrokeWidth}
              onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
              className="text-sm px-2 py-1 rounded bg-black/5 dark:bg-white/5 border-0 text-foreground focus:ring-0"
            >
              <option value={1.5}>1.5px</option>
              <option value={2}>2px</option>
              <option value={2.5}>2.5px</option>
            </select>
          )}

          {/* Normalize viewBox toggle - show when mixed viewBoxes detected */}
          {hasMixedViewBox && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizeViewbox}
                onChange={(e) => handleNormalizeViewboxChange(e.target.checked)}
                className="w-4 h-4 rounded border-black/20 dark:border-white/20 bg-transparent text-black dark:text-white focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground">Normalize viewBox</span>
            </label>
          )}
        </div>

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

      {/* Icon count */}
      <div className="text-sm text-muted-foreground">
        {icons.length} icon{icons.length !== 1 ? "s" : ""} in bundle
      </div>

      {/* Icon Grid */}
      {icons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl">
          <PackageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">No icons in this bundle</p>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-mint)] text-black text-sm font-medium hover:bg-[var(--accent-mint)]/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add icons
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="group relative flex flex-col items-center justify-center p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors"
            >
              {renderIcon(icon)}

              {/* Remove button */}
              <button
                onClick={() => handleRemoveIcon(icon.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove from bundle"
              >
                <XIcon className="w-3 h-3" />
              </button>

              {/* Tooltip */}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono text-white bg-black/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {icon.normalizedName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search Panel */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-white dark:bg-[hsl(0,0%,8%)] rounded-xl shadow-2xl border border-black/10 dark:border-white/10 max-h-[70vh] flex flex-col">
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
              <SearchIcon className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search icons..."
                className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No icons found" : "Type to search icons"}
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {searchResults.map((icon) => {
                    const isInBundle = iconIds.has(icon.id);
                    return (
                      <button
                        key={icon.id}
                        onClick={() => handleAddIcon(icon)}
                        disabled={isInBundle}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                          isInBundle
                            ? "bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/30 cursor-default"
                            : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/5"
                        }`}
                        title={icon.normalizedName}
                      >
                        {renderSearchIcon(icon)}
                        {isInBundle && (
                          <CheckIcon className="absolute top-1 right-1 w-3 h-3 text-[var(--accent-mint)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
