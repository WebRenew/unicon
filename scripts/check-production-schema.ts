import { checkProductionSupabaseSchema } from "../src/lib/supabase/production-schema";

async function main() {
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
