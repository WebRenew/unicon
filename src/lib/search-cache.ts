/**
 * Simple in-memory cache for search results
 * Reduces unnecessary API calls when user re-searches or navigates back
 */

import type { IconData } from "@/types/icon";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SearchCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number; // Time to live in milliseconds
  private readonly maxSize: number;

  constructor(ttl: number = 5 * 60 * 1000, maxSize: number = 100) {
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  /**
   * Generate a cache key from search parameters
   */
  private generateKey(params: Record<string, string | number | undefined>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get(params: Record<string, string | number | undefined>): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache data
   */
  set(params: Record<string, string | number | undefined>, data: T): void {
    const key = this.generateKey(params);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance for icon search results
export const iconSearchCache = new SearchCache<{
  icons: IconData[];
  searchType?: string;
  expandedQuery?: string | null;
  hasMore: boolean;
}>(5 * 60 * 1000, 100); // 5 minute TTL, 100 max entries
