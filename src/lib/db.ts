import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function getDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN environment variable is required");
  }

  return createClient({ url, authToken });
}

const client = getDbClient();

export const db = drizzle(client, { schema });
