#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import { dirname, resolve, join } from "path";
import { homedir } from "os";
import { createInterface } from "readline";

/**
 * Simple yes/no confirmation prompt
 */
function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

const API_BASE = process.env.UNICON_API_URL || "https://unicon.webrenew.com";
const CONFIG_FILE = ".uniconrc.json";
const CACHE_DIR = join(homedir(), ".unicon", "cache");
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────────────────────────
// Normalized SVG Generation Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default stroke configuration - matches Lucide/Feather conventions */
const DEFAULT_STROKE = {
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Determines rendering mode based on icon source.
 * - Phosphor: fill-based (weight is baked into icon variant)
 * - Lucide/Hugeicons: stroke-based (supports dynamic strokeWidth)
 */
function getIconRenderMode(sourceId: string): "fill" | "stroke" {
  return sourceId === "phosphor" ? "fill" : "stroke";
}

// Config file types
interface BundleConfig {
  name: string;
  query?: string;
  category?: string;
  source?: string;
  format?: "react" | "svg" | "json";
  limit?: number;
  output: string;
}

interface UniconConfig {
  $schema?: string;
  bundles: BundleConfig[];
}

function findConfigFile(): string | null {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  return existsSync(configPath) ? configPath : null;
}

function loadConfig(): UniconConfig | null {
  const configPath = findConfigFile();
  if (!configPath) return null;
  
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as UniconConfig;
  } catch (error) {
    console.error(chalk.red(`Failed to parse ${CONFIG_FILE}:`), error);
    return null;
  }
}

function createDefaultConfig(): UniconConfig {
  return {
    $schema: "https://unicon.webrenew.com/schema/uniconrc.json",
    bundles: [
      {
        name: "dashboard",
        category: "Dashboards",
        limit: 50,
        format: "react",
        output: "./src/icons/dashboard.tsx",
      },
      {
        name: "navigation",
        query: "arrow chevron menu home",
        limit: 30,
        format: "react",
        output: "./src/icons/navigation.tsx",
      },
    ],
  };
}

function showBanner(): void {
  const banner = figlet.textSync("UNICON", {
    font: "ANSI Shadow",
    horizontalLayout: "fitted",
  });

  console.log(chalk.cyan(banner));
  console.log(chalk.dim("  The unified icon library for React, Vue & Svelte\n"));
}

// Cache functions
function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheKey(params: Record<string, string | number | undefined>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return Buffer.from(sorted).toString("base64url");
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getFromCache<T>(key: string): T | null {
  ensureCacheDir();
  const cachePath = join(CACHE_DIR, `${key}.json`);
  
  if (!existsSync(cachePath)) return null;
  
  try {
    const content = readFileSync(cachePath, "utf-8");
    const entry = JSON.parse(content) as CacheEntry<T>;
    
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      unlinkSync(cachePath);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const cachePath = join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  writeFileSync(cachePath, JSON.stringify(entry), "utf-8");
}

function clearCache(): { count: number; size: number } {
  ensureCacheDir();
  let count = 0;
  let size = 0;
  
  try {
    const files = readdirSync(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = join(CACHE_DIR, file);
        const content = readFileSync(filePath, "utf-8");
        size += content.length;
        unlinkSync(filePath);
        count++;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return { count, size };
}

function getCacheStats(): { count: number; size: number; oldest: Date | null } {
  ensureCacheDir();
  let count = 0;
  let size = 0;
  let oldest: number | null = null;
  
  try {
    const files = readdirSync(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = join(CACHE_DIR, file);
        const content = readFileSync(filePath, "utf-8");
        size += content.length;
        count++;
        
        try {
          const entry = JSON.parse(content) as CacheEntry<unknown>;
          if (oldest === null || entry.timestamp < oldest) {
            oldest = entry.timestamp;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  } catch {
    // Ignore errors
  }
  
  return { count, size, oldest: oldest ? new Date(oldest) : null };
}

// ASCII Preview - renders SVG viewBox as simple grid
function renderAsciiPreview(icon: Icon, width = 16, height = 16): string {
  const chars = [" ", "░", "▒", "▓", "█"];
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
  
  // Parse viewBox
  const parts = icon.viewBox.split(" ").map(Number);
  const vbWidth = parts[2] ?? 24;
  const vbHeight = parts[3] ?? 24;
  const scaleX = width / vbWidth;
  const scaleY = height / vbHeight;
  
  // Simple path parsing - marks cells that contain path elements
  const pathMatches = icon.content.matchAll(/d="([^"]+)"/g);
  
  for (const match of pathMatches) {
    const pathData = match[1];
    if (!pathData) continue;
    
    // Extract coordinate pairs from path
    const coords = pathData.matchAll(/[-\d.]+/g);
    let x = 0, y = 0;
    let isX = true;
    
    for (const coord of coords) {
      const coordVal = coord[0];
      if (!coordVal) continue;
      
      const val = parseFloat(coordVal);
      if (isNaN(val)) continue;
      
      if (isX) {
        x = Math.floor(val * scaleX);
      } else {
        y = Math.floor(val * scaleY);
        // Mark this cell and neighbors
        const row = grid[y];
        const rowAbove = grid[y - 1];
        const rowBelow = grid[y + 1];
        
        if (row && x >= 0 && x < width && y >= 0 && y < height) {
          row[x] = Math.min(4, (row[x] ?? 0) + 2);
          // Add neighbors for thickness
          if (x > 0) row[x - 1] = Math.min(4, (row[x - 1] ?? 0) + 1);
          if (x < width - 1) row[x + 1] = Math.min(4, (row[x + 1] ?? 0) + 1);
          if (rowAbove) rowAbove[x] = Math.min(4, (rowAbove[x] ?? 0) + 1);
          if (rowBelow) rowBelow[x] = Math.min(4, (rowBelow[x] ?? 0) + 1);
        }
      }
      isX = !isX;
    }
  }
  
  // Also check for circles, rects, lines
  const circleMatches = icon.content.matchAll(/cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/g);
  for (const match of circleMatches) {
    const cxStr = match[1];
    const cyStr = match[2];
    const rStr = match[3];
    if (!cxStr || !cyStr || !rStr) continue;
    
    const cx = Math.floor(parseFloat(cxStr) * scaleX);
    const cy = Math.floor(parseFloat(cyStr) * scaleY);
    const r = Math.ceil(parseFloat(rStr) * Math.min(scaleX, scaleY));
    
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        const row = grid[py];
        if (row && px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r) {
            row[px] = Math.min(4, (row[px] ?? 0) + 2);
          }
        }
      }
    }
  }
  
  // Render grid
  const lines: string[] = [];
  for (const row of grid) {
    lines.push(row.map((v) => chars[v] ?? " ").join(""));
  }
  
  return lines.join("\n");
}

interface Icon {
  id: string;
  name: string;
  normalizedName: string;
  sourceId: string;
  viewBox: string;
  content: string;
  category: string | null;
  tags: string[];
  strokeWidth: string | null;
}

interface SearchResponse {
  icons: Icon[];
  hasMore: boolean;
  searchType?: string;
  expandedQuery?: string;
}

async function fetchIcons(
  params: {
    query?: string | undefined;
    category?: string | undefined;
    source?: string | undefined;
    limit?: number | undefined;
  },
  options: { useCache?: boolean } = { useCache: true }
): Promise<SearchResponse> {
  // Check cache first
  if (options.useCache) {
    const cacheKey = getCacheKey({ type: "icons", ...params });
    const cached = getFromCache<SearchResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = new URL(`${API_BASE}/api/icons`);
  if (params.query) url.searchParams.set("q", params.query);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.source) url.searchParams.set("source", params.source);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json() as SearchResponse;
  
  // Cache the result
  if (options.useCache) {
    const cacheKey = getCacheKey({ type: "icons", ...params });
    setCache(cacheKey, data);
  }
  
  return data;
}

async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/icons?limit=1`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  // Categories come from a separate endpoint or we can list known ones
  // For now, return common categories
  return [
    "Arrows",
    "Communication",
    "Dashboards",
    "Devices",
    "Editing",
    "Files",
    "General",
    "Media",
    "Navigation",
    "Shapes",
    "Social",
    "Weather",
  ];
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Generate raw SVG attributes (kebab-case) for use in .svg files.
 * Includes normalized stroke defaults for consistency.
 */
function getSvgAttributes(icon: Icon): string {
  const mode = getIconRenderMode(icon.sourceId);
  
  if (mode === "fill") {
    return 'fill="currentColor"';
  }
  
  const strokeWidth = parseFloat(icon.strokeWidth || "2") || DEFAULT_STROKE.strokeWidth;
  
  return [
    'fill="none"',
    'stroke="currentColor"',
    `stroke-width="${strokeWidth}"`,
    `stroke-linecap="${DEFAULT_STROKE.strokeLinecap}"`,
    `stroke-linejoin="${DEFAULT_STROKE.strokeLinejoin}"`,
  ].join(" ");
}

/**
 * Generate JSX attributes (camelCase) for React components.
 * Uses curly braces for numeric values (strokeWidth={2}).
 */
function getJsxAttributes(icon: Icon): string {
  const mode = getIconRenderMode(icon.sourceId);
  
  if (mode === "fill") {
    return 'fill="currentColor"';
  }
  
  const strokeWidth = parseFloat(icon.strokeWidth || "2") || DEFAULT_STROKE.strokeWidth;
  
  return [
    'fill="none"',
    'stroke="currentColor"',
    `strokeWidth={${strokeWidth}}`,
    `strokeLinecap="${DEFAULT_STROKE.strokeLinecap}"`,
    `strokeLinejoin="${DEFAULT_STROKE.strokeLinejoin}"`,
  ].join(" ");
}

function generateReactComponents(icons: Icon[]): string {
  const components = icons.map((icon) => {
    const name = toPascalCase(icon.normalizedName);
    const attrs = getJsxAttributes(icon);
    return `export function ${name}({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${attrs}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}`;
  });

  return `/**
 * Icon components generated by @webrenew/unicon
 * @see https://unicon.webrenew.com
 */
import type { SVGProps } from "react";

${components.join("\n\n")}
`;
}

function generateSvgBundle(icons: Icon[]): string {
  return icons
    .map((icon) => {
      const attrs = getSvgAttributes(icon);
      return `<!-- ${icon.normalizedName} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs} aria-hidden="true" focusable="false">
  ${icon.content}
</svg>`;
    })
    .join("\n\n");
}

function generateJsonBundle(icons: Icon[]): string {
  return JSON.stringify(
    icons.map((icon) => ({
      id: icon.id,
      name: icon.normalizedName,
      source: icon.sourceId,
      viewBox: icon.viewBox,
      content: icon.content,
      tags: icon.tags,
      category: icon.category,
    })),
    null,
    2
  );
}

const program = new Command();

program
  .name("unicon")
  .description("CLI for searching and bundling icons from Unicon")
  .version("0.1.0")
  .hook("preAction", (thisCommand) => {
    // Show banner only for main commands, not subcommands
    if (thisCommand.args.length === 0 || process.argv.includes("--help") || process.argv.includes("-h")) {
      return;
    }
  })
  .addHelpText("beforeAll", () => {
    showBanner();
    return "";
  });

// Search command
program
  .command("search <query>")
  .description("Search for icons by name or keyword")
  .option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)")
  .option("-c, --category <category>", "Filter by category")
  .option("-l, --limit <number>", "Maximum number of results", "20")
  .option("-j, --json", "Output as JSON")
  .action(async (query: string, options) => {
    const spinner = ora("Searching icons...").start();

    try {
      const { icons, searchType, expandedQuery } = await fetchIcons({
        query,
        source: options.source,
        category: options.category,
        limit: parseInt(options.limit, 10),
      });

      spinner.stop();

      if (icons.length === 0) {
        console.log(chalk.yellow("No icons found."));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(icons, null, 2));
        return;
      }

      if (searchType === "semantic" && expandedQuery) {
        console.log(chalk.dim(`AI expanded: "${expandedQuery}"\n`));
      }

      console.log(chalk.bold(`Found ${icons.length} icons:\n`));

      icons.forEach((icon) => {
        const source = chalk.dim(`[${icon.sourceId}]`);
        const category = icon.category ? chalk.cyan(icon.category) : "";
        console.log(`  ${chalk.green(icon.normalizedName)} ${source} ${category}`);
      });

      console.log(
        chalk.dim(`\nUse ${chalk.white("unicon get <name>")} to copy a single icon.`)
      );
    } catch (error) {
      spinner.fail("Search failed");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Info command - show icon details
program
  .command("info <name>")
  .description("Show detailed information about an icon")
  .option("-s, --source <source>", "Prefer source (lucide, phosphor, hugeicons)")
  .action(async (name: string, options) => {
    const spinner = ora("Fetching icon info...").start();

    try {
      const { icons } = await fetchIcons({
        query: name,
        source: options.source,
        limit: 10,
      });

      const exactMatch = icons.find(
        (i) => i.normalizedName === name || i.normalizedName === name.toLowerCase()
      );
      const icon = exactMatch || icons[0];

      if (!icon) {
        spinner.fail(`Icon "${name}" not found.`);
        process.exit(1);
      }

      spinner.stop();

      console.log();
      console.log(chalk.bold.cyan(icon.normalizedName));
      console.log(chalk.dim("─".repeat(40)));
      console.log();
      console.log(`  ${chalk.dim("Source:")}     ${chalk.yellow(icon.sourceId)}`);
      console.log(`  ${chalk.dim("Category:")}   ${icon.category || chalk.dim("none")}`);
      console.log(`  ${chalk.dim("ViewBox:")}    ${icon.viewBox}`);
      console.log(`  ${chalk.dim("Tags:")}       ${icon.tags?.join(", ") || chalk.dim("none")}`);
      console.log();
      console.log(chalk.dim("Commands:"));
      console.log(`  ${chalk.white(`unicon get ${icon.normalizedName}`)}`);
      console.log(`  ${chalk.white(`unicon get ${icon.normalizedName} --format svg`)}`);
      console.log();
    } catch (error) {
      spinner.fail("Failed to fetch icon info");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Get command - copy a single icon (like shadcn add)
program
  .command("get <name>")
  .description("Get a single icon by name (outputs to stdout)")
  .option("-s, --source <source>", "Prefer source (lucide, phosphor, hugeicons)")
  .option("-f, --format <format>", "Output format: react, vue, svelte, svg, json", "react")
  .option("-o, --output <path>", "Write to file instead of stdout")
  .action(async (name: string, options) => {
    try {
      const { icons } = await fetchIcons({
        query: name,
        source: options.source,
        limit: 10,
      });

      // Find exact match first, then partial
      const exactMatch = icons.find(
        (i) => i.normalizedName === name || i.normalizedName === name.toLowerCase()
      );
      const icon = exactMatch || icons[0];

      if (!icon) {
        console.error(chalk.red(`Icon "${name}" not found.`));
        console.error(chalk.dim(`Try: unicon search "${name}"`));
        process.exit(1);
      }

      let content: string;
      const componentName = toPascalCase(icon.normalizedName);
      const svgAttrs = getSvgAttributes(icon);
      const jsxAttrs = getJsxAttributes(icon);

      switch (options.format) {
        case "svg":
          content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${svgAttrs} aria-hidden="true" focusable="false">
  ${icon.content}
</svg>`;
          break;
        case "json":
          content = JSON.stringify({
            name: icon.normalizedName,
            source: icon.sourceId,
            viewBox: icon.viewBox,
            content: icon.content,
          }, null, 2);
          break;
        case "vue":
          content = `<!-- Generated by @webrenew/unicon - https://unicon.webrenew.com -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${icon.viewBox}"
    ${svgAttrs}
    aria-hidden="true"
    :focusable="false"
    :class="className"
    v-bind="$attrs"
  >
    ${icon.content}
  </svg>
</template>

<script setup lang="ts">
defineProps<{ className?: string }>();
</script>`;
          break;
        case "svelte":
          content = `<!-- Generated by @webrenew/unicon - https://unicon.webrenew.com -->
<script lang="ts">
  let className: string = "";
  export { className as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${icon.viewBox}"
  ${svgAttrs}
  aria-hidden="true"
  focusable="false"
  class={className}
  {...$$restProps}
>
  ${icon.content}
</svg>`;
          break;
        case "react":
        default:
          content = `// Generated by @webrenew/unicon - https://unicon.webrenew.com
import type { SVGProps } from "react";

export function ${componentName}({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${jsxAttrs}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}`;
          break;
      }

      if (options.output) {
        const fullPath = resolve(process.cwd(), options.output);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, content, "utf-8");
        console.error(chalk.green(`✓ ${componentName} → ${options.output}`));
      } else {
        // Output to stdout (no colors, pipe-friendly)
        console.log(content);
      }
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Bundle command
program
  .command("bundle")
  .description("Bundle icons for tree-shakeable imports (split by default for components)")
  .option("-q, --query <query>", "Search query")
  .option("-c, --category <category>", "Filter by category")
  .option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)")
  .option("-f, --format <format>", "Output format: react, vue, svelte, svg, json", "react")
  .option("-o, --output <path>", "Output file/directory path")
  .option("-l, --limit <number>", "Maximum number of icons", "100")
  .option("--single-file", "Combine all icons into one file (not recommended for components)")
  .action(async (options) => {
    if (!options.query && !options.category && !options.source) {
      console.log(
        chalk.yellow("Please provide at least one filter: --query, --category, or --source")
      );
      process.exit(1);
    }

    const isComponentFormat = ["react", "vue", "svelte"].includes(options.format);
    
    // Vue/Svelte MUST use split mode - single file is invalid syntax
    if ((options.format === "vue" || options.format === "svelte") && options.singleFile) {
      console.log(
        chalk.red(`Error: --single-file is not supported for ${options.format} format.`)
      );
      console.log(
        chalk.dim(`Vue and Svelte require one component per file. Remove --single-file.`)
      );
      process.exit(1);
    }

    // Default to split mode for component formats (tree-shakeable)
    const useSplitMode = isComponentFormat && !options.singleFile;

    const spinner = ora("Fetching icons...").start();

    try {
      const { icons } = await fetchIcons({
        query: options.query,
        category: options.category,
        source: options.source,
        limit: parseInt(options.limit, 10),
      });

      if (icons.length === 0) {
        spinner.fail("No icons found matching your criteria");
        process.exit(1);
      }

      // Warn if using single-file mode with many icons
      if (options.singleFile && icons.length > 10) {
        spinner.warn(
          chalk.yellow(`Bundling ${icons.length} icons into a single file is not tree-shakeable.`)
        );
        console.log(chalk.dim(`  Consider removing --single-file for better bundle optimization.\n`));
        spinner.start("Generating bundle...");
      }

      // Split mode - one file per icon (default for components)
      if (useSplitMode) {
        const outDir = options.output || "./icons";
        const fullDir = resolve(process.cwd(), outDir);
        mkdirSync(fullDir, { recursive: true });

        spinner.text = `Writing ${icons.length} icons to ${outDir}/...`;

        const extMap: Record<string, string> = {
          react: "tsx",
          vue: "vue",
          svelte: "svelte",
          svg: "svg",
          json: "json",
        };
        const ext = extMap[options.format] || "tsx";

        for (const icon of icons) {
          const fileName = `${icon.normalizedName}.${ext}`;
          const filePath = join(fullDir, fileName);
          const name = toPascalCase(icon.normalizedName);
          const svgAttrs = getSvgAttributes(icon);
          const jsxAttrs = getJsxAttributes(icon);
          let content: string;

          switch (options.format) {
            case "svg":
              content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${svgAttrs} aria-hidden="true" focusable="false">\n  ${icon.content}\n</svg>`;
              break;
            case "json":
              content = JSON.stringify({
                name: icon.normalizedName,
                source: icon.sourceId,
                viewBox: icon.viewBox,
                content: icon.content,
              }, null, 2);
              break;
            case "vue":
              content = `<!-- Generated by @webrenew/unicon -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${icon.viewBox}"
    ${svgAttrs}
    aria-hidden="true"
    :focusable="false"
    :class="className"
    v-bind="$attrs"
  >
    ${icon.content}
  </svg>
</template>

<script setup lang="ts">
defineProps<{ className?: string }>();
</script>
`;
              break;
            case "svelte":
              content = `<!-- Generated by @webrenew/unicon -->
<script lang="ts">
  let className: string = "";
  export { className as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${icon.viewBox}"
  ${svgAttrs}
  aria-hidden="true"
  focusable="false"
  class={className}
  {...$$restProps}
>
  ${icon.content}
</svg>
`;
              break;
            case "react":
            default:
              content = `// @webrenew/unicon
import type { SVGProps } from "react";

export function ${name}({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      ${jsxAttrs}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}
`;
              break;
          }

          writeFileSync(filePath, content, "utf-8");
        }

        // Generate index file for component formats
        if (["react", "vue", "svelte"].includes(options.format)) {
          let indexContent: string;
          
          if (options.format === "react") {
            // React: named exports
            indexContent = `// Tree-shakeable re-exports. Add "sideEffects": false to package.json.
${icons.map((icon) => `export { ${toPascalCase(icon.normalizedName)} } from "./${icon.normalizedName}";`).join("\n")}
`;
          } else {
            // Vue/Svelte: default exports from SFCs
            indexContent = `// Tree-shakeable re-exports. Add "sideEffects": false to package.json.
${icons.map((icon) => `export { default as ${toPascalCase(icon.normalizedName)} } from "./${icon.normalizedName}.${ext}";`).join("\n")}
`;
          }
          
          writeFileSync(join(fullDir, "index.ts"), indexContent, "utf-8");
        }

        spinner.succeed(`${chalk.green(icons.length)} icons → ${chalk.cyan(outDir)}/`);
        console.log(chalk.green(`  ✓ Tree-shakeable! Only imported icons will be bundled.`));
        console.log(chalk.dim(`  Import: import { Home, Settings } from "${outDir}";`));
        return;
      }

      // Single-file mode (only for svg, json, or react with --single-file)
      spinner.text = `Generating ${options.format} bundle for ${icons.length} icons...`;

      let content: string;
      let ext: string;

      switch (options.format) {
        case "svg":
          content = generateSvgBundle(icons);
          ext = "svg";
          break;
        case "json":
          content = generateJsonBundle(icons);
          ext = "json";
          break;
        case "react":
        default:
          content = generateReactComponents(icons);
          ext = "tsx";
          break;
      }

      const outputPath = options.output || `icons.${ext}`;
      const fullPath = resolve(process.cwd(), outputPath);

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, "utf-8");

      spinner.succeed(
        `Bundled ${chalk.green(icons.length)} icons to ${chalk.cyan(outputPath)}`
      );

      // Show summary and warnings
      const sources = [...new Set(icons.map((i) => i.sourceId))];
      console.log(chalk.dim(`  Sources: ${sources.join(", ")}`));
      console.log(chalk.dim(`  Format: ${options.format}`));
      
      // Warn about tree-shaking for React single-file
      if (options.format === "react") {
        console.log();
        console.log(chalk.yellow(`  ⚠ Single-file mode is NOT tree-shakeable.`));
        console.log(chalk.dim(`    All ${icons.length} icons will be included in your bundle.`));
        console.log(chalk.dim(`    For tree-shaking, remove --single-file flag.`));
      }
    } catch (error) {
      spinner.fail("Bundle failed");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Categories command
program
  .command("categories")
  .description("List available icon categories")
  .option("-j, --json", "Output as JSON")
  .action(async (options) => {
    const spinner = ora("Fetching categories...").start();

    try {
      const categories = await fetchCategories();
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(categories, null, 2));
        return;
      }

      console.log(chalk.bold("Available categories:\n"));
      categories.forEach((cat) => {
        console.log(`  ${chalk.green("•")} ${cat}`);
      });

      console.log(
        chalk.dim(`\nUse ${chalk.white("unicon bundle --category <name>")} to export a category.`)
      );
    } catch (error) {
      spinner.fail("Failed to fetch categories");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Sources command
program
  .command("sources")
  .description("List available icon sources/libraries")
  .action(() => {
    console.log(chalk.bold("Available icon sources:\n"));
    console.log(`  ${chalk.green("•")} ${chalk.yellow("lucide")}    - Lucide Icons`);
    console.log(`  ${chalk.green("•")} ${chalk.cyan("phosphor")}  - Phosphor Icons`);
    console.log(`  ${chalk.green("•")} ${chalk.magenta("hugeicons")} - Huge Icons`);
    console.log(
      chalk.dim(`\nUse ${chalk.white("unicon bundle --source <name>")} to export from a source.`)
    );
  });

// Init command
program
  .command("init")
  .description("Initialize a .uniconrc.json config file")
  .option("-f, --force", "Overwrite existing config")
  .action((options) => {
    const configPath = resolve(process.cwd(), CONFIG_FILE);
    
    if (existsSync(configPath) && !options.force) {
      console.log(chalk.yellow(`${CONFIG_FILE} already exists. Use --force to overwrite.`));
      process.exit(1);
    }

    const config = createDefaultConfig();
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    console.log(chalk.green(`✓ Created ${CONFIG_FILE}\n`));
    console.log(chalk.dim("Default bundles configured:"));
    config.bundles.forEach((bundle) => {
      console.log(`  ${chalk.cyan(bundle.name)} → ${bundle.output}`);
    });
    console.log(chalk.dim(`\nRun ${chalk.white("unicon sync")} to generate bundles.`));
  });

// Sync command
program
  .command("sync")
  .description("Generate all bundles from .uniconrc.json")
  .option("-n, --name <name>", "Sync only a specific bundle by name")
  .option("-d, --dry-run", "Show what would be generated without writing files")
  .action(async (options) => {
    const config = loadConfig();
    
    if (!config) {
      console.log(chalk.yellow(`No ${CONFIG_FILE} found. Run ${chalk.white("unicon init")} first.`));
      process.exit(1);
    }

    const bundlesToSync = options.name
      ? config.bundles.filter((b) => b.name === options.name)
      : config.bundles;

    if (bundlesToSync.length === 0) {
      if (options.name) {
        console.log(chalk.yellow(`Bundle "${options.name}" not found in config.`));
      } else {
        console.log(chalk.yellow("No bundles configured."));
      }
      process.exit(1);
    }

    console.log(chalk.bold(`Syncing ${bundlesToSync.length} bundle${bundlesToSync.length > 1 ? "s" : ""}...\n`));

    let successCount = 0;
    let errorCount = 0;

    for (const bundle of bundlesToSync) {
      const spinner = ora(`${bundle.name}: Fetching icons...`).start();

      try {
        if (!bundle.query && !bundle.category && !bundle.source) {
          spinner.warn(`${bundle.name}: Skipped (no query, category, or source specified)`);
          continue;
        }

        const { icons } = await fetchIcons({
          query: bundle.query,
          category: bundle.category,
          source: bundle.source,
          limit: bundle.limit || 100,
        });

        if (icons.length === 0) {
          spinner.warn(`${bundle.name}: No icons found`);
          continue;
        }

        const format = bundle.format || "react";
        let content: string;

        switch (format) {
          case "svg":
            content = generateSvgBundle(icons);
            break;
          case "json":
            content = generateJsonBundle(icons);
            break;
          case "react":
          default:
            content = generateReactComponents(icons);
            break;
        }

        if (options.dryRun) {
          spinner.info(`${bundle.name}: Would write ${icons.length} icons to ${bundle.output}`);
        } else {
          const fullPath = resolve(process.cwd(), bundle.output);
          mkdirSync(dirname(fullPath), { recursive: true });
          writeFileSync(fullPath, content, "utf-8");
          spinner.succeed(`${bundle.name}: ${chalk.green(icons.length)} icons → ${chalk.cyan(bundle.output)}`);
        }

        successCount++;
      } catch (error) {
        spinner.fail(`${bundle.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
        errorCount++;
      }
    }

    console.log();
    if (errorCount === 0) {
      console.log(chalk.green(`✓ All ${successCount} bundles synced successfully`));
    } else {
      console.log(chalk.yellow(`Completed with ${errorCount} error${errorCount > 1 ? "s" : ""}`));
    }
  });

// Add command - add a bundle to config
program
  .command("add <name>")
  .description("Add a new bundle to .uniconrc.json")
  .option("-q, --query <query>", "Search query")
  .option("-c, --category <category>", "Filter by category")
  .option("-s, --source <source>", "Filter by source")
  .option("-f, --format <format>", "Output format: react, svg, json", "react")
  .option("-l, --limit <number>", "Maximum icons", "50")
  .option("-o, --output <path>", "Output file path")
  .action((name: string, options) => {
    let config = loadConfig();
    
    if (!config) {
      console.log(chalk.yellow(`No ${CONFIG_FILE} found. Creating one...`));
      config = { bundles: [] };
    }

    // Check for duplicate
    if (config.bundles.some((b) => b.name === name)) {
      console.log(chalk.yellow(`Bundle "${name}" already exists in config.`));
      process.exit(1);
    }

    if (!options.query && !options.category && !options.source) {
      console.log(chalk.yellow("Please provide at least one filter: --query, --category, or --source"));
      process.exit(1);
    }

    const ext = options.format === "json" ? "json" : options.format === "svg" ? "svg" : "tsx";
    const newBundle: BundleConfig = {
      name,
      output: options.output || `./src/icons/${name}.${ext}`,
      format: options.format,
      limit: parseInt(options.limit, 10),
    };

    if (options.query) newBundle.query = options.query;
    if (options.category) newBundle.category = options.category;
    if (options.source) newBundle.source = options.source;

    config.bundles.push(newBundle);

    const configPath = resolve(process.cwd(), CONFIG_FILE);
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    console.log(chalk.green(`✓ Added bundle "${name}" to ${CONFIG_FILE}`));
    console.log(chalk.dim(`  Output: ${newBundle.output}`));
    console.log(chalk.dim(`\nRun ${chalk.white(`unicon sync --name ${name}`)} to generate.`));
  });

// Preview command - ASCII art preview of an icon
program
  .command("preview <name>")
  .description("Show ASCII art preview of an icon in the terminal")
  .option("-s, --source <source>", "Prefer source (lucide, phosphor, hugeicons)")
  .option("-w, --width <number>", "Preview width", "20")
  .option("-h, --height <number>", "Preview height", "20")
  .action(async (name: string, options) => {
    const spinner = ora("Fetching icon...").start();

    try {
      const { icons } = await fetchIcons({
        query: name,
        source: options.source,
        limit: 10,
      });

      const exactMatch = icons.find(
        (i) => i.normalizedName === name || i.normalizedName === name.toLowerCase()
      );
      const icon = exactMatch || icons[0];

      if (!icon) {
        spinner.fail(`Icon "${name}" not found.`);
        process.exit(1);
      }

      spinner.stop();

      const width = parseInt(options.width, 10);
      const height = parseInt(options.height, 10);
      const preview = renderAsciiPreview(icon, width, height);

      console.log();
      console.log(chalk.bold.cyan(icon.normalizedName) + chalk.dim(` (${icon.sourceId})`));
      console.log(chalk.dim("─".repeat(width)));
      console.log(chalk.yellow(preview));
      console.log(chalk.dim("─".repeat(width)));
      console.log();
      console.log(chalk.dim(`Get: ${chalk.white(`unicon get ${icon.normalizedName}`)}`));
      console.log();
    } catch (error) {
      spinner.fail("Failed to fetch icon");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Cache command - manage local cache
program
  .command("cache")
  .description("Manage local icon cache")
  .option("-c, --clear", "Clear all cached data")
  .option("-s, --stats", "Show cache statistics")
  .action((options) => {
    if (options.clear) {
      const { count, size } = clearCache();
      console.log(chalk.green(`✓ Cleared ${count} cached items (${(size / 1024).toFixed(1)} KB)`));
      return;
    }

    if (options.stats || (!options.clear && !options.stats)) {
      const { count, size, oldest } = getCacheStats();

      console.log(chalk.bold("Cache Statistics\n"));
      console.log(`  ${chalk.dim("Location:")} ${CACHE_DIR}`);
      console.log(`  ${chalk.dim("Items:")}    ${count}`);
      console.log(`  ${chalk.dim("Size:")}     ${(size / 1024).toFixed(1)} KB`);
      console.log(`  ${chalk.dim("TTL:")}      24 hours`);

      if (oldest) {
        const age = Math.round((Date.now() - oldest.getTime()) / 1000 / 60);
        console.log(`  ${chalk.dim("Oldest:")}   ${age} minutes ago`);
      }

      console.log();
      console.log(chalk.dim(`Clear with: ${chalk.white("unicon cache --clear")}`));
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Skill Installation
// ─────────────────────────────────────────────────────────────────────────────

interface IDEConfig {
  name: string;
  dir: string;
  filename: string;
  format: "claude" | "cursor" | "generic";
  description: string;
}

// All IDEs use consistent structure: .<ide>/skills/unicon/SKILL.md + README.md
const IDE_CONFIGS: Record<string, IDEConfig> = {
  claude: {
    name: "Claude Code",
    dir: ".claude/skills/unicon",
    filename: "SKILL.md",
    format: "claude",
    description: "Claude Code (Anthropic CLI)",
  },
  codex: {
    name: "Codex",
    dir: ".codex/skills/unicon",
    filename: "SKILL.md",
    format: "generic",
    description: "OpenAI Codex CLI",
  },
  cursor: {
    name: "Cursor",
    dir: ".cursor/skills/unicon",
    filename: "SKILL.md",
    format: "cursor",
    description: "Cursor IDE",
  },
  agents: {
    name: "Agents",
    dir: ".agents/skills/unicon",
    filename: "SKILL.md",
    format: "generic",
    description: "Generic .agents directory",
  },
  windsurf: {
    name: "Windsurf",
    dir: ".windsurf/skills/unicon",
    filename: "SKILL.md",
    format: "generic",
    description: "Windsurf (Codeium)",
  },
  opencode: {
    name: "OpenCode",
    dir: ".opencode/skills/unicon",
    filename: "SKILL.md",
    format: "generic",
    description: "OpenCode",
  },
  gemini: {
    name: "Gemini",
    dir: ".gemini/skills/unicon",
    filename: "SKILL.md",
    format: "generic",
    description: "Google Gemini CLI",
  },
};

function getSkillContent(format: IDEConfig["format"]): string {
  // Claude Code format (full SKILL.md with frontmatter)
  if (format === "claude") {
    return `---
name: unicon
description: Add icons to projects using the Unicon unified icon library. Use when adding icons, searching for icons, or bundling icons for React, Vue, or Svelte projects.
metadata:
  author: webrenew
  version: "1.0.0"
  argument-hint: <icon-name-or-query>
---

# Unicon - Unified Icon Library

Add icons from 15,000+ icons across Lucide, Phosphor, Heroicons, Tabler, Feather, Remix, and Simple Icons. AI-powered semantic search finds the right icon even with vague descriptions.

## Quick Usage

### Search for icons
\`\`\`bash
npx @webrenew/unicon search "dashboard"
npx @webrenew/unicon search "notification bell"
npx @webrenew/unicon search "social media" --source phosphor
\`\`\`

### Get a single icon (React component)
\`\`\`bash
npx @webrenew/unicon get home
npx @webrenew/unicon get home --format svg
npx @webrenew/unicon get home --format vue
npx @webrenew/unicon get home -o src/icons/Home.tsx
\`\`\`

### Bundle multiple icons
\`\`\`bash
# Tree-shakeable output (recommended)
npx @webrenew/unicon bundle --query "arrow chevron" -o src/icons/
npx @webrenew/unicon bundle --category Navigation -o src/icons/

# Single file (not tree-shakeable)
npx @webrenew/unicon bundle --query "dashboard" --single-file -o src/icons/dashboard.tsx
\`\`\`

## Output Formats

| Format | Flag | Use Case |
|--------|------|----------|
| React | \`--format react\` (default) | React/Next.js projects |
| Vue | \`--format vue\` | Vue 3 projects |
| Svelte | \`--format svelte\` | Svelte/SvelteKit projects |
| SVG | \`--format svg\` | Raw SVG files |
| JSON | \`--format json\` | Custom rendering |

## Icon Sources

| Source | Flag | Icons |
|--------|------|-------|
| Lucide | \`--source lucide\` | 1,900+ stroke icons |
| Phosphor | \`--source phosphor\` | 1,500+ fill icons |
| Heroicons | \`--source heroicons\` | 292 Tailwind icons |
| Tabler | \`--source tabler\` | 4,600+ stroke icons |
| Feather | \`--source feather\` | 287 minimalist icons |
| Remix | \`--source remix\` | 2,800+ icons |
| Simple Icons | \`--source simple-icons\` | 3,300+ brand logos |

## Generated Component Pattern

React components are generated with this signature:

\`\`\`tsx
import type { SVGProps } from "react";

export function IconName({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {/* icon paths */}
    </svg>
  );
}
\`\`\`

## Best Practices

1. **Use semantic search**: Describe what you need ("loading spinner", "send message") rather than exact names
2. **Tree-shakeable bundles**: Use split mode (default) for icon bundles - only imported icons ship to users
3. **Consistent sources**: Stick to one icon source per project for visual consistency
4. **Stroke icons**: Lucide, Tabler, Feather use strokes (scale better)
5. **Fill icons**: Phosphor uses fills (better for solid icons)

## Project Setup with Config File

For projects with multiple icon needs:

\`\`\`bash
# Initialize config
npx @webrenew/unicon init

# Add bundles to config
npx @webrenew/unicon add navigation --query "arrow chevron menu" --limit 30
npx @webrenew/unicon add social --category Social --source simple-icons

# Regenerate all bundles
npx @webrenew/unicon sync
\`\`\`

## When to Use Unicon

- Adding icons to a new component
- Searching for an icon by concept ("celebration", "analytics")
- Bundling icons for a feature area
- Generating type-safe React/Vue/Svelte icon components
- Finding brand logos (use Simple Icons source)
`;
  }

  // Cursor format (MDC with frontmatter)
  if (format === "cursor") {
    return `---
description: Add icons to projects using Unicon unified icon library. Use when adding icons, searching for icons, or bundling icons for React, Vue, or Svelte.
globs: ["**/*.tsx", "**/*.jsx", "**/*.vue", "**/*.svelte"]
---

# Unicon - Unified Icon Library

Add icons from 15,000+ icons across Lucide, Phosphor, Heroicons, Tabler, Feather, Remix, and Simple Icons.

## Commands

### Search for icons
\`\`\`bash
npx @webrenew/unicon search "dashboard"
npx @webrenew/unicon search "notification bell"
\`\`\`

### Get a single icon
\`\`\`bash
npx @webrenew/unicon get home -o src/icons/Home.tsx
npx @webrenew/unicon get home --format vue -o src/icons/Home.vue
\`\`\`

### Bundle multiple icons (tree-shakeable)
\`\`\`bash
npx @webrenew/unicon bundle --query "arrow chevron" -o src/icons/
npx @webrenew/unicon bundle --category Navigation -o src/icons/
\`\`\`

## Output Formats
- \`--format react\` (default) - React/Next.js
- \`--format vue\` - Vue 3
- \`--format svelte\` - Svelte/SvelteKit
- \`--format svg\` - Raw SVG

## Icon Sources
- \`--source lucide\` - 1,900+ stroke icons
- \`--source phosphor\` - 1,500+ fill icons
- \`--source heroicons\` - 292 Tailwind icons
- \`--source tabler\` - 4,600+ stroke icons
- \`--source simple-icons\` - 3,300+ brand logos

## Generated Component Pattern
\`\`\`tsx
import type { SVGProps } from "react";

export function IconName({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} {...props}>
      {/* paths */}
    </svg>
  );
}
\`\`\`

## Best Practices
1. Use semantic search - describe what you need ("loading spinner") not exact names
2. Use tree-shakeable bundles (default) - only imported icons ship
3. Stick to one icon source per project for visual consistency
`;
  }

  // Generic format (for codex, agents, windsurf, opencode, gemini)
  return `# Unicon - Unified Icon Library

Add icons from 15,000+ icons across Lucide, Phosphor, Heroicons, Tabler, Feather, Remix, and Simple Icons.

## Search for icons
\`\`\`bash
npx @webrenew/unicon search "dashboard"
npx @webrenew/unicon search "notification bell"
npx @webrenew/unicon search "social media" --source phosphor
\`\`\`

## Get a single icon
\`\`\`bash
npx @webrenew/unicon get home                              # React (default)
npx @webrenew/unicon get home --format vue                 # Vue
npx @webrenew/unicon get home --format svelte              # Svelte
npx @webrenew/unicon get home --format svg                 # Raw SVG
npx @webrenew/unicon get home -o src/icons/Home.tsx        # Output to file
\`\`\`

## Bundle multiple icons
\`\`\`bash
# Tree-shakeable (recommended)
npx @webrenew/unicon bundle --query "arrow chevron" -o src/icons/

# By category
npx @webrenew/unicon bundle --category Navigation -o src/icons/

# Single file
npx @webrenew/unicon bundle --query "dashboard" --single-file -o src/icons/dashboard.tsx
\`\`\`

## Icon Sources
| Source | Flag | Description |
|--------|------|-------------|
| Lucide | \`--source lucide\` | 1,900+ stroke icons |
| Phosphor | \`--source phosphor\` | 1,500+ fill icons |
| Heroicons | \`--source heroicons\` | 292 Tailwind icons |
| Tabler | \`--source tabler\` | 4,600+ stroke icons |
| Simple Icons | \`--source simple-icons\` | 3,300+ brand logos |

## Generated Component
\`\`\`tsx
import type { SVGProps } from "react";

export function IconName({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} {...props}>
      {/* icon paths */}
    </svg>
  );
}
\`\`\`

## Best Practices
1. Use semantic search - describe what you need, not exact names
2. Use tree-shakeable bundles (default) - only imported icons ship to users
3. Stick to one icon source per project for visual consistency
`;
}

function getReadmeContent(): string {
  return `# Unicon Skill

This skill enables AI assistants to help you add icons to your project using the [Unicon](https://unicon.dev) unified icon library.

## What is Unicon?

Unicon provides access to 15,000+ icons from popular libraries:
- **Lucide** - 1,900+ stroke icons
- **Phosphor** - 1,500+ fill icons
- **Heroicons** - 292 Tailwind icons
- **Tabler** - 4,600+ stroke icons
- **Feather** - 287 minimalist icons
- **Remix** - 2,800+ icons
- **Simple Icons** - 3,300+ brand logos
- **Iconoir** - 1,500+ minimalist icons

## Usage

Ask your AI assistant to:
- "Add a home icon to my project"
- "Search for dashboard icons"
- "Bundle navigation icons for my app"
- "Get a loading spinner icon"

## Learn More

- Website: https://unicon.dev
- CLI: \`npx @webrenew/unicon --help\`
- GitHub: https://github.com/WebRenew/unicon
`;
}

function detectIDEs(): string[] {
  const detected: string[] = [];
  const cwd = process.cwd();

  for (const [key, config] of Object.entries(IDE_CONFIGS)) {
    // Check if the parent directory exists (e.g., .claude, .cursor)
    const parentDir = config.dir.split("/")[0];
    if (parentDir && existsSync(join(cwd, parentDir))) {
      detected.push(key);
    }
  }

  return detected;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills Registry (fetch from public /skills/index.json)
// ─────────────────────────────────────────────────────────────────────────────

interface SkillRegistryEntry {
  id: string;
  name: string;
  description: string;
  file: string;
  tags: string[];
}

async function fetchSkillsIndex(): Promise<SkillRegistryEntry[]> {
  const res = await fetch(`${API_BASE}/skills/index.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch skills registry: ${res.status}`);
  }
  const data = (await res.json()) as { skills: SkillRegistryEntry[] };
  return data.skills;
}

async function fetchSkillContent(file: string): Promise<string> {
  const res = await fetch(`${API_BASE}/skills/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch skill: ${res.status}`);
  }
  return res.text();
}

// Skills command - list and download from registry
program
  .command("skills")
  .description("List and download skills from the Unicon public registry")
  .option("-l, --list", "List available skills")
  .option("-g, --get <id>", "Download a skill by ID and print to stdout")
  .option("-o, --output <path>", "Write downloaded skill to file instead of stdout")
  .option("-j, --json", "Output list as JSON")
  .action(async (options) => {
    // Default to list if no flags provided
    const shouldList = options.list || (!options.get);

    if (shouldList && !options.get) {
      const spinner = ora("Fetching skills registry...").start();

      try {
        const skills = await fetchSkillsIndex();
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(skills, null, 2));
          return;
        }

        console.log(chalk.bold(`\nAvailable Skills (${skills.length}):\n`));

        for (const skill of skills) {
          console.log(`  ${chalk.green(skill.id.padEnd(16))} ${chalk.dim(skill.name)}`);
          console.log(`  ${" ".repeat(16)} ${skill.description}`);
          if (skill.tags.length > 0) {
            console.log(`  ${" ".repeat(16)} ${chalk.cyan(skill.tags.join(", "))}`);
          }
          console.log();
        }

        console.log(chalk.dim(`Download with: ${chalk.white("unicon skills --get <id>")}`));
        console.log(chalk.dim(`Save to file:  ${chalk.white("unicon skills --get <id> -o SKILL.md")}`));
        console.log();
      } catch (error) {
        spinner.fail("Failed to fetch skills registry");
        console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
        process.exit(1);
      }
      return;
    }

    if (options.get) {
      const spinner = ora(`Fetching skill "${options.get}"...`).start();

      try {
        const skills = await fetchSkillsIndex();
        const skill = skills.find((s) => s.id === options.get);

        if (!skill) {
          spinner.fail(`Skill "${options.get}" not found`);
          console.log(chalk.dim(`Available: ${skills.map((s) => s.id).join(", ")}`));
          process.exit(1);
        }

        const content = await fetchSkillContent(skill.file);
        spinner.stop();

        if (options.output) {
          const fullPath = resolve(process.cwd(), options.output);
          mkdirSync(dirname(fullPath), { recursive: true });
          writeFileSync(fullPath, content, "utf-8");
          console.log(chalk.green(`✓ ${skill.name} → ${options.output}`));
        } else {
          // Output to stdout (pipe-friendly)
          console.log(content);
        }
      } catch (error) {
        spinner.fail("Failed to fetch skill");
        console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
        process.exit(1);
      }
    }
  });

// Skill install command (existing local installation)
program
  .command("skill")
  .description("Install Unicon skill/rules for AI coding assistants")
  .option("--ide <ide>", "Target IDE (claude, codex, cursor, agents, windsurf, opencode, gemini)")
  .option("--all", "Install for all supported IDEs")
  .option("-l, --list", "List supported IDEs")
  .option("-f, --force", "Overwrite existing skill files")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    // List supported IDEs
    if (options.list) {
      console.log(chalk.bold("\nSupported AI Coding Assistants:\n"));
      for (const [key, config] of Object.entries(IDE_CONFIGS)) {
        console.log(`  ${chalk.green(key.padEnd(12))} ${chalk.dim(config.description)}`);
        console.log(`  ${" ".repeat(12)} ${chalk.dim(`→ ${config.dir}/`)}`);
        console.log(`  ${" ".repeat(12)}   ${chalk.dim(`├── ${config.filename}`)}`);
        console.log(`  ${" ".repeat(12)}   ${chalk.dim(`└── README.md`)}`);
      }
      console.log();
      console.log(chalk.dim(`Install with: ${chalk.white("npx @webrenew/unicon skill --ide <name>")}`));
      console.log(chalk.dim(`Install all:  ${chalk.white("npx @webrenew/unicon skill --all")}`));
      console.log();
      return;
    }

    const cwd = process.cwd();
    let targetIDEs: string[] = [];
    let needsConfirmation = false;

    // Install all
    if (options.all) {
      targetIDEs = Object.keys(IDE_CONFIGS);
      needsConfirmation = true;
    }
    // Specific IDE
    else if (options.ide) {
      const ide = options.ide.toLowerCase();
      if (!IDE_CONFIGS[ide]) {
        console.log(chalk.red(`Unknown IDE: ${options.ide}`));
        console.log(chalk.dim(`Supported: ${Object.keys(IDE_CONFIGS).join(", ")}`));
        process.exit(1);
      }
      targetIDEs = [ide];
      // Single explicit IDE doesn't need confirmation
    }
    // Auto-detect or prompt
    else {
      const detected = detectIDEs();
      if (detected.length > 0) {
        targetIDEs = detected;
        needsConfirmation = true; // Auto-detected needs confirmation
      } else {
        // Default to common ones if nothing detected
        console.log(chalk.yellow("No IDE configuration detected. Installing for Claude Code by default."));
        console.log(chalk.dim(`Use --ide <name> or --all for other targets.`));
        targetIDEs = ["claude"];
      }
    }

    // Show what will be installed and ask for confirmation
    if (needsConfirmation && !options.yes) {
      console.log(chalk.bold("\nThe following skill directories will be created:\n"));
      for (const ideKey of targetIDEs) {
        const config = IDE_CONFIGS[ideKey];
        if (!config) continue;
        const skillFile = join(cwd, config.dir, config.filename);
        const exists = existsSync(skillFile);
        if (exists && !options.force) {
          console.log(chalk.dim(`  ⊘ ${config.name.padEnd(14)} ${config.dir}/ (already exists)`));
        } else {
          console.log(`  ${chalk.green("+")} ${config.name.padEnd(14)} ${chalk.cyan(config.dir + "/")}`);
          console.log(chalk.dim(`    ${" ".repeat(14)} ├── ${config.filename}`));
          console.log(chalk.dim(`    ${" ".repeat(14)} └── README.md`));
        }
      }
      console.log();

      const confirmed = await confirm("Proceed with installation?");
      if (!confirmed) {
        console.log(chalk.yellow("\nInstallation cancelled."));
        return;
      }
    }

    console.log(chalk.bold(`\nInstalling Unicon skill...\n`));

    let installed = 0;
    let skipped = 0;

    for (const ideKey of targetIDEs) {
      const config = IDE_CONFIGS[ideKey];
      if (!config) continue;

      const targetDir = join(cwd, config.dir);
      const skillFile = join(targetDir, config.filename);
      const readmeFile = join(targetDir, "README.md");

      // Check if skill file exists
      if (existsSync(skillFile) && !options.force) {
        console.log(chalk.yellow(`  ⊘ ${config.name}: Already exists (use --force to overwrite)`));
        skipped++;
        continue;
      }

      // Create directory and write files
      try {
        mkdirSync(targetDir, { recursive: true });

        // Write SKILL.md
        const skillContent = getSkillContent(config.format);
        writeFileSync(skillFile, skillContent, "utf-8");

        // Write README.md
        const readmeContent = getReadmeContent();
        writeFileSync(readmeFile, readmeContent, "utf-8");

        console.log(chalk.green(`  ✓ ${config.name}: ${config.dir}/`));
        console.log(chalk.dim(`      ├── ${config.filename}`));
        console.log(chalk.dim(`      └── README.md`));
        installed++;
      } catch (error) {
        console.log(chalk.red(`  ✗ ${config.name}: ${error instanceof Error ? error.message : "Failed"}`));
      }
    }

    console.log();
    if (installed > 0) {
      console.log(chalk.green(`Installed ${installed} skill${installed > 1 ? "s" : ""}.`));
    }
    if (skipped > 0) {
      console.log(chalk.dim(`Skipped ${skipped} existing skill${skipped > 1 ? "s" : ""}.`));
    }
    console.log();
    console.log(chalk.dim("Your AI assistant can now help you add icons with Unicon!"));
    console.log(chalk.dim(`Try: "Add a home icon to my project"`));
    console.log();
  });

program.parse();
