import { ipAddress } from "@vercel/functions";

/**
 * Resolve a trusted client IP for rate-limiting.
 *
 * Intentionally does not use `x-forwarded-for`, which can be spoofed by clients.
 */
export function getTrustedClientIp(request: Request): string {
  return ipAddress(request) ?? "unknown";
}
