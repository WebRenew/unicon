/**
 * AI utilities for embedding generation and semantic search.
 * Uses Vercel AI SDK with AI Gateway for embeddings and Anthropic for chat.
 */
import { embed, embedMany, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const EMBEDDING_DIMENSIONS = 3072; // text-embedding-3-large

// In-memory caches to reduce API calls
const queryExpansionCache = new Map<string, string>();
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 1000;

// Search results cache with TTL
interface CachedSearchResult<T> {
  data: T;
  timestamp: number;
}

const searchResultsCache = new Map<string, CachedSearchResult<unknown>>();
const SEARCH_CACHE_TTL = 60 * 1000; // 60 seconds
const MAX_SEARCH_CACHE_SIZE = 500;

// Simple cache cleanup
function pruneCache<T>(cache: Map<string, T>) {
  if (cache.size > MAX_CACHE_SIZE) {
    // Remove oldest 20% of entries
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const keys = Array.from(cache.keys()).slice(0, toRemove);
    keys.forEach(key => cache.delete(key));
  }
}

// Cache cleanup with TTL support
function pruneSearchCache() {
  if (searchResultsCache.size > MAX_SEARCH_CACHE_SIZE) {
    // Remove oldest 20% of entries
    const toRemove = Math.floor(MAX_SEARCH_CACHE_SIZE * 0.2);
    const keys = Array.from(searchResultsCache.keys()).slice(0, toRemove);
    keys.forEach(key => searchResultsCache.delete(key));
  }
}

function getEmbeddingModel() {
  // Support multiple providers:
  // - Vercel AI Gateway (vck_*) - only works on Vercel
  // - OpenAI (sk-*) - for local development
  // - OpenRouter (sk-or-*) - alternative provider
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterBaseUrl = process.env.OPENROUTER_BASE_URL;

  const apiKey = openaiKey || gatewayKey;
  if (!apiKey) {
    throw new Error("Either OPENAI_API_KEY or AI_GATEWAY_API_KEY must be configured");
  }

  // Determine baseURL and model based on provider
  let config: { apiKey: string; baseURL?: string };
  let modelId: string;

  if (gatewayKey && !openaiKey) {
    // Vercel AI Gateway
    config = { apiKey, baseURL: "https://ai-gateway.vercel.sh/v3/ai" };
    modelId = "openai/text-embedding-3-large";
  } else if (openrouterBaseUrl && openaiKey?.startsWith("sk-or-")) {
    // OpenRouter
    config = { apiKey, baseURL: openrouterBaseUrl };
    modelId = "text-embedding-3-large";
  } else {
    // Regular OpenAI
    config = { apiKey };
    modelId = "text-embedding-3-large";
  }

  const openai = createOpenAI(config);
  return openai.embedding(modelId);
}

function getChatModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const anthropic = createAnthropic({ apiKey });
  return anthropic("claude-sonnet-4-20250514");
}

/**
 * Use Claude to expand a user query into relevant icon search terms.
 * This helps find icons that match user intent even if they don't use exact names.
 * Results are cached to reduce API calls.
 */
export async function expandQueryWithAI(userQuery: string): Promise<string> {
  // Check cache first
  const cacheKey = userQuery.toLowerCase().trim();
  const cached = queryExpansionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const model = getChatModel();

  const { text } = await generateText({
    model,
    system: `You are an icon search assistant. Given a user's query about icons they need, expand it into a comprehensive list of relevant icon names and concepts.

Rules:
- Output ONLY a space-separated list of lowercase words/terms
- Include the original query terms
- Add synonyms, related concepts, and specific icon names
- Think about what icons would visually represent the concept
- Keep it concise (max 20 terms)
- No punctuation, no explanations

Example:
User: "business icons"
Output: business briefcase chart graph money dollar finance office building presentation meeting handshake analytics growth profit`,
    prompt: userQuery,
  });

  const result = text.trim();

  // Cache the result
  queryExpansionCache.set(cacheKey, result);
  pruneCache(queryExpansionCache);

  return result;
}

/**
 * Get embedding for a single text query.
 * Results are cached to reduce API calls.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const model = getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text,
  });

  // Cache the result
  embeddingCache.set(cacheKey, embedding);
  pruneCache(embeddingCache);

  return embedding;
}

/**
 * Get embeddings for multiple texts in a batch.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: texts,
  });
  return embeddings;
}

/**
 * Convert embedding array to binary blob format (F32).
 */
export function embeddingToBlob(embedding: number[]): Buffer {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i] ?? 0, i * 4);
  }
  return buffer;
}


/**
 * Convert embedding array to Turso vector format string.
 * Turso expects format like '[0.1, 0.2, 0.3, ...]'
 */
export function embeddingToVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Generate a cache key for search results based on query parameters.
 */
export function generateSearchCacheKey(params: {
  query: string;
  sourceId?: string;
  limit: number;
  offset: number;
}): string {
  return `search:${params.query.toLowerCase().trim()}:${params.sourceId || "all"}:${params.limit}:${params.offset}`;
}

/**
 * Get cached search results if available and not expired.
 */
export function getCachedSearchResults<T>(cacheKey: string): T | null {
  const cached = searchResultsCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  // Check if expired
  const age = Date.now() - cached.timestamp;
  if (age > SEARCH_CACHE_TTL) {
    searchResultsCache.delete(cacheKey);
    return null;
  }

  return cached.data as T;
}

/**
 * Cache search results with current timestamp.
 */
export function setCachedSearchResults<T>(cacheKey: string, data: T): void {
  searchResultsCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  pruneSearchCache();
}

/**
 * Clear all search result caches (useful after data updates).
 */
export function clearSearchCache(): void {
  searchResultsCache.clear();
}

/**
 * Get cache statistics for monitoring.
 */
export function getCacheStats() {
  return {
    searchResults: {
      size: searchResultsCache.size,
      maxSize: MAX_SEARCH_CACHE_SIZE,
    },
    embeddings: {
      size: embeddingCache.size,
      maxSize: MAX_CACHE_SIZE,
    },
    queryExpansions: {
      size: queryExpansionCache.size,
      maxSize: MAX_CACHE_SIZE,
    },
  };
}

export { EMBEDDING_DIMENSIONS };
