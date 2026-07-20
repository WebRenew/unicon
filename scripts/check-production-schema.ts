import {
  collectSupabaseSchemaPaths,
  findMissingSupabaseContractPaths,
} from "./lib/supabase-source-contract";
import {
  checkProductionSupabaseSchema,
  REQUIRED_SUPABASE_PATHS,
} from "../src/lib/supabase/production-schema";

async function main() {
  const sourcePaths = collectSupabaseSchemaPaths(process.cwd());
  const missingContractPaths = findMissingSupabaseContractPaths(
    sourcePaths,
    REQUIRED_SUPABASE_PATHS
  );
  if (missingContractPaths.length > 0) {
    throw new Error(
      `Supabase source contract is missing required paths: ${missingContractPaths.join(", ")}`
    );
  }

  console.log(`Supabase source contract check passed (${sourcePaths.size} paths).`);

  const result = await checkProductionSupabaseSchema();

  if (!result.checked) {
    console.log("Production Supabase schema check skipped outside Vercel production.");
    return;
  }

  console.log(`Production Supabase schema check passed (${result.pathCount} paths).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown production schema check error";
  console.error(message);
  process.exitCode = 1;
});
