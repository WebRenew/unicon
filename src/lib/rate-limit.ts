/**
 * Rate Limiting with Upstash Redis
 * 
 * Different limits for free vs Pro users:
 * - Free: 10 requests per minute
 * - Pro: 100 requests per minute
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (uses Vercel KV env vars)
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Rate limiter for free users: 10 requests per minute
export const freeTierLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:free",
});

// Rate limiter for Pro users: 100 requests per minute  
export const proTierLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:pro",
});

// Rate limiter for public/anonymous API access: 60 requests per minute per IP
export const publicLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "ratelimit:public",
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
  userId: string,
  isPro: boolean
): Promise<RateLimitResult> {
  const limiter = isPro ? proTierLimiter : freeTierLimiter;
  
  try {
    const result = await limiter.limit(userId);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If rate limiting fails (e.g., Redis unavailable), allow the request
    console.error("Rate limit check failed:", error);
    return {
      success: true,
      limit: isPro ? 100 : 10,
      remaining: 1,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Check rate limit for a public (unauthenticated) request by IP
 */
export async function checkPublicRateLimit(
  ip: string
): Promise<RateLimitResult> {
  try {
    const result = await publicLimiter.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If rate limiting fails (e.g., Redis unavailable), allow the request
    console.error("Public rate limit check failed:", error);
    return {
      success: true,
      limit: 60,
      remaining: 1,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
