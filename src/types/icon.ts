export interface IconData {
  id: string;
  name: string;
  normalizedName: string;
  sourceId: string;
  category: string | null;
  tags: string[];
  viewBox: string;
  content: string;
  pathData: PathElement[] | null;
  defaultStroke: boolean;
  defaultFill: boolean;
  strokeWidth: string | null;
  brandColor: string | null;
}

export interface PathElement {
  tag: string;
  attrs: Record<string, string>;
}

export interface SourceData {
  id: string;
  name: string;
  version: string;
  license: string | null;
  totalIcons: number | null;
  extractedAt: Date | null;
}

export type IconLibrary =
  | "lucide"
  | "phosphor"
  | "hugeicons"
  | "heroicons"
  | "tabler"
  | "feather"
  | "remix"
  | "simple-icons";

export interface IconPreviewSettings {
  size: number;
  strokeWidth: number;
  color: string;
}

