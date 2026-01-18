import { db } from "./db";
import { icons, sources, variants, mappings } from "./schema";
import { eq, like, or, sql, desc, asc } from "drizzle-orm";
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
 * Search icons with optional filters.
 */
export async function searchIcons(params: {
  query?: string;
  sourceId?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<IconData[]> {
  const { query, sourceId, category, limit = 100, offset = 0 } = params;

  let baseQuery = db.select().from(icons);

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

  const results = await db
    .select()
    .from(icons)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(asc(icons.normalizedName))
    .limit(limit)
    .offset(offset);

  return results.map(mapIconRow);
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
 * Get all variants for an icon.
 */
export async function getIconVariants(iconId: string) {
  return db.select().from(variants).where(eq(variants.iconId, iconId));
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

/**
 * Get equivalent icons across libraries.
 */
export async function getEquivalentIcons(canonicalName: string) {
  const results = await db
    .select()
    .from(mappings)
    .where(eq(mappings.canonicalName, canonicalName))
    .limit(1);

  const mapping = results[0];
  if (!mapping) {
    return null;
  }

  const equivalents: IconData[] = [];

  if (mapping.lucideId) {
    const icon = await getIconById(mapping.lucideId);
    if (icon) equivalents.push(icon);
  }

  if (mapping.phosphorId) {
    const icon = await getIconById(mapping.phosphorId);
    if (icon) equivalents.push(icon);
  }

  if (mapping.hugeiconsId) {
    const icon = await getIconById(mapping.hugeiconsId);
    if (icon) equivalents.push(icon);
  }

  return equivalents;
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
  };
}
