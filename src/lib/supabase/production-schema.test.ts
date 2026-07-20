import { describe, expect, it, vi } from "vitest";
import {
  collectStaticSupabasePathsFromSource,
  findMissingSupabaseContractPaths,
} from "../../../scripts/lib/supabase-source-contract";
import { checkProductionSupabaseSchema } from "./production-schema";

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

describe("Supabase source contract scanner", () => {
  it("collects multiline and static template-literal arguments", () => {
    const paths = collectStaticSupabasePathsFromSource(`
      supabase.from(
        "multiline_table"
      );
      supabase.rpc(\`static_rpc\`);
    `);

    expect([...paths].sort()).toEqual(["/multiline_table", "/rpc/static_rpc"]);
  });

  it.each([
    ["a variable", 'const table = "profiles"; supabase.from(table);', ".from()"],
    ["an interpolated template", "supabase.rpc(`lookup_${kind}`);", ".rpc()"],
  ])("fails closed when a Supabase call uses %s", (_description, source, method) => {
    expect(() => collectStaticSupabasePathsFromSource(source, "dynamic-call.ts")).toThrow(
      `Supabase ${method} in dynamic-call.ts:1 must use a static string literal`
    );
  });

  it("reports source paths that are absent from the required contract", () => {
    expect(
      findMissingSupabaseContractPaths(
        new Set(["/profiles", "/rpc/missing_rpc", "/missing_table"]),
        ["/profiles"]
      )
    ).toEqual(["/missing_table", "/rpc/missing_rpc"]);
  });
});

describe("checkProductionSupabaseSchema", () => {
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
