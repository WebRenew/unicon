import { sqliteTable, text, integer, index, blob } from "drizzle-orm/sqlite-core";

// Icon sources/libraries (lucide, phosphor, hugeicons)
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(), // 'lucide', 'phosphor', 'hugeicons'
  name: text("name").notNull(),
  version: text("version").notNull(),
  license: text("license"),
  totalIcons: integer("total_icons"),
  extractedAt: integer("extracted_at", { mode: "timestamp" }),
});

// Main icons table
export const icons = sqliteTable(
  "icons",
  {
    id: text("id").primaryKey(), // 'lucide:arrow-right'
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    name: text("name").notNull(), // 'ArrowRight' (PascalCase)
    normalizedName: text("normalized_name").notNull(), // 'arrow-right' (kebab)
    category: text("category"), // 'arrows', 'ui', etc.
    tags: text("tags", { mode: "json" }).$type<string[]>(), // ['directional', 'navigation']

    // SVG data
    viewBox: text("view_box").notNull(), // '0 0 24 24'
    content: text("content").notNull(), // raw SVG inner content
    pathData: text("path_data", { mode: "json" }).$type<PathElement[]>(), // structured path extraction

    // Rendering hints
    defaultStroke: integer("default_stroke", { mode: "boolean" }),
    defaultFill: integer("default_fill", { mode: "boolean" }),
    strokeWidth: text("stroke_width"),

    // AI search
    searchText: text("search_text"), // Combined text for embedding: "arrow left back previous navigation"
    embedding: blob("embedding", { mode: "buffer" }), // Vector embedding (F32_BLOB)

    // Brand icons (Simple Icons)
    brandColor: text("brand_color"), // Hex color for brand icons, e.g. '#1DA1F2'
  },
  (table) => [
    index("icons_source_idx").on(table.sourceId),
    index("icons_normalized_name_idx").on(table.normalizedName),
    index("icons_category_idx").on(table.category),
  ]
);

// Icon variants (for Phosphor weights: bold, fill, duotone, etc.)
export const variants = sqliteTable(
  "variants",
  {
    id: text("id").primaryKey(), // 'phosphor:arrow-right:bold'
    iconId: text("icon_id")
      .notNull()
      .references(() => icons.id),
    variant: text("variant").notNull(), // 'bold', 'fill', 'duotone'
    content: text("content").notNull(),
    pathData: text("path_data", { mode: "json" }).$type<PathElement[]>(),
  },
  (table) => [
    index("variants_icon_idx").on(table.iconId),
    index("variants_variant_idx").on(table.variant),
  ]
);

// Cross-library mapping for equivalent icons
export const mappings = sqliteTable(
  "mappings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    canonicalName: text("canonical_name").notNull(), // 'arrow-right'
    lucideId: text("lucide_id").references(() => icons.id),
    phosphorId: text("phosphor_id").references(() => icons.id),
    hugeiconsId: text("hugeicons_id").references(() => icons.id),
    confidence: integer("confidence"), // 0-100 match confidence
    needsReview: integer("needs_review", { mode: "boolean" }),
  },
  (table) => [index("mappings_canonical_idx").on(table.canonicalName)]
);

// Search analytics for tracking query performance and usage
export const searchAnalytics = sqliteTable(
  "search_analytics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    query: text("query").notNull(),
    searchType: text("search_type").notNull(), // 'semantic' | 'text'
    sourceFilter: text("source_filter"), // Library filter if applied
    resultCount: integer("result_count").notNull(),
    cacheHit: integer("cache_hit", { mode: "boolean" }).notNull(),
    responseTimeMs: integer("response_time_ms"), // Response time in milliseconds
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("search_analytics_query_idx").on(table.query),
    index("search_analytics_timestamp_idx").on(table.timestamp),
  ]
);

// Types
export interface PathElement {
  tag: string;
  attrs: Record<string, string>;
}

