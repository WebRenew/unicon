#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { dirname, resolve, join } from "path";

const API_BASE = process.env.UNICON_API_URL || "https://unicon.webrenew.com";
const CONFIG_FILE = ".uniconrc.json";

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

program.parse();
