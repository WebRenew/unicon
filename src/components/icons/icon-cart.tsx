"use client";

import { useState, useMemo } from "react";
import { X, Download, Copy, Check, Trash2, FileCode, FileJson, Package, ExternalLink, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { STARTER_PACKS, getPackColorClasses } from "@/lib/starter-packs";
import {
  toPascalCase,
  getSvgAttributesRaw,
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

export function IconCart({ items, onRemove, onClear, onAddPack, isOpen, onClose }: IconCartProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("react");
  const [starterPacksExpanded, setStarterPacksExpanded] = useState(false);

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

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[hsl(0,0%,6%)] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-black/60 dark:text-white/60" />
          <h2 className="font-mono text-black dark:text-white text-sm tracking-wide">
            BUNDLE ({items.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
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

      {/* Bundle Size Warning */}
      {items.length > 100 && (
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

      {/* Icons List */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <Package className="w-6 h-6 text-black/30 dark:text-white/30" />
              </div>
              <p className="text-black/50 dark:text-white/40 text-sm">Your bundle is empty</p>
              <p className="text-black/40 dark:text-white/30 text-xs mt-1">
                Click icons to add them, or try a starter pack
              </p>
            </div>

            {/* Starter Packs */}
            <div className="mt-4">
              <button
                onClick={() => setStarterPacksExpanded(!starterPacksExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-mono text-black/60 dark:text-white/60">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Starter Packs
                </span>
                {starterPacksExpanded ? (
                  <ChevronUp className="w-4 h-4 text-black/40 dark:text-white/40" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-black/40 dark:text-white/40" />
                )}
              </button>

              {starterPacksExpanded && (
                <div className="mt-2 space-y-1.5">
                  {STARTER_PACKS.map((pack) => {
                    const colors = getPackColorClasses(pack.color);
                    return (
                      <button
                        key={pack.id}
                        onClick={() => {
                          if (onAddPack) {
                            onAddPack(pack.iconNames);
                            toast.success(`Added "${pack.name}" pack`);
                          }
                        }}
                        className={`w-full p-2.5 rounded-lg border ${colors.border} ${colors.bg} hover:brightness-110 dark:hover:brightness-125 transition-all text-left group`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono font-medium ${colors.text}`}>
                            {pack.name}
                          </span>
                          <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                            {pack.iconNames.length} icons
                          </span>
                        </div>
                        <p className="text-[10px] text-black/50 dark:text-white/50 mt-0.5">
                          {pack.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
        )}
      </div>

      {/* Export Options */}
      {items.length > 0 && (
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
