import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  checkProductionSupabaseSchema,
  REQUIRED_SUPABASE_PATHS,
} from "./production-schema";

function createSchemaResponse(paths: string[], status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue({
      paths: Object.fromEntries(paths.map((path) => [path, {}])),
    }),
  } as unknown as Response;
}

const productionEnvironment = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

describe("checkProductionSupabaseSchema", () => {
  it("covers every Supabase table and RPC referenced by application code", () => {
    const storageBuckets = new Set(["team-logos"]);
    const sourceFiles: string[] = [];
    const collectSourceFiles = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          collectSourceFiles(path);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
          sourceFiles.push(path);
        }
      }
    };
    collectSourceFiles(join(process.cwd(), "src"));

    const runtimePaths = new Set<string>();
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\.from\(["']([^"']+)["']\)/g)) {
        const table = match[1];
        if (table && !storageBuckets.has(table)) {
          runtimePaths.add(`/${table}`);
        }
      }
      for (const match of source.matchAll(/\.rpc\(["']([^"']+)["']/g)) {
        const rpc = match[1];
        if (rpc) {
          runtimePaths.add(`/rpc/${rpc}`);
        }
      }
    }

    const requiredPaths = new Set<string>(REQUIRED_SUPABASE_PATHS);
    const missingContractPaths = [...runtimePaths].filter((path) => !requiredPaths.has(path)).sort();
    expect(missingContractPaths).toEqual([]);
  });

  it("skips live schema access outside production deployments", async () => {
    const fetchImpl = vi.fn();

    await expect(
      checkProductionSupabaseSchema({
        env: { VERCEL_ENV: "preview" },
        fetchImpl,
      })
    ).resolves.toEqual({ checked: false, pathCount: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires the production Supabase environment variables", async () => {
    await expect(
      checkProductionSupabaseSchema({
        env: { VERCEL_ENV: "production" },
      })
    ).rejects.toThrow(
      "Production schema check is missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  });

  it("validates required paths using the server-only credential", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(createSchemaResponse(["/subscriptions", "/stripe_webhook_events"]));

    await expect(
      checkProductionSupabaseSchema({
        env: productionEnvironment,
        fetchImpl,
        requiredPaths: ["/subscriptions", "/stripe_webhook_events"],
      })
    ).resolves.toEqual({ checked: true, pathCount: 2 });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const firstCall = fetchImpl.mock.calls[0];
    if (!firstCall) {
      throw new Error("Expected schema fetch call");
    }
    const [url, init] = firstCall;
    expect(String(url)).toBe("https://project.supabase.co/rest/v1/");
    const headers = new Headers(init?.headers);
    expect(headers.get("accept")).toBe("application/openapi+json");
    expect(headers.get("authorization")).toBe("Bearer service-role-key");
    expect(headers.get("apikey")).toBe("service-role-key");
  });

  it("fails with every missing table or RPC path", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createSchemaResponse(["/subscriptions"]));

    await expect(
      checkProductionSupabaseSchema({
        env: productionEnvironment,
        fetchImpl,
        requiredPaths: [
          "/subscriptions",
          "/stripe_webhook_events",
          "/rpc/accept_team_invite_atomic",
        ],
      })
    ).rejects.toThrow(
      "Production Supabase schema is missing required paths: /stripe_webhook_events, /rpc/accept_team_invite_atomic"
    );
  });

  it("fails closed when the live schema cannot be read", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createSchemaResponse([], 503));

    await expect(
      checkProductionSupabaseSchema({
        env: productionEnvironment,
        fetchImpl,
      })
    ).rejects.toThrow("Could not read production Supabase schema: HTTP 503");
  });
});
