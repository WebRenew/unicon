/**
 * Re-export testable pure functions.
 * Centralizes imports so tests don't need complex path aliases.
 */
export { toPascalCase, getIconRenderMode } from "@/lib/icon-utils";
export { getSynonyms, expandQueryWithSynonyms, hasSynonyms } from "@/lib/synonyms";
export { getRateLimitHeaders } from "@/lib/rate-limit";
export { extractBearerToken } from "@/lib/auth/api-token";
