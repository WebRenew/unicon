/**
 * Script to update icon categories in the database.
 * Run with: npx tsx scripts/update-categories.ts
 */
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { icons } from "../src/lib/schema";
import { sql, like, or } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DASHBOARD_PATTERNS = [
  // Authentication
  "login",
  "logout",
  "log-in",
  "log-out",
  "sign-in",
  "sign-out",
  "signin",
  "signout",
  "password",
  "key",
  "lock",
  "unlock",
  "shield",
  "user",
  "users",
  "profile",
  "avatar",
  "account",
  // Settings & Config
  "setting",
  "settings",
  "gear",
  "cog",
  "config",
  "preference",
  "option",
  "tune",
  "slider",
  "toggle",
  "switch",
  // File Operations
  "upload",
  "download",
  "export",
  "import",
  "file",
  "folder",
  "document",
  "attachment",
  "clip",
  // Navigation & UI
  "dashboard",
  "home",
  "menu",
  "sidebar",
  "panel",
  "layout",
  "grid",
  "list",
  "table",
  "calendar",
  // Actions
  "save",
  "edit",
  "delete",
  "trash",
  "add",
  "plus",
  "remove",
  "minus",
  "refresh",
  "reload",
  "sync",
  "search",
  "filter",
  "sort",
  // Notifications
  "bell",
  "notification",
  "alert",
  "mail",
  "inbox",
  "message",
  // Analytics
  "chart",
  "graph",
  "analytics",
  "stats",
  "trending",
  "activity",
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  console.log("Updating icons to 'Dashboards' category...\n");

  // Build OR conditions for all patterns
  const conditions = DASHBOARD_PATTERNS.map((pattern) =>
    like(icons.normalizedName, `%${pattern}%`)
  );

  // First, let's see what we'll update
  const previewResults = await db
    .select({
      id: icons.id,
      normalizedName: icons.normalizedName,
      currentCategory: icons.category,
    })
    .from(icons)
    .where(or(...conditions))
    .limit(50);

  console.log(`Found ${previewResults.length}+ icons matching dashboard patterns:`);
  console.log("Sample:", previewResults.slice(0, 10).map((r) => r.normalizedName).join(", "));
  console.log();

  // Update all matching icons
  const result = await db
    .update(icons)
    .set({ category: "Dashboards" })
    .where(or(...conditions));

  console.log("Updated icons to 'Dashboards' category");

  // Verify
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(icons)
    .where(sql`${icons.category} = 'Dashboards'`);

  console.log(`\nTotal icons in 'Dashboards' category: ${countResult[0]?.count ?? 0}`);

  // Show all categories now
  const categories = await db
    .selectDistinct({ category: icons.category })
    .from(icons)
    .where(sql`${icons.category} IS NOT NULL`)
    .orderBy(icons.category);

  console.log("\nAll categories:");
  categories.forEach((c) => console.log(`  - ${c.category}`));

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
