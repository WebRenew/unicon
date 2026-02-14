import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import {
  generateReactFile,
  generateSvgBundle,
  generateJsonBundle,
  normalizeIcons,
  STANDARD_VIEWBOX,
} from "@/lib/icon-utils";
import { getBundleLibrarySummary, analyzeViewBoxMixing } from "@/lib/bundle-utils";
import type { IconData } from "@/types/icon";

type ExportFormat = "react" | "svg" | "json";
type TabType = "bundle" | "packs";

/**
 * Check if an icon is fill-based (not stroke-based).
 */
function isFillIcon(icon: IconData): boolean {
  return icon.defaultFill && !icon.defaultStroke;
}

interface UseIconCartParams {
  items: IconData[];
}

export function useIconCart({ items }: UseIconCartParams) {
  const [copied, setCopied] = useState(false);
  const [copiedV0, setCopiedV0] = useState(false);
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("react");
  const [activeTab, setActiveTab] = useState<TabType>("bundle");
  const [previewHeight, setPreviewHeight] = useState(192);
  const [saveBundleOpen, setSaveBundleOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [normalizeStrokes, setNormalizeStrokes] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("unicon-normalize-strokes") === "true";
    } catch {
      return false;
    }
  });
  const [targetStrokeWidth, setTargetStrokeWidth] = useState(() => {
    if (typeof window === "undefined") return 2;
    try {
      const stored = localStorage.getItem("unicon-target-stroke-width");
      return stored ? Number(stored) : 2;
    } catch {
      return 2;
    }
  });
  const [groupByLibrary, setGroupByLibrary] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("unicon-group-by-library") === "true";
    } catch {
      return false;
    }
  });
  const [normalizeViewbox, setNormalizeViewbox] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("unicon-normalize-viewbox") === "true";
    } catch {
      return false;
    }
  });
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const bundleComposition = useMemo(() => {
    let strokeCount = 0;
    let fillCount = 0;
    for (const icon of items) {
      if (isFillIcon(icon)) {
        fillCount++;
      } else {
        strokeCount++;
      }
    }
    return { strokeCount, fillCount, hasStrokeIcons: strokeCount > 0 };
  }, [items]);

  const librarySummary = useMemo(() => getBundleLibrarySummary(items), [items]);
  const iconsByLibrary = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const icon of items) {
      const existing = map.get(icon.sourceId) ?? [];
      existing.push(icon);
      map.set(icon.sourceId, existing);
    }
    return map;
  }, [items]);

  const viewBoxAnalysis = useMemo(() => analyzeViewBoxMixing(items.map(i => ({ viewBox: i.viewBox }))), [items]);
  const hasMixedViewBox = viewBoxAnalysis.hasInconsistency;

  // Persist normalization preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("unicon-normalize-strokes", String(normalizeStrokes));
    } catch {}
  }, [normalizeStrokes]);

  useEffect(() => {
    try {
      localStorage.setItem("unicon-target-stroke-width", String(targetStrokeWidth));
    } catch {}
  }, [targetStrokeWidth]);

  useEffect(() => {
    try {
      localStorage.setItem("unicon-group-by-library", String(groupByLibrary));
    } catch {}
  }, [groupByLibrary]);

  useEffect(() => {
    try {
      localStorage.setItem("unicon-normalize-viewbox", String(normalizeViewbox));
    } catch {}
  }, [normalizeViewbox]);

  // Handle resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = previewHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, [previewHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(80, Math.min(400, startHeightRef.current - deltaY));
      setPreviewHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const exportContent = useMemo(() => {
    if (items.length === 0) return "";

    const normalizationOptions: { strokeWidth?: number; skipFillIcons?: boolean; viewBox?: string } = {};
    if (normalizeStrokes) {
      normalizationOptions.strokeWidth = targetStrokeWidth;
      normalizationOptions.skipFillIcons = true;
    }
    if (normalizeViewbox) {
      normalizationOptions.viewBox = STANDARD_VIEWBOX;
    }

    const iconsToExport = (normalizeStrokes || normalizeViewbox)
      ? normalizeIcons(items, normalizationOptions)
      : items;

    switch (exportFormat) {
      case "react":
        return generateReactFile(iconsToExport);
      case "svg":
        return generateSvgBundle(iconsToExport);
      case "json":
        return generateJsonBundle(iconsToExport);
    }
  }, [items, exportFormat, normalizeStrokes, targetStrokeWidth, normalizeViewbox]);

  return {
    // UI state
    copied,
    setCopied,
    copiedV0,
    setCopiedV0,
    copiedPackId,
    setCopiedPackId,
    exportFormat,
    setExportFormat,
    activeTab,
    setActiveTab,
    previewHeight,
    saveBundleOpen,
    setSaveBundleOpen,
    loginDialogOpen,
    setLoginDialogOpen,

    // Auth & theme
    user,
    isDarkMode,

    // Normalization state
    normalizeStrokes,
    setNormalizeStrokes,
    targetStrokeWidth,
    setTargetStrokeWidth,
    groupByLibrary,
    setGroupByLibrary,
    normalizeViewbox,
    setNormalizeViewbox,

    // Computed values
    bundleComposition,
    librarySummary,
    iconsByLibrary,
    hasMixedViewBox,
    exportContent,

    // Resize
    handleResizeStart,

    // Helpers
    isFillIcon,
  };
}

export { isFillIcon };
export type { ExportFormat, TabType };
