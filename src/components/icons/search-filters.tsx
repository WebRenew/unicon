"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { IconLibrary } from "@/types/icon";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedSource: IconLibrary | "all";
  onSourceChange: (source: IconLibrary | "all") => void;
  totalCount: number;
  filteredCount: number;
}

// Move constant data outside component to prevent recreation on every render
const SOURCES: { id: IconLibrary | "all"; name: string; color: string }[] = [
  { id: "all", name: "All", color: "bg-foreground/10 text-foreground hover:bg-foreground/20" },
  { id: "lucide", name: "Lucide", color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" },
  { id: "phosphor", name: "Phosphor", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
  { id: "hugeicons", name: "Huge Icons", color: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
  { id: "heroicons", name: "Heroicons", color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" },
  { id: "tabler", name: "Tabler Icons", color: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20" },
  { id: "feather", name: "Feather Icons", color: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20" },
  { id: "remix", name: "Remix Icon", color: "bg-red-500/10 text-red-600 hover:bg-red-500/20" },
  { id: "simple-icons", name: "Simple Icons", color: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20" },
];

export function SearchFilters({
  search,
  onSearchChange,
  selectedSource,
  onSourceChange,
  totalCount,
  filteredCount,
}: SearchFiltersProps) {
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleSourceClick = useCallback((sourceId: IconLibrary | "all") => {
    onSourceChange(sourceId);
  }, [onSourceChange]);
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
          🔍
        </span>
        <label htmlFor="icon-search" className="sr-only">Search icons</label>
        <Input
          id="icon-search"
          type="search"
          placeholder="Search icons…"
          value={search}
          onChange={handleSearchChange}
          className="pl-10 h-12 text-base"
          autoComplete="off"
        />
      </div>

      {/* Source Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {SOURCES.map((src) => (
          <button
            key={src.id}
            onClick={() => handleSourceClick(src.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedSource === src.id
                ? cn(src.color, "ring-2 ring-offset-2 ring-offset-background ring-current")
                : cn(src.color, "opacity-60 hover:opacity-100")
            )}
          >
            {src.name}
          </button>
        ))}

        <span className="sm:ml-auto text-sm text-muted-foreground w-full sm:w-auto text-left sm:text-right">
          {filteredCount === totalCount
            ? `${totalCount.toLocaleString()} icons`
            : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
