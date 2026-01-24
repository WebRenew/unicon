/**
 * Library metadata for consistency analysis and normalization
 */

export interface LibraryMetadata {
  id: string;
  name: string;
  defaultStrokeWidth: number;
  category: "stroke" | "brand" | "fill";
  family?: string; // Libraries that share design DNA (e.g., lucide/feather)
}

export const LIBRARY_METADATA: Record<string, LibraryMetadata> = {
  lucide: {
    id: "lucide",
    name: "Lucide",
    defaultStrokeWidth: 2,
    category: "stroke",
  },
  phosphor: {
    id: "phosphor",
    name: "Phosphor",
    defaultStrokeWidth: 1.5,
    category: "stroke",
  },
  heroicons: {
    id: "heroicons",
    name: "Heroicons",
    defaultStrokeWidth: 1.5,
    category: "stroke",
  },
  tabler: {
    id: "tabler",
    name: "Tabler",
    defaultStrokeWidth: 2,
    category: "stroke",
  },
  feather: {
    id: "feather",
    name: "Feather",
    defaultStrokeWidth: 2,
    category: "stroke",
    family: "lucide", // Lucide is a fork of Feather, compatible styles
  },
  remix: {
    id: "remix",
    name: "Remix",
    defaultStrokeWidth: 1.5,
    category: "stroke",
  },
  iconoir: {
    id: "iconoir",
    name: "Iconoir",
    defaultStrokeWidth: 1.5,
    category: "stroke",
  },
  hugeicons: {
    id: "hugeicons",
    name: "Hugeicons",
    defaultStrokeWidth: 1.5,
    category: "stroke",
  },
  "simple-icons": {
    id: "simple-icons",
    name: "Simple Icons",
    defaultStrokeWidth: 0,
    category: "brand", // Brand icons - exempt from consistency warnings
  },
};

/**
 * Get library metadata, with fallback for unknown libraries
 */
export function getLibraryMetadata(sourceId: string): LibraryMetadata {
  return (
    LIBRARY_METADATA[sourceId] ?? {
      id: sourceId,
      name: sourceId,
      defaultStrokeWidth: 2,
      category: "stroke" as const,
    }
  );
}

/**
 * Check if two libraries are in the same family (compatible styles)
 */
export function areSameFamily(sourceId1: string, sourceId2: string): boolean {
  const lib1 = getLibraryMetadata(sourceId1);
  const lib2 = getLibraryMetadata(sourceId2);

  // Same library
  if (lib1.id === lib2.id) return true;

  // Check family relationships
  if (lib1.family && (lib1.family === lib2.id || lib1.family === lib2.family))
    return true;
  if (lib2.family && (lib2.family === lib1.id || lib2.family === lib1.family))
    return true;

  return false;
}
