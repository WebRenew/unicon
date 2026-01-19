"use client";

import { useState, useMemo } from "react";
import { X, Download, Copy, Check, Trash2, FileCode, FileJson, Package, ExternalLink } from "lucide-react";
import type { IconData } from "@/types/icon";

interface IconCartProps {
  items: IconData[];
  onRemove: (id: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "react" | "svg" | "json";

export function IconCart({ items, onRemove, onClear, isOpen, onClose }: IconCartProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("react");

  const toPascalCase = (str: string) =>
    str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

  const getSvgAttributes = (icon: IconData) => {
    if (icon.sourceId === "phosphor") {
      return 'fill="currentColor"';
    }
    if (icon.sourceId === "hugeicons") {
      return 'stroke="currentColor" fill="none"';
    }
    return `fill="none" stroke="currentColor" strokeWidth="${icon.strokeWidth || "2"}" strokeLinecap="round" strokeLinejoin="round"`;
  };

  const getSvgAttributesRaw = (icon: IconData) => {
    if (icon.sourceId === "phosphor") {
      return 'fill="currentColor"';
    }
    if (icon.sourceId === "hugeicons") {
      return 'stroke="currentColor" fill="none"';
    }
    return `fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round"`;
  };

  // Memoize export content to ensure it uses the latest items
  const exportContent = useMemo(() => {
    if (items.length === 0) return "";

    switch (exportFormat) {
      case "react": {
        const components = items.map((icon) => {
          const name = toPascalCase(icon.normalizedName);
          const attrs = getSvgAttributes(icon);
          return `export function ${name}({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${attrs}
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}`;
        });
        return `import * as React from "react";

${components.join("\n\n")}
`;
      }
      case "svg":
        return items
          .map((icon) => {
            const attrs = getSvgAttributesRaw(icon);
            return `<!-- ${icon.normalizedName} (${icon.sourceId}) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>
  ${icon.content}
</svg>`;
          })
          .join("\n\n");
      case "json":
        return JSON.stringify(
          items.map((icon) => ({
            id: icon.id,
            name: icon.normalizedName,
            source: icon.sourceId,
            viewBox: icon.viewBox,
            content: icon.content,
            tags: icon.tags,
          })),
          null,
          2
        );
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
      .map((icon) => {
        const attrs = getSvgAttributesRaw(icon);
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>${icon.content}</svg>`;
      })
      .join("\n");
    
    const prompt = encodeURIComponent(
      `Create a beautiful icon showcase component using these ${items.length} icons (${iconNames}):\n\n${svgBundle}\n\nMake it interactive with hover states and a clean grid layout.`
    );
    window.open(`https://v0.dev/?q=${prompt}`, "_blank");
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[hsl(0,0%,6%)] border-l border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-white/60" />
          <h2 className="font-mono text-white text-sm tracking-wide">
            BUNDLE ({items.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="p-2 text-white/40 hover:text-red-400 transition-colors"
              aria-label="Clear all icons from bundle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors"
            aria-label="Close bundle drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Icons List */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3 opacity-50">📦</div>
            <p className="text-white/40 text-sm">Your bundle is empty</p>
            <p className="text-white/30 text-xs mt-1">
              Click icons to add them
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {items.map((icon) => (
              <div
                key={icon.id}
                className="group relative flex items-center justify-center w-12 h-12 bg-white/5 rounded-lg border border-white/10"
              >
                <div
                  className="w-5 h-5 text-white/70"
                  dangerouslySetInnerHTML={{
                    __html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="${icon.viewBox}" ${getSvgAttributesRaw(icon)}>${icon.content}</svg>`,
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
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Format selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat("react")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "react"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
              }`}
            >
              <FileCode className="w-4 h-4" />
              React
            </button>
            <button
              onClick={() => setExportFormat("svg")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "svg"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
              }`}
            >
              <FileCode className="w-4 h-4" />
              SVG
            </button>
            <button
              onClick={() => setExportFormat("json")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                exportFormat === "json"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
              }`}
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="text-xs text-white/50">
              {exportFormat === "react" && `${items.length} React component${items.length > 1 ? "s" : ""}`}
              {exportFormat === "svg" && `${items.length} SVG${items.length > 1 ? "s" : ""}`}
              {exportFormat === "json" && `${items.length} icon${items.length > 1 ? "s" : ""} in JSON`}
            </div>
            <div className="bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap break-all">
                {exportContent.slice(0, 800)}
                {exportContent.length > 800 && "\n\n... (more content)"}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-mono transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-mono transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <button
            onClick={handleOpenInV0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-mono transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in v0
          </button>
        </div>
      )}
    </div>
  );
}
