"use client";

import { useState, useEffect } from "react";
import { SearchFilters } from "./search-filters";
import { IconGrid } from "./icon-grid";
import { IconPreview } from "./icon-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useIconSearch } from "@/hooks/use-icon-search";
import type { IconData, IconLibrary } from "@/types/icon";

interface IconBrowserProps {
  icons: IconData[];
}

export function IconBrowser({ icons: initialIcons }: IconBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<IconLibrary | "all">("all");
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const {
    icons,
    isSearching,
    searchType,
    error,
    hasMore,
    search: performSearch,
    loadMore,
  } = useIconSearch({ initialIcons });

  // Trigger search when query or source changes
  useEffect(() => {
    const sourceId = selectedSource === "all" ? undefined : selectedSource;
    performSearch(search, sourceId);
  }, [search, selectedSource, performSearch]);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="pt-6 space-y-2">
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
            totalCount={initialIcons.length}
            filteredCount={icons.length}
          />
          
          {/* Search status indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSearching && (
              <span className="flex items-center gap-1">
                <span className="animate-pulse">●</span> Searching...
              </span>
            )}
            {!isSearching && search.length >= 3 && (
              <Badge variant="outline" className="text-[10px]">
                {searchType === "semantic" ? "🧠 AI Search" : "📝 Text Search"}
              </Badge>
            )}
            {error && (
              <span className="text-destructive">⚠️ {error}</span>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1 mt-4 -mx-1 px-1">
          <IconGrid
            icons={icons}
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
          />

          {/* Load More Button */}
          {hasMore && !isSearching && search.length >= 3 && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMore}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Load More
              </button>
            </div>
          )}

          {isSearching && icons.length > 0 && (
            <div className="flex justify-center py-8 text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="animate-pulse">●</span> Loading more...
              </span>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-0 h-[calc(100vh-12rem)] rounded-xl border bg-card">
          <IconPreview
            icon={selectedIcon}
            onClose={() => setSelectedIcon(null)}
          />
        </div>
      </div>
    </div>
  );
}
