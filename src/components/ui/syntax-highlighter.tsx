"use client";

import { useMemo } from "react";

interface SyntaxHighlighterProps {
  code: string;
  language?: "jsx" | "json" | "xml";
  className?: string;
}

/**
 * Simple syntax highlighter using Unicon accent colors.
 * - Keywords: lavender (#E6A8D7)
 * - Strings: mint (#6EE7B7)
 * - JSX tags: aqua (#7FD3E6)
 * - Comments: muted gray
 */
export function SyntaxHighlighter({ code, language = "jsx", className }: SyntaxHighlighterProps) {
  const highlighted = useMemo(() => {
    if (language === "json") {
      return highlightJson(code);
    }
    if (language === "xml") {
      return highlightXml(code);
    }
    return highlightJsx(code);
  }, [code, language]);

  return (
    <pre className={`text-[10px] font-mono whitespace-pre-wrap break-all ${className ?? ""}`}>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightJsx(code: string): string {
  // Process line by line to handle comments correctly
  const lines = code.split("\n");
  let inMultiLineComment = false;

  return lines.map((line) => {
    let result = "";
    let i = 0;

    while (i < line.length) {
      // Multi-line comment continuation
      if (inMultiLineComment) {
        const endComment = line.indexOf("*/", i);
        if (endComment !== -1) {
          result += `<span class="text-black/30 dark:text-white/30">${escapeHtml(line.slice(i, endComment + 2))}</span>`;
          i = endComment + 2;
          inMultiLineComment = false;
        } else {
          result += `<span class="text-black/30 dark:text-white/30">${escapeHtml(line.slice(i))}</span>`;
          break;
        }
        continue;
      }

      // Single-line comment
      if (line.slice(i, i + 2) === "//") {
        result += `<span class="text-black/30 dark:text-white/30">${escapeHtml(line.slice(i))}</span>`;
        break;
      }

      // Multi-line comment start
      if (line.slice(i, i + 2) === "/*") {
        const endComment = line.indexOf("*/", i + 2);
        if (endComment !== -1) {
          result += `<span class="text-black/30 dark:text-white/30">${escapeHtml(line.slice(i, endComment + 2))}</span>`;
          i = endComment + 2;
        } else {
          result += `<span class="text-black/30 dark:text-white/30">${escapeHtml(line.slice(i))}</span>`;
          inMultiLineComment = true;
          break;
        }
        continue;
      }

      // JSDoc comment with @
      if (line.slice(i, i + 3) === "/**" || line.trimStart().startsWith("*")) {
        const isJsDoc = line.slice(i, i + 3) === "/**";
        if (isJsDoc || (line.trimStart().startsWith("*") && i === line.indexOf("*"))) {
          // Highlight @tags in JSDoc
          const remaining = line.slice(i);
          // Process the line, highlighting @tags
          let processed = escapeHtml(remaining);
          processed = processed.replace(
            /(@\w+)/g,
            '</span><span class="text-[var(--accent-lavender)]">$1</span><span class="text-black/30 dark:text-white/30">'
          );
          result += `<span class="text-black/30 dark:text-white/30">${processed}</span>`;
          break;
        }
      }

      // Strings (double quotes)
      if (line[i] === '"') {
        const endQuote = line.indexOf('"', i + 1);
        if (endQuote !== -1) {
          result += `<span class="text-[var(--accent-mint)]">${escapeHtml(line.slice(i, endQuote + 1))}</span>`;
          i = endQuote + 1;
          continue;
        }
      }

      // Strings (single quotes)
      if (line[i] === "'") {
        const endQuote = line.indexOf("'", i + 1);
        if (endQuote !== -1) {
          result += `<span class="text-[var(--accent-mint)]">${escapeHtml(line.slice(i, endQuote + 1))}</span>`;
          i = endQuote + 1;
          continue;
        }
      }

      // Template literals
      if (line[i] === "`") {
        const endQuote = line.indexOf("`", i + 1);
        if (endQuote !== -1) {
          result += `<span class="text-[var(--accent-mint)]">${escapeHtml(line.slice(i, endQuote + 1))}</span>`;
          i = endQuote + 1;
          continue;
        }
      }

      // JSX opening tags
      if (line[i] === "<" && /[a-zA-Z/]/.test(line[i + 1] || "")) {
        const tagEnd = line.indexOf(">", i);
        if (tagEnd !== -1) {
          const tagContent = line.slice(i, tagEnd + 1);
          // Extract tag name
          const tagMatch = tagContent.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
          if (tagMatch && tagMatch[1]) {
            const tagName = tagMatch[1];
            const isClosing = tagContent.startsWith("</");
            const prefix = isClosing ? "&lt;/" : "&lt;";
            
            // Highlight attributes within the tag
            let inner = tagContent.slice(isClosing ? 2 + tagName.length : 1 + tagName.length, -1);
            inner = inner.replace(
              /(\w+)=/g,
              '<span class="text-black/60 dark:text-white/60">$1</span>='
            );
            inner = inner.replace(
              /"([^"]*)"/g,
              '<span class="text-[var(--accent-mint)]">"$1"</span>'
            );
            inner = inner.replace(
              /\{([^}]*)\}/g,
              '{<span class="text-black/70 dark:text-white/70">$1</span>}'
            );

            const suffix = tagContent.endsWith("/>") ? "/&gt;" : "&gt;";
            const innerWithoutSuffix = tagContent.endsWith("/>") ? inner.slice(0, -1) : inner;

            result += `${prefix}<span class="text-[var(--accent-aqua)]">${tagName}</span>${innerWithoutSuffix}${suffix}`;
            i = tagEnd + 1;
            continue;
          }
        }
      }

      // Keywords
      const keywords = [
        "import", "export", "from", "function", "return", "const", "let", "var",
        "type", "interface", "extends", "typeof", "as", "default", "async", "await"
      ];
      
      let foundKeyword = false;
      for (const keyword of keywords) {
        const prevChar = i > 0 ? (line[i - 1] ?? "") : "";
        const nextChar = line[i + keyword.length] ?? "";
        if (line.slice(i).startsWith(keyword) && 
            (i === 0 || !/[a-zA-Z0-9_]/.test(prevChar)) &&
            !/[a-zA-Z0-9_]/.test(nextChar)) {
          result += `<span class="text-[var(--accent-lavender)]">${keyword}</span>`;
          i += keyword.length;
          foundKeyword = true;
          break;
        }
      }
      if (foundKeyword) continue;

      // Default: just add the character
      const char = line[i];
      if (char !== undefined) {
        result += escapeHtml(char);
      }
      i++;
    }

    return result;
  }).join("\n");
}

function highlightJson(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Keys
    .replace(/"([^"]+)":/g, '<span class="text-[var(--accent-aqua)]">"$1"</span>:')
    // String values
    .replace(/: "([^"]*)"/g, ': <span class="text-[var(--accent-mint)]">"$1"</span>')
    // Numbers
    .replace(/: (\d+)/g, ': <span class="text-[var(--accent-lavender)]">$1</span>')
    // Booleans and null
    .replace(/: (true|false|null)/g, ': <span class="text-[var(--accent-lavender)]">$1</span>');
}

function highlightXml(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Comments
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-black/30 dark:text-white/30">$1</span>')
    // Tag names
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="text-[var(--accent-aqua)]">$2</span>')
    // Attributes
    .replace(/([\w-]+)="/g, '<span class="text-black/60 dark:text-white/60">$1</span>="')
    // Attribute values
    .replace(/"([^"]*)"/g, '<span class="text-[var(--accent-mint)]">"$1"</span>');
}
