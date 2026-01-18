export interface IconData {
  id: string;
  name: string;
  libraryId: string;
  categoryId: string | null;
  tags: string[];
  svgPath: string;
  svgContent: string;
  viewBox: string;
  strokeWidth: number;
}

export interface LibraryData {
  id: string;
  name: string;
  website: string | null;
  license: string | null;
  totalIcons: number;
}

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
}

export type IconLibrary = "lucide" | "phosphor" | "hugeicons";

export interface IconPreviewSettings {
  size: number;
  strokeWidth: number;
  color: string;
}
