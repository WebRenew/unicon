"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { IconData } from "@/types/icon";

interface SearchResult extends IconData {
  score: number;
}

interface UseIconSearchOptions {
  initialIcons: IconData[];
  debounceMs?: number;
}

interface UseIconSearchReturn {
  icons: IconData[];
  isSearching: boolean;
  searchType: "local" | "text" | "semantic";
  error: string | null;
  search: (query: string, sourceId?: string) => void;
  clearSearch: () => void;
}

export function useIconSearch({
  initialIcons,
  debounceMs = 300,
}: UseIconSearchOptions): UseIconSearchReturn {
  const [icons, setIcons] = useState<IconData[]>(initialIcons);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"local" | "text" | "semantic">("local");
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>("");
  const lastSourceRef = useRef<string | undefined>(undefined);

  const performSearch = useCallback(
    async (query: string, sourceId?: string) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmedQuery = query.trim();

      // If empty query, reset to initial icons
      if (!trimmedQuery) {
        setIcons(initialIcons);
        setSearchType("local");
        setError(null);
        return;
      }

      // For very short queries, filter locally
      if (trimmedQuery.length < 3) {
        const filtered = initialIcons.filter((icon) => {
          const matchesQuery =
            icon.normalizedName.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            icon.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            icon.tags.some((tag) => tag.toLowerCase().includes(trimmedQuery.toLowerCase()));
          const matchesSource = !sourceId || icon.sourceId === sourceId;
          return matchesQuery && matchesSource;
        });
        setIcons(filtered);
        setSearchType("local");
        setError(null);
        return;
      }

      // Perform API search
      setIsSearching(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmedQuery, sourceId, limit: 100 }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setIcons(data.results);
        setSearchType(data.searchType === "semantic" ? "semantic" : "text");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        // Fall back to local filtering on error
        const filtered = initialIcons.filter((icon) => {
          const matchesQuery =
            icon.normalizedName.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            icon.name.toLowerCase().includes(trimmedQuery.toLowerCase());
          const matchesSource = !sourceId || icon.sourceId === sourceId;
          return matchesQuery && matchesSource;
        });
        setIcons(filtered);
        setSearchType("local");
      } finally {
        setIsSearching(false);
      }
    },
    [initialIcons]
  );

  const search = useCallback(
    (query: string, sourceId?: string) => {
      lastQueryRef.current = query;
      lastSourceRef.current = sourceId;

      // Clear any pending debounced search
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the search
      timeoutRef.current = setTimeout(() => {
        performSearch(query, sourceId);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    lastQueryRef.current = "";
    lastSourceRef.current = undefined;
    setIcons(initialIcons);
    setSearchType("local");
    setError(null);
  }, [initialIcons]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
    search,
    clearSearch,
  };
}
