#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { dirname, resolve, join } from "path";
var API_BASE = process.env.UNICON_API_URL || "https://unicon.webrenew.com";
var CONFIG_FILE = ".uniconrc.json";
function findConfigFile() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  return existsSync(configPath) ? configPath : null;
}
function loadConfig() {
  const configPath = findConfigFile();
  if (!configPath) return null;
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red(`Failed to parse ${CONFIG_FILE}:`), error);
    return null;
  }
}
function createDefaultConfig() {
  return {
    $schema: "https://unicon.webrenew.com/schema/uniconrc.json",
    bundles: [
      {
        name: "dashboard",
        category: "Dashboards",
        limit: 50,
        format: "react",
        output: "./src/icons/dashboard.tsx"
      },
      {
        name: "navigation",
        query: "arrow chevron menu home",
        limit: 30,
        format: "react",
        output: "./src/icons/navigation.tsx"
      }
    ]
  };
}
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
Use ${chalk.white("unicon get <name>")} to copy a single icon.`)
    );
  } catch (error) {
    spinner.fail("Search failed");
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
});
program.command("get <name>").description("Get a single icon by name (outputs to stdout)").option("-s, --source <source>", "Prefer source (lucide, phosphor, hugeicons)").option("-f, --format <format>", "Output format: react, svg, json", "react").option("-o, --output <path>", "Write to file instead of stdout").action(async (name, options) => {
  try {
    const { icons } = await fetchIcons({
      query: name,
      source: options.source,
      limit: 10
    });
    const exactMatch = icons.find(
      (i) => i.normalizedName === name || i.normalizedName === name.toLowerCase()
    );
    const icon = exactMatch || icons[0];
    if (!icon) {
      console.error(chalk.red(`Icon "${name}" not found.`));
      console.error(chalk.dim(`Try: unicon search "${name}"`));
      process.exit(1);
    }
    let content;
    const componentName = toPascalCase(icon.normalizedName);
    switch (options.format) {
      case "svg": {
        const attrs = getSvgAttributes(icon);
        content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>
  ${icon.content}
</svg>`;
        break;
      }
      case "json":
        content = JSON.stringify({
          name: icon.normalizedName,
          source: icon.sourceId,
          viewBox: icon.viewBox,
          content: icon.content
        }, null, 2);
        break;
      case "react":
      default: {
        const attrs = getSvgAttributes(icon);
        content = `import * as React from "react";

export function ${componentName}({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
        break;
      }
    }
    if (options.output) {
      const fullPath = resolve(process.cwd(), options.output);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, "utf-8");
      console.error(chalk.green(`\u2713 ${componentName} \u2192 ${options.output}`));
    } else {
      console.log(content);
    }
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
});
program.command("bundle").description("Bundle icons into a file (or directory with --split)").option("-q, --query <query>", "Search query").option("-c, --category <category>", "Filter by category").option("-s, --source <source>", "Filter by source (lucide, phosphor, hugeicons)").option("-f, --format <format>", "Output format: react, svg, json", "react").option("-o, --output <path>", "Output file/directory path").option("-l, --limit <number>", "Maximum number of icons", "100").option("--split", "Write each icon to its own file (requires -o as directory)").action(async (options) => {
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
    if (options.split) {
      const outDir = options.output || "./icons";
      const fullDir = resolve(process.cwd(), outDir);
      mkdirSync(fullDir, { recursive: true });
      spinner.text = `Writing ${icons.length} icons to ${outDir}/...`;
      const ext2 = options.format === "json" ? "json" : options.format === "svg" ? "svg" : "tsx";
      for (const icon of icons) {
        const fileName = `${icon.normalizedName}.${ext2}`;
        const filePath = join(fullDir, fileName);
        let content2;
        switch (options.format) {
          case "svg": {
            const attrs = getSvgAttributes(icon);
            content2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" ${attrs}>
  ${icon.content}
</svg>`;
            break;
          }
          case "json":
            content2 = JSON.stringify({
              name: icon.normalizedName,
              source: icon.sourceId,
              viewBox: icon.viewBox,
              content: icon.content
            }, null, 2);
            break;
          case "react":
          default: {
            const name = toPascalCase(icon.normalizedName);
            const attrs = getSvgAttributes(icon);
            content2 = `import * as React from "react";

export function ${name}({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
}
`;
            break;
          }
        }
        writeFileSync(filePath, content2, "utf-8");
      }
      if (options.format === "react") {
        const indexContent = icons.map((icon) => `export { ${toPascalCase(icon.normalizedName)} } from "./${icon.normalizedName}";`).join("\n") + "\n";
        writeFileSync(join(fullDir, "index.ts"), indexContent, "utf-8");
      }
      spinner.succeed(`${chalk.green(icons.length)} icons \u2192 ${chalk.cyan(outDir)}/`);
      console.log(chalk.dim(`  Each icon in its own file (tree-shakeable)`));
      if (options.format === "react") {
        console.log(chalk.dim(`  Import: import { Home } from "${outDir}";`));
      }
      return;
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
program.command("init").description("Initialize a .uniconrc.json config file").option("-f, --force", "Overwrite existing config").action((options) => {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  if (existsSync(configPath) && !options.force) {
    console.log(chalk.yellow(`${CONFIG_FILE} already exists. Use --force to overwrite.`));
    process.exit(1);
  }
  const config = createDefaultConfig();
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(chalk.green(`\u2713 Created ${CONFIG_FILE}
`));
  console.log(chalk.dim("Default bundles configured:"));
  config.bundles.forEach((bundle) => {
    console.log(`  ${chalk.cyan(bundle.name)} \u2192 ${bundle.output}`);
  });
  console.log(chalk.dim(`
Run ${chalk.white("unicon sync")} to generate bundles.`));
});
program.command("sync").description("Generate all bundles from .uniconrc.json").option("-n, --name <name>", "Sync only a specific bundle by name").option("-d, --dry-run", "Show what would be generated without writing files").action(async (options) => {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.yellow(`No ${CONFIG_FILE} found. Run ${chalk.white("unicon init")} first.`));
    process.exit(1);
  }
  const bundlesToSync = options.name ? config.bundles.filter((b) => b.name === options.name) : config.bundles;
  if (bundlesToSync.length === 0) {
    if (options.name) {
      console.log(chalk.yellow(`Bundle "${options.name}" not found in config.`));
    } else {
      console.log(chalk.yellow("No bundles configured."));
    }
    process.exit(1);
  }
  console.log(chalk.bold(`Syncing ${bundlesToSync.length} bundle${bundlesToSync.length > 1 ? "s" : ""}...
`));
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
        limit: bundle.limit || 100
      });
      if (icons.length === 0) {
        spinner.warn(`${bundle.name}: No icons found`);
        continue;
      }
      const format = bundle.format || "react";
      let content;
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
        spinner.succeed(`${bundle.name}: ${chalk.green(icons.length)} icons \u2192 ${chalk.cyan(bundle.output)}`);
      }
      successCount++;
    } catch (error) {
      spinner.fail(`${bundle.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      errorCount++;
    }
  }
  console.log();
  if (errorCount === 0) {
    console.log(chalk.green(`\u2713 All ${successCount} bundles synced successfully`));
  } else {
    console.log(chalk.yellow(`Completed with ${errorCount} error${errorCount > 1 ? "s" : ""}`));
  }
});
program.command("add <name>").description("Add a new bundle to .uniconrc.json").option("-q, --query <query>", "Search query").option("-c, --category <category>", "Filter by category").option("-s, --source <source>", "Filter by source").option("-f, --format <format>", "Output format: react, svg, json", "react").option("-l, --limit <number>", "Maximum icons", "50").option("-o, --output <path>", "Output file path").action((name, options) => {
  let config = loadConfig();
  if (!config) {
    console.log(chalk.yellow(`No ${CONFIG_FILE} found. Creating one...`));
    config = { bundles: [] };
  }
  if (config.bundles.some((b) => b.name === name)) {
    console.log(chalk.yellow(`Bundle "${name}" already exists in config.`));
    process.exit(1);
  }
  if (!options.query && !options.category && !options.source) {
    console.log(chalk.yellow("Please provide at least one filter: --query, --category, or --source"));
    process.exit(1);
  }
  const ext = options.format === "json" ? "json" : options.format === "svg" ? "svg" : "tsx";
  const newBundle = {
    name,
    output: options.output || `./src/icons/${name}.${ext}`,
    format: options.format,
    limit: parseInt(options.limit, 10)
  };
  if (options.query) newBundle.query = options.query;
  if (options.category) newBundle.category = options.category;
  if (options.source) newBundle.source = options.source;
  config.bundles.push(newBundle);
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(chalk.green(`\u2713 Added bundle "${name}" to ${CONFIG_FILE}`));
  console.log(chalk.dim(`  Output: ${newBundle.output}`));
  console.log(chalk.dim(`
Run ${chalk.white(`unicon sync --name ${name}`)} to generate.`));
});
program.parse();
