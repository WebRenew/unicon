/**
 * AI utilities for embedding generation and semantic search.
 * Uses Vercel AI SDK with AI Gateway.
 */
import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const EMBEDDING_DIMENSIONS = 1536;

function getEmbeddingModel() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }

  const openai = createOpenAI({ apiKey });
  return openai.embedding("text-embedding-3-small");
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

export { EMBEDDING_DIMENSIONS };
