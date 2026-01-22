import { db } from "./db";
import { icons, sources } from "./schema";
import { eq, like, or, sql, asc } from "drizzle-orm";
import type { IconData, SourceData } from "@/types/icon";

/**
 * Get all icon sources with their stats.
 */
export async function getSources(): Promise<SourceData[]> {
  const results = await db.select().from(sources).orderBy(asc(sources.name));
  return results.map((s) => ({
    id: s.id,
    name: s.name,
    version: s.version,
    license: s.license,
    totalIcons: s.totalIcons,
    extractedAt: s.extractedAt,
  }));
}

/**
 * Build search conditions for reuse between searchIcons and getSearchCount.
 */
function buildSearchConditions(params: {
  query?: string;
  sourceId?: string;
  category?: string;
}) {
  const { query, sourceId, category } = params;
  const conditions = [];

  if (sourceId) {
    conditions.push(eq(icons.sourceId, sourceId));
  }

  if (category) {
    conditions.push(eq(icons.category, category));
  }

  if (query && query.trim()) {
    const searchTerm = `%${query.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${icons.normalizedName})`, searchTerm),
        like(sql`lower(${icons.name})`, searchTerm),
        like(sql`lower(${icons.tags})`, searchTerm)
      )
    );
  }

  return conditions;
}

/**
 * Search icons with optional filters.
 * Uses a lightweight select to avoid fetching embeddings and pathData.
 */
export async function searchIcons(params: {
  query?: string;
  sourceId?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<IconData[]> {
  const { limit = 100, offset = 0 } = params;
  const conditions = buildSearchConditions(params);

  // Select only the fields needed for display (skip embedding, pathData)
  const results = await db
    .select({
      id: icons.id,
      name: icons.name,
      normalizedName: icons.normalizedName,
      sourceId: icons.sourceId,
      category: icons.category,
      tags: icons.tags,
      viewBox: icons.viewBox,
      content: icons.content,
      defaultStroke: icons.defaultStroke,
      defaultFill: icons.defaultFill,
      strokeWidth: icons.strokeWidth,
      brandColor: icons.brandColor,
    })
    .from(icons)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(asc(icons.normalizedName))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    sourceId: row.sourceId,
    category: row.category,
    tags: (row.tags as string[]) ?? [],
    viewBox: row.viewBox,
    content: row.content,
    pathData: null,
    defaultStroke: row.defaultStroke ?? false,
    defaultFill: row.defaultFill ?? false,
    strokeWidth: row.strokeWidth,
    brandColor: row.brandColor ?? null,
  }));
}

/**
 * Get total count of icons matching search criteria.
 * Used for accurate pagination metadata.
 */
export async function getSearchCount(params: {
  query?: string;
  sourceId?: string;
  category?: string;
}): Promise<number> {
  const conditions = buildSearchConditions(params);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(icons)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);

  return result[0]?.count ?? 0;
}

/**
 * Get a single icon by ID.
 */
export async function getIconById(id: string): Promise<IconData | null> {
  const results = await db.select().from(icons).where(eq(icons.id, id)).limit(1);

  const first = results[0];
  if (!first) {
    return null;
  }

  return mapIconRow(first);
}

/**
 * Get icons by their normalized names (for starter packs).
 * Returns icons matching any of the provided names.
 */
export async function getIconsByNames(names: string[]): Promise<IconData[]> {
  if (names.length === 0) return [];

  // Normalize names for matching
  const normalizedNames = names.map((n) => n.toLowerCase());

  // Use SQL IN clause for exact matching
  const results = await db
    .select({
      id: icons.id,
      name: icons.name,
      normalizedName: icons.normalizedName,
      sourceId: icons.sourceId,
      category: icons.category,
      tags: icons.tags,
      viewBox: icons.viewBox,
      content: icons.content,
      defaultStroke: icons.defaultStroke,
      defaultFill: icons.defaultFill,
      strokeWidth: icons.strokeWidth,
      brandColor: icons.brandColor,
    })
    .from(icons)
    .where(sql`lower(${icons.normalizedName}) IN ${normalizedNames}`)
    .orderBy(asc(icons.normalizedName));

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    sourceId: row.sourceId,
    category: row.category,
    tags: (row.tags as string[]) ?? [],
    viewBox: row.viewBox,
    content: row.content,
    pathData: null,
    defaultStroke: row.defaultStroke ?? false,
    defaultFill: row.defaultFill ?? false,
    strokeWidth: row.strokeWidth,
    brandColor: row.brandColor ?? null,
  }));
}

/**
 * Get icons by their IDs (batch query for MCP get_multiple_icons).
 * Returns icons matching any of the provided IDs in format 'source:name'.
 */
export async function getIconsByIds(ids: string[]): Promise<IconData[]> {
  if (ids.length === 0) return [];

  // Use SQL IN clause for exact ID matching
  const results = await db
    .select({
      id: icons.id,
      name: icons.name,
      normalizedName: icons.normalizedName,
      sourceId: icons.sourceId,
      category: icons.category,
      tags: icons.tags,
      viewBox: icons.viewBox,
      content: icons.content,
      defaultStroke: icons.defaultStroke,
      defaultFill: icons.defaultFill,
      strokeWidth: icons.strokeWidth,
      brandColor: icons.brandColor,
    })
    .from(icons)
    .where(sql`${icons.id} IN ${ids}`);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    sourceId: row.sourceId,
    category: row.category,
    tags: (row.tags as string[]) ?? [],
    viewBox: row.viewBox,
    content: row.content,
    pathData: null,
    defaultStroke: row.defaultStroke ?? false,
    defaultFill: row.defaultFill ?? false,
    strokeWidth: row.strokeWidth,
    brandColor: row.brandColor ?? null,
  }));
}


/**
 * Get icon count by source.
 */
export async function getIconCountBySource(): Promise<Record<string, number>> {
  const results = await db
    .select({
      sourceId: icons.sourceId,
      count: sql<number>`count(*)`,
    })
    .from(icons)
    .groupBy(icons.sourceId);

  return Object.fromEntries(results.map((r) => [r.sourceId, r.count]));
}

/**
 * Get total icon count.
 */
export async function getTotalIconCount(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(icons);
  return result[0]?.count ?? 0;
}

/**
 * Get unique categories.
 */
export async function getCategories(): Promise<string[]> {
  const results = await db
    .selectDistinct({ category: icons.category })
    .from(icons)
    .where(sql`${icons.category} IS NOT NULL`)
    .orderBy(asc(icons.category));

  return results.map((r) => r.category).filter((c): c is string => c !== null);
}


// Helper to map database row to IconData type
function mapIconRow(row: typeof icons.$inferSelect): IconData {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    sourceId: row.sourceId,
    category: row.category,
    tags: (row.tags as string[]) ?? [],
    viewBox: row.viewBox,
    content: row.content,
    pathData: row.pathData ?? null,
    defaultStroke: row.defaultStroke ?? false,
    defaultFill: row.defaultFill ?? false,
    strokeWidth: row.strokeWidth,
    brandColor: row.brandColor ?? null,
  };
}
