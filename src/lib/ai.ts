/**
 * AI utilities for embedding generation and semantic search.
 * Uses Vercel AI SDK with AI Gateway for embeddings and Anthropic for chat.
 */
import { embed, embedMany, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const EMBEDDING_DIMENSIONS = 1536;

function getEmbeddingModel() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }

  const openai = createOpenAI({ apiKey });
  return openai.embedding("text-embedding-3-small");
}

function getChatModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const anthropic = createAnthropic({ apiKey });
  return anthropic("claude-sonnet-4-20250514");
}

/**
 * Use Claude to expand a user query into relevant icon search terms.
 * This helps find icons that match user intent even if they don't use exact names.
 */
export async function expandQueryWithAI(userQuery: string): Promise<string> {
  const model = getChatModel();
  
  const { text } = await generateText({
    model,
    system: `You are an icon search assistant. Given a user's query about icons they need, expand it into a comprehensive list of relevant icon names and concepts.

Rules:
- Output ONLY a space-separated list of lowercase words/terms
- Include the original query terms
- Add synonyms, related concepts, and specific icon names
- Think about what icons would visually represent the concept
- Keep it concise (max 20 terms)
- No punctuation, no explanations

Example:
User: "business icons"
Output: business briefcase chart graph money dollar finance office building presentation meeting handshake analytics growth profit`,
    prompt: userQuery,
  });

  return text.trim();
}

/**
 * Get embedding for a single text query.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text,
  });
  return embedding;
}

/**
 * Get embeddings for multiple texts in a batch.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: texts,
  });
  return embeddings;
}

/**
 * Convert embedding array to binary blob format (F32).
 */
export function embeddingToBlob(embedding: number[]): Buffer {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i] ?? 0, i * 4);
  }
  return buffer;
}

/**
 * Convert binary blob to embedding array.
 */
export function blobToEmbedding(blob: Buffer): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < blob.length; i += 4) {
    embedding.push(blob.readFloatLE(i));
  }
  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Convert embedding array to Turso vector format string.
 * Turso expects format like '[0.1, 0.2, 0.3, ...]'
 */
export function embeddingToVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export { EMBEDDING_DIMENSIONS };
