/**
 * Generate embeddings for icons using Vercel AI SDK.
 * 
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *   npx tsx scripts/generate-embeddings.ts --source lucide
 *   npx tsx scripts/generate-embeddings.ts --batch-size 50
 *   npx tsx scripts/generate-embeddings.ts --stats
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Load .env.local
config({ path: ".env.local" });

const BATCH_SIZE = 100;

function getEmbeddingModel() {
  // Support both Vercel AI Gateway (vck_*) and regular OpenAI keys (sk-*)
  // Vercel gateway keys only work when deployed on Vercel
  // For local development, set OPENAI_API_KEY in .env.local
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const apiKey = openaiKey || gatewayKey;
  if (!apiKey) {
    throw new Error("Either OPENAI_API_KEY or AI_GATEWAY_API_KEY must be set");
  }

  const openai = createOpenAI({ apiKey });
  return openai.embedding("text-embedding-3-small");
}

interface IconRow {
  id: string;
  name: string;
  normalized_name: string;
  category: string | null;
  tags: string | null;
}

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find((a) => a.startsWith("--source="))?.split("=")[1];
  const batchArg = args.find((a) => a.startsWith("--batch-size="))?.split("=")[1];
  const showStats = args.includes("--stats");

  const batchSize = batchArg ? parseInt(batchArg, 10) : BATCH_SIZE;

  // Validate env vars
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
    console.error("Error: Either OPENAI_API_KEY or AI_GATEWAY_API_KEY must be set");
    console.error("  For local development: Add OPENAI_API_KEY to .env.local");
    console.error("  For Vercel deployment: Use AI_GATEWAY_API_KEY (vck_*)");
    process.exit(1);
  }

  // Connect to database
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Show stats only
  if (showStats) {
    await showEmbeddingStats(client);
    return;
  }

  console.log("\n" + "=".repeat(50));
  console.log("Generating embeddings with Vercel AI SDK");
  console.log("=".repeat(50));
  console.log(`Source: ${sourceArg || "all"}`);
  console.log(`Batch size: ${batchSize}`);
  console.log();

  const embeddingModel = getEmbeddingModel();
  let totalProcessed = 0;

  // Process in batches
  while (true) {
    // Get icons without embeddings
    const icons = await getIconsWithoutEmbeddings(client, sourceArg, batchSize);
    
    if (icons.length === 0) {
      break;
    }

    // Build search texts
    const searchTexts = icons.map(buildSearchText);

    // Get embeddings
    console.log(`  Generating embeddings for ${icons.length} icons...`);
    
    try {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: searchTexts,
      });

      // Store in database
      for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        const embedding = embeddings[i];
        
        if (!icon || !embedding) continue;
        
        await updateIconEmbedding(client, icon.id, searchTexts[i] ?? "", embedding);
      }

      totalProcessed += icons.length;
      console.log(`  Progress: ${totalProcessed} icons processed`);
    } catch (error) {
      console.error("Error generating embeddings:", error);
      process.exit(1);
    }
  }

  console.log(`\n✓ Generated embeddings for ${totalProcessed} icons`);

  // Show final stats
  await showEmbeddingStats(client);

  client.close();
}

async function getIconsWithoutEmbeddings(
  client: ReturnType<typeof createClient>,
  sourceId: string | undefined,
  limit: number
): Promise<IconRow[]> {
  const query = sourceId
    ? `SELECT id, name, normalized_name, category, tags 
       FROM icons 
       WHERE embedding IS NULL AND source_id = ? 
       LIMIT ?`
    : `SELECT id, name, normalized_name, category, tags 
       FROM icons 
       WHERE embedding IS NULL 
       LIMIT ?`;

  const args = sourceId ? [sourceId, limit] : [limit];
  const result = await client.execute({ sql: query, args });

  return result.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    normalized_name: row.normalized_name as string,
    category: row.category as string | null,
    tags: row.tags as string | null,
  }));
}

function buildSearchText(icon: IconRow): string {
  const parts: string[] = [];

  // Add normalized name (split kebab-case into words)
  const nameWords = icon.normalized_name.replace(/-/g, " ");
  parts.push(nameWords);

  // Add category if present
  if (icon.category) {
    parts.push(icon.category);
  }

  // Add tags
  if (icon.tags) {
    try {
      const tags = JSON.parse(icon.tags) as string[];
      parts.push(...tags);
    } catch {
      // Ignore parse errors
    }
  }

  // Deduplicate and join
  const unique = [...new Set(parts)];
  return unique.join(" ");
}

function embeddingToBlob(embedding: number[]): Buffer {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i] ?? 0, i * 4);
  }
  return buffer;
}

async function updateIconEmbedding(
  client: ReturnType<typeof createClient>,
  iconId: string,
  searchText: string,
  embedding: number[]
): Promise<void> {
  const blob = embeddingToBlob(embedding);

  await client.execute({
    sql: `UPDATE icons SET search_text = ?, embedding = ? WHERE id = ?`,
    args: [searchText, blob, iconId],
  });
}

async function showEmbeddingStats(client: ReturnType<typeof createClient>): Promise<void> {
  const result = await client.execute(`
    SELECT 
      source_id,
      COUNT(*) as total,
      SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding
    FROM icons
    GROUP BY source_id
  `);

  console.log("\nEmbedding Statistics:");
  console.log("=".repeat(50));

  for (const row of result.rows) {
    const sourceId = row.source_id as string;
    const total = row.total as number;
    const withEmbedding = row.with_embedding as number;
    const pct = total > 0 ? ((withEmbedding / total) * 100).toFixed(1) : "0.0";
    console.log(`  ${sourceId}: ${withEmbedding}/${total} (${pct}%)`);
  }
}

main().catch(console.error);
