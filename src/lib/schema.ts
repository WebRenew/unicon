import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Icon libraries (lucide, phosphor, hugeicons)
export const libraries = sqliteTable("libraries", {
  id: text("id").primaryKey(), // e.g., "lucide", "phosphor", "hugeicons"
  name: text("name").notNull(), // Display name
  website: text("website"),
  license: text("license"),
  totalIcons: integer("total_icons").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Icon categories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(), // e.g., "arrows", "media", "social"
  name: text("name").notNull(),
  description: text("description"),
});

// Main icons table
export const icons = sqliteTable(
  "icons",
  {
    id: text("id").primaryKey(), // e.g., "lucide:arrow-left"
    name: text("name").notNull(), // e.g., "arrow-left"
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id),
    categoryId: text("category_id").references(() => categories.id),
    tags: text("tags"), // JSON array of tags for search
    svgPath: text("svg_path").notNull(), // The SVG path data
    svgContent: text("svg_content").notNull(), // Full SVG markup
    viewBox: text("view_box").default("0 0 24 24"),
    strokeWidth: integer("stroke_width").default(2),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("icons_library_idx").on(table.libraryId),
    index("icons_category_idx").on(table.categoryId),
    index("icons_name_idx").on(table.name),
  ]
);

// Export types
export type Library = typeof libraries.$inferSelect;
export type NewLibrary = typeof libraries.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Icon = typeof icons.$inferSelect;
export type NewIcon = typeof icons.$inferInsert;
