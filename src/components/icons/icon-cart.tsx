"use client";

import { useState, useMemo } from "react";
import { X, Download, Copy, Check, Trash2, FileCode, FileJson, Package, ExternalLink, AlertTriangle, ArrowRight } from "lucide-react";

// Spaceship icon from hugeicons
function SpaceshipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3C9.05058 3 6.59627 5.11144 6.07743 7.8996C5.9907 8.36569 5.94733 8.59873 6.1089 8.90532C6.27048 9.2119 6.49914 9.31381 6.95646 9.51763C8.33509 10.1321 10.0897 10.5 12 10.5C13.9103 10.5 15.6649 10.1321 17.0435 9.51763C17.5009 9.31381 17.7295 9.2119 17.8911 8.90532C18.0527 8.59873 18.0093 8.36569 17.9226 7.8996C17.4037 5.11144 14.9494 3 12 3Z" stroke="currentColor"/>
      <path d="M17 5.5C19.989 6.28752 22 7.75946 22 9.44533C22 11.9608 17.5228 14 12 14C6.47715 14 2 11.9608 2 9.44533C2 7.75946 4.01099 6.28752 7 5.5" stroke="currentColor"/>
      <path d="M12 18V21" stroke="currentColor"/>
      <path d="M17 17L18 21" stroke="currentColor"/>
      <path d="M7 17L6 21" stroke="currentColor"/>
    </svg>
  );
}
import { toast } from "sonner";
import { STARTER_PACKS } from "@/lib/starter-packs";
import {
  toPascalCase,
  generateReactFile,
  generateSvgBundle,
  generateJsonBundle,
  generateRenderableSvg,
} from "@/lib/icon-utils";
import type { IconData } from "@/types/icon";

interface IconCartProps {
  items: IconData[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddPack?: (iconNames: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "react" | "svg" | "json";
type TabType = "bundle" | "packs";

export function IconCart({ items, onRemove, onClear, onAddPack, isOpen, onClose }: IconCartProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("react");
  const [activeTab, setActiveTab] = useState<TabType>("bundle");

  // Memoize export content to ensure it uses the latest items
  const exportContent = useMemo(() => {
    if (items.length === 0) return "";

    switch (exportFormat) {
      case "react":
        return generateReactFile(items);
      case "svg":
        return generateSvgBundle(items);
      case "json":
        return generateJsonBundle(items);
    }
  }, [items, exportFormat]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const getFileName = () => {
    switch (exportFormat) {
      case "react":
        return "icons.tsx";
      case "svg":
        return "icons.svg";
      case "json":
        return "icons.json";
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInV0 = () => {
    const iconNames = items.map((icon) => toPascalCase(icon.normalizedName)).join(", ");
    const svgBundle = items
      .map((icon) => generateRenderableSvg(icon))
      .join("\n");
    
    const prompt = encodeURIComponent(
      `Create a beautiful icon showcase component using these ${items.length} icons (${iconNames}):\n\n${svgBundle}\n\nMake it interactive with hover states and a clean grid layout.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  };

  const handleAddPack = (pack: typeof STARTER_PACKS[0]) => {
    if (onAddPack) {
      onAddPack(pack.iconNames);
      toast.success(`Added "${pack.name}" pack`);
      setActiveTab("bundle");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[hsl(0,0%,6%)] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-black/60 dark:text-white/60" />
          <h2 className="font-mono text-black dark:text-white text-sm tracking-wide">
            BUNDLE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && activeTab === "bundle" && (
            <button
              onClick={onClear}
              className="p-2 text-black/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label="Clear all icons from bundle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Close bundle drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10">
        <button
          onClick={() => setActiveTab("bundle")}
          className={`flex-1 px-4 py-3 text-xs font-mono transition-colors relative ${
            activeTab === "bundle"
              ? "text-black dark:text-white"
              : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Package className="w-3.5 h-3.5" />
            Bundle
            {items.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">
                {items.length}
              </span>
            )}
          </span>
          {activeTab === "bundle" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("packs")}
          className={`flex-1 px-4 py-3 text-xs font-mono transition-colors relative ${
            activeTab === "packs"
              ? "text-black dark:text-white"
              : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <SpaceshipIcon className="w-3.5 h-3.5" />
            Starter Packs
          </span>
          {activeTab === "packs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
      </div>

      {/* Bundle Size Warning */}
      {items.length > 100 && activeTab === "bundle" && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400 font-medium">Large bundle</p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                {items.length} icons may increase your bundle size. Consider using the CLI for better tree-shaking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "bundle" ? (
          // Bundle Tab
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <Package className="w-6 h-6 text-black/30 dark:text-white/30" />
              </div>
              <p className="text-black/50 dark:text-white/40 text-sm">Your bundle is empty</p>
              <p className="text-black/40 dark:text-white/30 text-xs mt-1">
                Click icons to add them
              </p>
              <button
                onClick={() => setActiveTab("packs")}
                className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono text-black/60 dark:text-white/60 transition-colors"
              >
                <SpaceshipIcon className="w-3.5 h-3.5" />
                Browse starter packs
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {items.map((icon) => (
                <div
                  key={icon.id}
                  className="group relative flex items-center justify-center w-12 h-12 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10"
                >
                  <div
                    className="w-5 h-5 text-black/70 dark:text-white/70"
                    dangerouslySetInnerHTML={{
                      __html: generateRenderableSvg(icon, { size: 20 }),
                    }}
                  />
                  <button
                    onClick={() => onRemove(icon.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${icon.normalizedName} from bundle`}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          // Starter Packs Tab - Edge-to-edge grid
          <div className="-m-4">
            <div className="grid grid-cols-2">
              {STARTER_PACKS.map((pack, index) => (
                <button
                  key={pack.id}
                  onClick={() => handleAddPack(pack)}
                  className={`group p-4 border-black/10 dark:border-white/10 bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all text-left
                    ${index % 2 === 0 ? "border-r" : ""}
                    ${index < STARTER_PACKS.length - 2 ? "border-b" : ""}
                    ${index === STARTER_PACKS.length - 2 || index === STARTER_PACKS.length - 1 ? "" : "border-b"}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {pack.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-black/20 dark:text-white/20 group-hover:text-black/40 dark:group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-black/50 dark:text-white/50 leading-relaxed mb-3">
                    {pack.description}
                  </p>
                  <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                    {pack.iconNames.length} icons
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Options - Only show when bundle has items and on bundle tab */}
      {items.length > 0 && activeTab === "bundle" && (
        <div className="border-t border-black/10 dark:border-white/10 p-4 space-y-4">
          {/* Format selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat("react")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "react"
                  ? "bg-black dark:bg-white text-white dark:text-black border border-black/20 dark:border-white/20"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              <FileCode className="w-4 h-4" />
              React
            </button>
            <button
              onClick={() => setExportFormat("svg")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "svg"
                  ? "bg-black dark:bg-white text-white dark:text-black border border-black/20 dark:border-white/20"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              <FileCode className="w-4 h-4" />
              SVG
            </button>
            <button
              onClick={() => setExportFormat("json")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "json"
                  ? "bg-black dark:bg-white text-white dark:text-black border border-black/20 dark:border-white/20"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="text-xs text-black/50 dark:text-white/50">
              {exportFormat === "react" && `${items.length} React component${items.length > 1 ? "s" : ""}`}
              {exportFormat === "svg" && `${items.length} SVG${items.length > 1 ? "s" : ""}`}
              {exportFormat === "json" && `${items.length} icon${items.length > 1 ? "s" : ""} in JSON`}
            </div>
            <div className="bg-black/5 dark:bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto border border-black/5 dark:border-white/5">
              <pre className="text-[10px] text-black/50 dark:text-white/50 font-mono whitespace-pre-wrap break-all">
                {exportContent.slice(0, 800)}
                {exportContent.length > 800 && "\n\n... (more content)"}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-black dark:text-white rounded-lg text-sm font-mono transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-black dark:text-white rounded-lg text-sm font-mono transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <button
            onClick={handleOpenInV0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 rounded-lg text-sm font-mono transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in v0
          </button>
        </div>
      )}
    </div>
  );
}
