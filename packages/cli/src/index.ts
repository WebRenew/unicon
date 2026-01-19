#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

const API_BASE = process.env.UNICON_API_URL || "https://unicon.webrenew.com";

function showBanner(): void {
  const banner = figlet.textSync("UNICON", {
    font: "ANSI Shadow",
    horizontalLayout: "fitted",
  });
  
  console.log(chalk.cyan(banner));
  console.log(chalk.dim("  The unified icon library for React\n"));
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

interface CategoriesResponse {
  categories: string[];
}

async function fetchIcons(params: {
  query?: string;
  category?: string;
  source?: string;
  limit?: number;
}): Promise<SearchResponse> {
  const url = new URL(`${API_BASE}/api/icons`);
  if (params.query) url.searchParams.set("q", params.query);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.source) url.searchParams.set("source", params.source);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
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

function getSvgAttributes(icon: Icon): string {
  if (icon.sourceId === "phosphor") {
    return 'fill="currentColor"';
  }
  if (icon.sourceId === "hugeicons") {
    return 'stroke="currentColor" fill="none"';
  }
  return `fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round"`;
}

function generateReactComponents(icons: Icon[]): string {
  const components = icons.map((icon) => {
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

function generateSvgBundle(icons: Icon[]): string {
  return icons
    .map((icon) => {
      const attrs = getSvgAttributes(icon);
      return `<!-- ${icon.normalizedName} (${icon.sourceId}) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>
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
        chalk.dim(`\nUse ${chalk.white("unicon bundle <query>")} to export these icons.`)
      );
    } catch (error) {
      spinner.fail("Search failed");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

// Bundle command
program
  .command("bundle")
  .description("Bundle icons into a file")
  .option("-q, --query <query>", "Search query")
  .option("-c, --category <category>", "Filter by category")
  .option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)")
  .option("-f, --format <format>", "Output format: react, svg, json", "react")
  .option("-o, --output <path>", "Output file path")
  .option("-l, --limit <number>", "Maximum number of icons", "100")
  .action(async (options) => {
    if (!options.query && !options.category && !options.source) {
      console.log(
        chalk.yellow("Please provide at least one filter: --query, --category, or --source")
      );
      process.exit(1);
    }

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

      // Show summary
      const sources = [...new Set(icons.map((i) => i.sourceId))];
      console.log(chalk.dim(`  Sources: ${sources.join(", ")}`));
      console.log(chalk.dim(`  Format: ${options.format}`));
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

program.parse();
