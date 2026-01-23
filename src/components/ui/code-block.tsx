"use client";

import { CopyButton } from "@/components/ui/copy-button";

interface CodeBlockProps {
  children: string;
  title?: string;
}

/**
 * Code block with syntax highlighting, copy button, and mobile-friendly overflow.
 */
export function CodeBlock({ children, title }: CodeBlockProps) {
  return (
    <div className="group relative rounded-lg border border-border bg-muted/40 max-w-full overflow-hidden">
      {title && (
        <div className="px-3 py-2 border-b border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
          <span className="truncate">{title}</span>
          <CopyButton value={children} />
        </div>
      )}
      {!title && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <CopyButton value={children} />
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="p-3 md:p-4 text-xs md:text-sm font-mono text-foreground/80 whitespace-pre">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}
