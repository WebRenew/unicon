#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
var API_BASE = process.env.UNICON_API_URL || "https://unicon.webrenew.com";
function showBanner() {
  const banner = figlet.textSync("UNICON", {
    font: "ANSI Shadow",
    horizontalLayout: "fitted"
  });
  console.log(chalk.cyan(banner));
  console.log(chalk.dim("  The unified icon library for React\n"));
}
async function fetchIcons(params) {
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
async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api/icons?limit=1`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
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
    "Weather"
  ];
}
function toPascalCase(str) {
  return str.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function getSvgAttributes(icon) {
  if (icon.sourceId === "phosphor") {
    return 'fill="currentColor"';
  }
  if (icon.sourceId === "hugeicons") {
    return 'stroke="currentColor" fill="none"';
  }
  return `fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth || "2"}" stroke-linecap="round" stroke-linejoin="round"`;
}
function generateReactComponents(icons) {
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
function generateSvgBundle(icons) {
  return icons.map((icon) => {
    const attrs = getSvgAttributes(icon);
    return `<!-- ${icon.normalizedName} (${icon.sourceId}) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>
  ${icon.content}
</svg>`;
  }).join("\n\n");
}
function generateJsonBundle(icons) {
  return JSON.stringify(
    icons.map((icon) => ({
      id: icon.id,
      name: icon.normalizedName,
      source: icon.sourceId,
      viewBox: icon.viewBox,
      content: icon.content,
      tags: icon.tags,
      category: icon.category
    })),
    null,
    2
  );
}
var program = new Command();
program.name("unicon").description("CLI for searching and bundling icons from Unicon").version("0.1.0").hook("preAction", (thisCommand) => {
  if (thisCommand.args.length === 0 || process.argv.includes("--help") || process.argv.includes("-h")) {
    return;
  }
}).addHelpText("beforeAll", () => {
  showBanner();
  return "";
});
program.command("search <query>").description("Search for icons by name or keyword").option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)").option("-c, --category <category>", "Filter by category").option("-l, --limit <number>", "Maximum number of results", "20").option("-j, --json", "Output as JSON").action(async (query, options) => {
  const spinner = ora("Searching icons...").start();
  try {
    const { icons, searchType, expandedQuery } = await fetchIcons({
      query,
      source: options.source,
      category: options.category,
      limit: parseInt(options.limit, 10)
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
      console.log(chalk.dim(`AI expanded: "${expandedQuery}"
`));
    }
    console.log(chalk.bold(`Found ${icons.length} icons:
`));
    icons.forEach((icon) => {
      const source = chalk.dim(`[${icon.sourceId}]`);
      const category = icon.category ? chalk.cyan(icon.category) : "";
      console.log(`  ${chalk.green(icon.normalizedName)} ${source} ${category}`);
    });
    console.log(
      chalk.dim(`
Use ${chalk.white("unicon bundle <query>")} to export these icons.`)
    );
  } catch (error) {
    spinner.fail("Search failed");
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
});
program.command("bundle").description("Bundle icons into a file").option("-q, --query <query>", "Search query").option("-c, --category <category>", "Filter by category").option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)").option("-f, --format <format>", "Output format: react, svg, json", "react").option("-o, --output <path>", "Output file path").option("-l, --limit <number>", "Maximum number of icons", "100").action(async (options) => {
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
      limit: parseInt(options.limit, 10)
    });
    if (icons.length === 0) {
      spinner.fail("No icons found matching your criteria");
      process.exit(1);
    }
    spinner.text = `Generating ${options.format} bundle for ${icons.length} icons...`;
    let content;
    let ext;
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
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    spinner.succeed(
      `Bundled ${chalk.green(icons.length)} icons to ${chalk.cyan(outputPath)}`
    );
    const sources = [...new Set(icons.map((i) => i.sourceId))];
    console.log(chalk.dim(`  Sources: ${sources.join(", ")}`));
    console.log(chalk.dim(`  Format: ${options.format}`));
  } catch (error) {
    spinner.fail("Bundle failed");
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
});
program.command("categories").description("List available icon categories").option("-j, --json", "Output as JSON").action(async (options) => {
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
      console.log(`  ${chalk.green("\u2022")} ${cat}`);
    });
    console.log(
      chalk.dim(`
Use ${chalk.white("unicon bundle --category <name>")} to export a category.`)
    );
  } catch (error) {
    spinner.fail("Failed to fetch categories");
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
});
program.command("sources").description("List available icon sources/libraries").action(() => {
  console.log(chalk.bold("Available icon sources:\n"));
  console.log(`  ${chalk.green("\u2022")} ${chalk.yellow("lucide")}    - Lucide Icons`);
  console.log(`  ${chalk.green("\u2022")} ${chalk.cyan("phosphor")}  - Phosphor Icons`);
  console.log(`  ${chalk.green("\u2022")} ${chalk.magenta("hugeicons")} - Huge Icons`);
  console.log(
    chalk.dim(`
Use ${chalk.white("unicon bundle --source <name>")} to export from a source.`)
  );
});
program.parse();
