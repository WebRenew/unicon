import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local for drizzle-kit commands
config({ path: ".env.local" });

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is required");
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN is required");
}

export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
