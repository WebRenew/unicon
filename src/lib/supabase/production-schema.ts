export const REQUIRED_SUPABASE_PATHS = [
  "/api_sessions",
  "/bundles",
  "/device_codes",
  "/profiles",
  "/stripe_webhook_events",
  "/subscriptions",
  "/team_invites",
  "/team_members",
  "/teams",
  "/rpc/accept_team_invite_atomic",
  "/rpc/authorize_device_code",
  "/rpc/check_device_code",
  "/rpc/create_api_token_direct",
  "/rpc/create_bundle_atomic",
  "/rpc/create_device_code",
  "/rpc/generate_invite_token",
  "/rpc/generate_share_slug",
  "/rpc/generate_team_slug",
  "/rpc/list_api_sessions",
  "/rpc/revoke_api_session",
  "/rpc/validate_api_token",
] as const;

interface SchemaCheckEnvironment {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ProductionSchemaCheckOptions {
  env?: SchemaCheckEnvironment;
  fetchImpl?: typeof fetch;
  requiredPaths?: readonly string[];
}

export interface ProductionSchemaCheckResult {
  checked: boolean;
  pathCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function checkProductionSupabaseSchema({
  env = process.env as SchemaCheckEnvironment,
  fetchImpl = fetch,
  requiredPaths = REQUIRED_SUPABASE_PATHS,
}: ProductionSchemaCheckOptions = {}): Promise<ProductionSchemaCheckResult> {
  if (env.VERCEL_ENV !== "production") {
    return { checked: false, pathCount: 0 };
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const missingEnvironmentVariables = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Production schema check is missing environment variables: ${missingEnvironmentVariables.join(", ")}`
    );
  }

  const schemaUrl = new URL("/rest/v1/", supabaseUrl);
  if (schemaUrl.protocol !== "https:") {
    throw new Error("Production Supabase URL must use HTTPS");
  }

  const response = await fetchImpl(schemaUrl, {
    headers: {
      Accept: "application/openapi+json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not read production Supabase schema: HTTP ${response.status}`);
  }

  let document: unknown;
  try {
    document = await response.json();
  } catch {
    throw new Error("Production Supabase schema response was not valid JSON");
  }

  if (!isRecord(document)) {
    throw new Error("Production Supabase schema response did not contain OpenAPI paths");
  }

  const paths = document.paths;
  if (!isRecord(paths)) {
    throw new Error("Production Supabase schema response did not contain OpenAPI paths");
  }

  const missingPaths = requiredPaths.filter((path) => !(path in paths));
  if (missingPaths.length > 0) {
    throw new Error(
      `Production Supabase schema is missing required paths: ${missingPaths.join(", ")}`
    );
  }

  return { checked: true, pathCount: requiredPaths.length };
}
