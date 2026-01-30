import type { CSSProperties } from "react";
import { ChevronLeftIcon } from "@/components/icons/ui/chevron-left";
import { ChevronRightIcon } from "@/components/icons/ui/chevron-right";
import { Loader2Icon } from "@/components/icons/ui/loader-2";
import { StyledIcon } from "./styled-icon";
import type { IconData } from "@/types/icon";

interface MetallicIconBrowserResultsProps {
  isLoading: boolean;
  icons: IconData[];
  iconsToShow: IconData[];
  gridStyle: CSSProperties;
  cartItemIds: Set<string>;
  onToggleCart: (icon: IconData) => void;
  strokeWeight: number;
  iconSize: number;
  containerSize: number;
  page: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  onHoverSource?: (source: string | null) => void;
}

function getVisiblePages(page: number, totalPages: number): number[] {
  if (totalPages <= 0) return [];

  const pageCount = Math.min(5, totalPages);
  const pages: number[] = [];

  for (let i = 0; i < pageCount; i += 1) {
    if (totalPages <= 5) {
      pages.push(i);
    } else if (page < 3) {
      pages.push(i);
    } else if (page > totalPages - 4) {
      pages.push(totalPages - 5 + i);
    } else {
      pages.push(page - 2 + i);
    }
  }

  return pages;
}

export function MetallicIconBrowserResults({
  isLoading,
  icons,
  iconsToShow,
  gridStyle,
  cartItemIds,
  onToggleCart,
  strokeWeight,
  iconSize,
  containerSize,
  page,
  totalPages,
  totalResults,
  onPageChange,
  onHoverSource,
}: MetallicIconBrowserResultsProps) {
  return (
    <>
      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-black/40 dark:text-white/40 text-xs">
          Page {page + 1} of {totalPages} • {totalResults.toLocaleString("en-US")} icons
          {isLoading && <Loader2Icon className="inline ml-2 w-3 h-3 animate-spin" />}
        </p>
      </div>

      {/* Icon Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="w-8 h-8 text-black/40 dark:text-white/40 animate-spin" />
        </div>
      ) : icons.length > 0 ? (
        <>
          <div
            className="grid gap-3"
            style={gridStyle}
          >
            {iconsToShow.map((icon) => (
              <StyledIcon
                key={icon.id}
                icon={icon}
                style="metal"
                isSelected={cartItemIds.has(icon.id)}
                onToggleCart={onToggleCart}
                strokeWeight={strokeWeight}
                iconSize={iconSize}
                containerSize={containerSize}
                onHoverSource={onHoverSource}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              aria-label="Go to previous page"
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Prev
            </button>

            <div className="flex gap-1">
              {getVisiblePages(page, totalPages).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Go to page ${pageNum + 1}`}
                  aria-current={pageNum === page ? "page" : undefined}
                  className={`w-9 h-9 text-sm font-mono rounded-lg transition-colors ${pageNum === page
                    ? "bg-black/20 dark:bg-white/20 text-black dark:text-white"
                    : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
                    }`}
                >
                  {pageNum + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              aria-label="Go to next page"
              className="flex items-center gap-1 px-3 py-2 text-sm font-mono rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4 opacity-50" aria-hidden="true">🔍</div>
          <h3 className="text-lg font-medium text-black/60 dark:text-white/60">No icons found</h3>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </>
  );
}
