"use client";

import { useState, useMemo } from "react";
import { SearchFilters } from "./search-filters";
import { IconGrid } from "./icon-grid";
import { IconPreview } from "./icon-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IconData, IconLibrary } from "@/types/icon";

interface IconBrowserProps {
  icons: IconData[];
}

export function IconBrowser({ icons }: IconBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibrary | "all">("all");
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesSearch =
        search === "" ||
        icon.name.toLowerCase().includes(search.toLowerCase()) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesLibrary = selectedLibrary === "all" || icon.libraryId === selectedLibrary;

      return matchesSearch && matchesLibrary;
    });
  }, [icons, search, selectedLibrary]);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <SearchFilters
          search={search}
          onSearchChange={setSearch}
          selectedLibrary={selectedLibrary}
          onLibraryChange={setSelectedLibrary}
          totalCount={icons.length}
          filteredCount={filteredIcons.length}
        />
        
        <ScrollArea className="flex-1 mt-6 -mx-1 px-1">
          <IconGrid
            icons={filteredIcons}
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
          />
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
