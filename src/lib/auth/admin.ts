import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Require ADMIN_SECRET-backed Bearer auth for admin routes.
 * Returns an error response when auth fails, otherwise null.
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const adminSecret = process.env.ADMIN_SECRET;

  // Fail closed if admin auth is not configured.
  if (!adminSecret) {
    logger.error("ADMIN_SECRET is not configured for admin route access");
    return NextResponse.json(
      { error: "Admin authentication is not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providedTokenBuffer = Buffer.from(token, "utf8");
  const adminSecretBuffer = Buffer.from(adminSecret, "utf8");

  const isValid =
    providedTokenBuffer.length === adminSecretBuffer.length &&
    timingSafeEqual(providedTokenBuffer, adminSecretBuffer);

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
