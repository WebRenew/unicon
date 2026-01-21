"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { IconData } from "@/types/icon";

interface UseIconSearchOptions {
  initialIcons: IconData[];
  debounceMs?: number;
  /** Minimum local results before triggering API search */
  minLocalResults?: number;
}

interface UseIconSearchReturn {
  icons: IconData[];
  isSearching: boolean;
  searchType: "local" | "text" | "semantic";
  error: string | null;
  hasMore: boolean;
  search: (query: string, sourceId?: string) => void;
  loadMore: () => void;
  clearSearch: () => void;
}

/**
 * Score an icon against a search query using fuzzy matching.
 * Higher score = better match.
 */
function scoreIcon(icon: IconData, queryLower: string, queryTokens: string[]): number {
  const nameLower = icon.normalizedName.toLowerCase();
  const displayNameLower = icon.name.toLowerCase();
  
  let score = 0;
  
  // Exact match on normalized name - highest priority
  if (nameLower === queryLower) {
    score += 100;
  }
  // Starts with query - very high priority
  else if (nameLower.startsWith(queryLower)) {
    score += 80;
  }
  // Contains query as substring
  else if (nameLower.includes(queryLower)) {
    score += 50;
  }
  
  // Word boundary matching (e.g., "arrow" matches "arrow-right")
  const nameTokens = nameLower.split(/[-_\s]+/);
  for (const queryToken of queryTokens) {
    for (const nameToken of nameTokens) {
      if (nameToken === queryToken) {
        score += 30; // Exact word match
      } else if (nameToken.startsWith(queryToken)) {
        score += 20; // Word starts with query token
      }
    }
  }
  
  // Display name match (PascalCase)
  if (displayNameLower.includes(queryLower)) {
    score += 10;
  }
  
  // Tag matches
  for (const tag of icon.tags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === queryLower) {
      score += 25;
    } else if (tagLower.includes(queryLower)) {
      score += 15;
    }
    // Check individual query tokens against tags
    for (const queryToken of queryTokens) {
      if (tagLower === queryToken) {
        score += 15;
      } else if (tagLower.includes(queryToken)) {
        score += 8;
      }
    }
  }
  
  // Category match
  if (icon.category) {
    const categoryLower = icon.category.toLowerCase();
    if (categoryLower === queryLower) {
      score += 20;
    } else if (categoryLower.includes(queryLower)) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Perform fuzzy local search with scoring.
 */
function fuzzyLocalSearch(
  icons: IconData[],
  query: string,
  sourceId?: string
): IconData[] {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);
  
  const scored: Array<{ icon: IconData; score: number }> = [];
  
  for (const icon of icons) {
    // Filter by source if specified
    if (sourceId && icon.sourceId !== sourceId) {
      continue;
    }
    
    const score = scoreIcon(icon, queryLower, queryTokens);
    
    if (score > 0) {
      scored.push({ icon, score });
    }
  }
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored.map((s) => s.icon);
}

export function useIconSearch({
  initialIcons,
  debounceMs = 300,
  minLocalResults = 10,
}: UseIconSearchOptions): UseIconSearchReturn {
  const [icons, setIcons] = useState<IconData[]>(initialIcons);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"local" | "text" | "semantic">("local");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>("");
  const lastSourceRef = useRef<string | undefined>(undefined);

  const performSearch = useCallback(
    async (query: string, sourceId?: string, currentOffset: number = 0, append: boolean = false) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
      }

      const trimmedQuery = query.trim();

      // If empty query, reset to initial icons
      if (!trimmedQuery) {
        setIcons(initialIcons);
        setSearchType("local");
        setError(null);
        setIsSearching(false);
        setHasMore(false);
        setOffset(0);
        return;
      }

      // Always perform local fuzzy search first (optimistic UI) - but only on initial search
      if (currentOffset === 0) {
        const localResults = fuzzyLocalSearch(initialIcons, trimmedQuery, sourceId);
        setIcons(localResults);
        setSearchType("local");
        setError(null);
        setHasMore(false);

        // For very short queries or when we have enough local results, skip API
        const shouldSkipApi = trimmedQuery.length < 3 || localResults.length >= minLocalResults;

        if (shouldSkipApi) {
          setIsSearching(false);
          setOffset(0);
          return;
        }
      }

      // Trigger API search after a delay to allow local results to be seen
      setIsSearching(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Delay API call slightly so local results show first (only for initial search)
      const delay = currentOffset === 0 ? 100 : 0;
      apiTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: trimmedQuery,
              sourceId,
              limit: 100,
              offset: currentOffset,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }

          const data = await response.json();

          // Only update if this is still the current query
          if (lastQueryRef.current === query && lastSourceRef.current === sourceId) {
            if (append) {
              setIcons((prev) => [...prev, ...data.results]);
            } else {
              setIcons(data.results);
            }
            setSearchType(data.searchType === "semantic" ? "semantic" : "text");
            setHasMore(data.hasMore || false);
            setOffset(currentOffset + data.results.length);
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            // Request was cancelled, ignore
            return;
          }
          console.error("Search API error:", err);
          setError(err instanceof Error ? err.message : "Search failed");
          // Keep local results on error (already set above)
        } finally {
          setIsSearching(false);
        }
      }, delay);
    },
    [initialIcons, minLocalResults]
  );

  const search = useCallback(
    (query: string, sourceId?: string) => {
      lastQueryRef.current = query;
      lastSourceRef.current = sourceId;

      // Clear any pending debounced search
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset offset for new search
      setOffset(0);

      // Debounce the search
      timeoutRef.current = setTimeout(() => {
        performSearch(query, sourceId, 0, false);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  const loadMore = useCallback(() => {
    if (!isSearching && hasMore && lastQueryRef.current) {
      performSearch(lastQueryRef.current, lastSourceRef.current, offset, true);
    }
  }, [performSearch, offset, isSearching, hasMore]);

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (apiTimeoutRef.current) {
      clearTimeout(apiTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    lastQueryRef.current = "";
    lastSourceRef.current = undefined;
    setIcons(initialIcons);
    setSearchType("local");
    setError(null);
    setIsSearching(false);
    setHasMore(false);
    setOffset(0);
  }, [initialIcons]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    icons,
    isSearching,
    searchType,
    error,
    hasMore,
    search,
    loadMore,
    clearSearch,
  };
}
