"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IconLibrary } from "@/types/icon";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedLibrary: IconLibrary | "all";
  onLibraryChange: (library: IconLibrary | "all") => void;
  totalCount: number;
  filteredCount: number;
}

const libraries: { id: IconLibrary | "all"; name: string; color: string }[] = [
  { id: "all", name: "All", color: "bg-foreground/10 text-foreground hover:bg-foreground/20" },
  { id: "lucide", name: "Lucide", color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" },
  { id: "phosphor", name: "Phosphor", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
  { id: "hugeicons", name: "Huge Icons", color: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
];

export function SearchFilters({
  search,
  onSearchChange,
  selectedLibrary,
  onLibraryChange,
  totalCount,
  filteredCount,
}: SearchFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          🔍
        </span>
        <Input
          type="search"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Library Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {libraries.map((lib) => (
          <button
            key={lib.id}
            onClick={() => onLibraryChange(lib.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all",
              selectedLibrary === lib.id
                ? cn(lib.color, "ring-2 ring-offset-2 ring-offset-background ring-current")
                : cn(lib.color, "opacity-60 hover:opacity-100")
            )}
          >
            {lib.name}
          </button>
        ))}
        
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredCount === totalCount
            ? `${totalCount.toLocaleString()} icons`
            : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
