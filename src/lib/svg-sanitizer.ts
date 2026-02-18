/**
 * Minimal SVG sanitizer for user-supplied bundle payloads.
 *
 * Icon content should be simple geometry tags. We strip known dangerous
 * elements/attributes/protocols while preserving normal icon paths/shapes.
 */

const BLOCKED_TAGS = [
  "script",
  "foreignObject",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "style",
  "base",
] as const;

const BLOCKED_TAG_PATTERN = BLOCKED_TAGS.join("|");

function stripBlockedTags(input: string): string {
  // Remove paired blocked elements and their contents.
  const pairedPattern = new RegExp(
    `<\\s*(${BLOCKED_TAG_PATTERN})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`,
    "gi"
  );
  // Remove self-closing/single blocked elements.
  const singlePattern = new RegExp(
    `<\\s*(${BLOCKED_TAG_PATTERN})\\b[^>]*\\/?>`,
    "gi"
  );

  return input.replace(pairedPattern, "").replace(singlePattern, "");
}

function stripEventHandlers(input: string): string {
  // Remove on* attributes (onclick, onload, etc.).
  return input.replace(/\s+on[a-zA-Z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

function stripUnsafeUrls(input: string): string {
  // Drop href/src attributes using scriptable protocols.
  return input.replace(
    /\s+(href|xlink:href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (fullMatch, _attr, _fullValue, dq, sq, uq) => {
      const rawValue = (dq ?? sq ?? uq ?? "").trim().toLowerCase();
      const isUnsafe =
        rawValue.startsWith("javascript:") ||
        rawValue.startsWith("vbscript:") ||
        rawValue.startsWith("data:text/html") ||
        rawValue.startsWith("data:application/javascript");

      return isUnsafe ? "" : fullMatch;
    }
  );
}

export function sanitizeSvgContent(input: string): string {
  let output = input.replace(/\0/g, "");
  output = stripBlockedTags(output);
  output = stripEventHandlers(output);
  output = stripUnsafeUrls(output);
  return output.trim();
}

export type BundleIconPayload = Record<string, unknown>;

export function sanitizeBundleIcons(input: unknown): BundleIconPayload[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const sanitized: BundleIconPayload[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null;
    }

    const icon = { ...item } as BundleIconPayload;

    if (typeof icon.svg === "string") {
      icon.svg = sanitizeSvgContent(icon.svg);
    }
    if (typeof icon.content === "string") {
      icon.content = sanitizeSvgContent(icon.content);
    }

    sanitized.push(icon);
  }

  return sanitized;
}
