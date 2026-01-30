/**
 * Unicon MCP Streamable HTTP Endpoint
 *
 * This endpoint exposes the MCP server via Streamable HTTP transport for
 * integrations like v0, Bolt, Vercel AI, and other URL-based MCP clients.
 *
 * URL: https://unicon.sh/api/mcp
 *
 * CORS: Open access enabled for cloud IDE integrations (v0, Bolt, Lovable, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  searchIcons,
  getSearchCount,
  getIconById,
  getIconsByIds,
  getIconsByNames,
  getSources,
  getCategories,
  getTotalIconCount,
} from "@/lib/queries";
import {
  convertIconToFormat,
  generateReactBundle,
  generateSvgBundle,
  generateJsonBundle,
} from "@/lib/icon-converters";
import { normalizeIcons, normalizeIcon } from "@/lib/icon-utils";
import { STARTER_PACKS } from "@/lib/starter-packs";
import { logger } from "@/lib/logger";

// Constants
const CHARACTER_LIMIT = 100000; // Maximum response size in characters
const VALID_PACK_IDS = STARTER_PACKS.map((p) => p.id);

// CORS headers for cross-origin access (v0, Bolt, Lovable, etc.)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id",
};

// Reusable Zod schemas
const iconIdSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(
    /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/i,
    "Invalid iconId format. Expected 'source:name' (e.g., 'lucide:arrow-right')"
  )
  .describe("Icon ID in format 'source:name' (e.g., 'lucide:arrow-right')");

const formatSchema = z
  .enum(["svg", "react", "vue", "svelte", "json"])
  .default("react")
  .describe("Output format");

const sizeSchema = z
  .number()
  .int()
  .min(8)
  .max(512)
  .default(24)
  .describe("Icon size in pixels");

const strokeWidthSchema = z
  .number()
  .min(0.5)
  .max(4)
  .default(2)
  .describe("Stroke width");

const normalizeStrokesSchema = z
  .boolean()
  .default(false)
  .describe("Normalize stroke widths across icons (skips fill-based icons automatically)");

const outputSchema = z
  .enum(["individual", "bundle"])
  .default("bundle")
  .describe("Output mode: 'bundle' (single file, 70% smaller) or 'individual' (separate components)");

const sourceSchema = z
  .enum([
    "lucide",
    "phosphor",
    "hugeicons",
    "heroicons",
    "tabler",
    "feather",
    "remix",
    "simple-icons",
    "iconoir",
  ])
  .optional()
  .describe("Filter by icon library");

// Helper to add CORS headers to a response
function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Helper to truncate response if too large
function truncateIfNeeded(text: string, limit: number = CHARACTER_LIMIT): string {
  if (text.length <= limit) return text;
  return (
    text.slice(0, limit) +
    `\n\n[Response truncated. Original size: ${text.length} characters. Use pagination or filters to reduce results.]`
  );
}

// Helper to get comment syntax based on format
function getCommentSyntax(format: string): { start: string; end: string } {
  switch (format) {
    case "svg":
      return { start: "<!-- ", end: " -->" };
    case "react":
    case "json":
      return { start: "// ", end: "" };
    case "vue":
      return { start: "<!-- ", end: " -->" };
    case "svelte":
      return { start: "<!-- ", end: " -->" };
    default:
      return { start: "// ", end: "" };
  }
}

// Helper to format batch icons with identifying comments
function formatBatchIconsText(
  icons: Array<{ id?: string; name: string; code: string; error?: string }>,
  format: string
): string {
  const { start, end } = getCommentSyntax(format);
  const separator = "\n" + "=".repeat(60) + "\n";

  return icons
    .map((icon, index) => {
      const iconId = icon.id || icon.name;
      const header = `${start}[${index + 1}] ${iconId}${icon.error ? " (ERROR)" : ""}${end}`;

      if (icon.error) {
        return `${header}\n${start}Error: ${icon.error}${end}`;
      }

      return `${header}\n${icon.code}`;
    })
    .join(separator);
}

// Create MCP server with all tools and resources
function createMcpServer() {
  const server = new McpServer({
    name: "unicon",
    version: "1.0.0",
    description: `Unicon: 19,000+ icons from 9 libraries (Lucide, Phosphor, Heroicons, etc.) in React/Vue/Svelte/SVG.

AVAILABLE TOOLS:
- search_icons: Search icons by keyword. Use includeCode=true to get React components.
- get_icon: Get a single icon by ID (e.g., "lucide:arrow-right").
- get_multiple_icons: Get multiple icons at once (up to 50).
- get_starter_pack: Get curated icon packs (shadcn-ui, dashboard, ecommerce, etc.).

QUICK START:
- For shadcn/ui: get_starter_pack({ packId: "shadcn-ui" })
- Search + code: search_icons({ query: "arrow", includeCode: true, limit: 5 })
- Specific icon: get_icon({ iconId: "lucide:home", format: "react" })

Read unicon://instructions for detailed usage.`,
  });

  // ============================================
  // TOOL: search_icons
  // ============================================
  server.registerTool(
    "search_icons",
    {
      title: "Search Icons",
      description: `Search icons across 9 libraries. Set includeCode=true to get ready-to-use components in one call.

Args:
  - query (string): Search query (e.g., 'arrow', 'dashboard', 'user profile')
  - includeCode (boolean, optional): Return icon code with results (default: false)
  - format (string, optional): Code format when includeCode=true (default: react)
  - normalizeStrokes (boolean, optional): Normalize stroke widths, skipping fill icons (default: false)
  - source (string, optional): Filter by library
  - limit (number, optional): Max results (1-100, default: 20)

Examples:
  - Search only: query="arrow"
  - Search + code: query="arrow", includeCode=true, limit=5
  - Normalized: query="arrow", includeCode=true, normalizeStrokes=true, strokeWidth=2`,
      inputSchema: z
        .object({
          query: z.string().min(1).max(200).describe("Search query"),
          includeCode: z
            .boolean()
            .default(false)
            .describe("Include icon source code in results (returns bundle format)"),
          format: formatSchema,
          strokeWidth: strokeWidthSchema,
          normalizeStrokes: normalizeStrokesSchema,
          source: sourceSchema,
          category: z.string().max(50).optional().describe("Filter by category"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20)
            .describe("Maximum results to return"),
          offset: z
            .number()
            .int()
            .min(0)
            .default(0)
            .describe("Number of results to skip for pagination"),
        })
        .strict(),
      outputSchema: z
        .object({
          query: z.string(),
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          has_more: z.boolean(),
          results: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              normalizedName: z.string(),
              source: z.string(),
              category: z.string().nullable(),
              tags: z.array(z.string()),
            })
          ),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      const includeCode = params.includeCode ?? false;
      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const normalizeStrokes = params.normalizeStrokes ?? false;
      const strokeWidth = params.strokeWidth ?? 2;

      // Build search params with proper typing for exactOptionalPropertyTypes
      const filterParams: {
        query: string;
        sourceId?: string;
        category?: string;
      } = {
        query: params.query,
      };

      if (params.source !== undefined) {
        filterParams.sourceId = params.source;
      }
      if (params.category !== undefined) {
        filterParams.category = params.category;
      }

      // Run results query and count query in parallel for accurate pagination
      const [dbResults, totalCount] = await Promise.all([
        searchIcons({
          ...filterParams,
          limit,
          offset,
        }),
        getSearchCount(filterParams),
      ]);

      // Calculate has_more from accurate total
      const hasMore = offset + dbResults.length < totalCount;

      // If includeCode is true, return bundled code with results
      if (includeCode && dbResults.length > 0) {
        // Validate format supports bundling
        if (format !== "react" && format !== "svg" && format !== "json") {
          return {
            content: [
              {
                type: "text",
                text: `Error: includeCode only supports format="react", "svg", or "json". Got "${format}". Use output="individual" for Vue/Svelte.`,
              },
            ],
            isError: true,
          };
        }

        // Apply stroke normalization if requested (skips fill-based icons)
        const iconsToBundle = normalizeStrokes
          ? normalizeIcons(dbResults, { strokeWidth, skipFillIcons: true })
          : dbResults;

        let bundleText: string;
        if (format === "react") {
          bundleText = generateReactBundle(iconsToBundle, { strokeWidth });
        } else if (format === "svg") {
          bundleText = generateSvgBundle(iconsToBundle, { strokeWidth });
        } else {
          bundleText = generateJsonBundle(iconsToBundle);
        }

        const output = {
          query: params.query,
          total: totalCount,
          offset,
          limit,
          has_more: hasMore,
          format,
          results: dbResults.map((icon) => ({
            id: icon.id,
            name: icon.name,
            normalizedName: icon.normalizedName,
            source: icon.sourceId,
          })),
          code: bundleText,
        };

        const text = truncateIfNeeded(bundleText);

        return {
          content: [{ type: "text", text }],
          structuredContent: output,
        };
      }

      // Standard search results (no code)
      const output = {
        query: params.query,
        total: totalCount,
        offset,
        limit,
        has_more: hasMore,
        results: dbResults.map((icon) => ({
          id: icon.id,
          name: icon.name,
          normalizedName: icon.normalizedName,
          source: icon.sourceId,
          category: icon.category,
          tags: icon.tags,
        })),
      };

      const text = truncateIfNeeded(JSON.stringify(output, null, 2));

      return {
        content: [{ type: "text", text }],
        structuredContent: output,
      };
    }
  );

  // ============================================
  // TOOL: get_icon
  // ============================================
  server.registerTool(
    "get_icon",
    {
      title: "Get Icon",
      description: `Retrieve source code for a specific icon in various formats.

Args:
  - iconId (string): Icon ID in format 'source:name' (e.g., 'lucide:arrow-right')
  - format (string, optional): Output format - svg, react, vue, svelte, json (default: react)
  - size (number, optional): Icon size in pixels (default: 24)
  - strokeWidth (number, optional): Stroke width for line icons (default: 2)
  - normalizeStrokes (boolean, optional): Normalize stroke widths, skipping fill icons (default: false)

Returns:
  Object with iconId, format, and code.

Examples:
  - "get the lucide arrow-right icon" -> iconId="lucide:arrow-right"
  - "get phosphor house icon as SVG" -> iconId="phosphor:house", format="svg"`,
      inputSchema: z
        .object({
          iconId: iconIdSchema,
          format: formatSchema,
          size: sizeSchema,
          strokeWidth: strokeWidthSchema,
          normalizeStrokes: normalizeStrokesSchema,
        })
        .strict(),
      outputSchema: z
        .object({
          iconId: z.string(),
          format: z.string(),
          code: z.string(),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const icon = await getIconById(params.iconId);
      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Icon not found: "${params.iconId}". Use search_icons to find valid icon IDs, or browse https://unicon.sh`,
            },
          ],
          isError: true,
        };
      }

      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const normalizeStrokes = params.normalizeStrokes ?? false;
      const strokeWidth = params.strokeWidth ?? 2;

      // Apply stroke normalization if requested (skips fill-based icons)
      const iconToConvert = normalizeStrokes
        ? normalizeIcon(icon, { strokeWidth, skipFillIcons: true })
        : icon;

      const code = await convertIconToFormat(iconToConvert, format, {
        size: params.size,
        strokeWidth,
      });

      const output = {
        iconId: params.iconId,
        format,
        code,
      };

      return {
        content: [{ type: "text", text: code }],
        structuredContent: output,
      };
    }
  );

  // ============================================
  // TOOL: get_multiple_icons
  // ============================================
  server.registerTool(
    "get_multiple_icons",
    {
      title: "Get Multiple Icons",
      description: `Retrieve multiple icons at once (max 50 per request).

Args:
  - iconIds (array): Array of icon IDs (e.g., ['lucide:arrow-right', 'lucide:home'])
  - output (string, optional): 'bundle' (default, single file) or 'individual' (separate components)
  - format (string, optional): svg, react, vue, svelte, json (default: react)
  - size (number, optional): Icon size in pixels (default: 24)
  - strokeWidth (number, optional): Stroke width (default: 2)
  - normalizeStrokes (boolean, optional): Normalize stroke widths, skipping fill icons (default: false)

Returns:
  Single copy-pasteable file with all icons (bundle) or individual components.`,
      inputSchema: z
        .object({
          iconIds: z
            .array(iconIdSchema)
            .min(1)
            .max(50)
            .describe("Array of icon IDs to retrieve"),
          output: outputSchema,
          format: formatSchema,
          size: sizeSchema,
          strokeWidth: strokeWidthSchema,
          normalizeStrokes: normalizeStrokesSchema,
        })
        .strict(),
      outputSchema: z
        .object({
          format: z.string(),
          total: z.number(),
          successful: z.number(),
          icons: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              code: z.string(),
              error: z.string().optional(),
            })
          ),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const outputMode = params.output ?? "bundle";
      const normalizeStrokes = params.normalizeStrokes ?? false;
      const strokeWidth = params.strokeWidth ?? 2;

      // Batch fetch all icons in a single query (eliminates N+1)
      const fetchedIcons = await getIconsByIds(params.iconIds);
      const iconsById = new Map(fetchedIcons.map((icon) => [icon.id, icon]));

      // Get ordered list of found icons (preserving request order)
      const orderedIcons = params.iconIds
        .map((id) => iconsById.get(id))
        .filter((icon): icon is NonNullable<typeof icon> => icon !== undefined);

      // Bundle mode: single file output (70% smaller)
      if (outputMode === "bundle") {
        // Validate format supports bundling
        if (format !== "react" && format !== "svg" && format !== "json") {
          return {
            content: [
              {
                type: "text",
                text: `Error: Bundle mode only supports format="react", "svg", or "json". Got "${format}". Use output="individual" for Vue/Svelte.`,
              },
            ],
            isError: true,
          };
        }

        // Apply stroke normalization if requested (skips fill-based icons)
        const iconsToBundle = normalizeStrokes
          ? normalizeIcons(orderedIcons, { strokeWidth, skipFillIcons: true })
          : orderedIcons;

        let bundleText: string;
        if (format === "react") {
          bundleText = generateReactBundle(iconsToBundle, {
            size: params.size,
            strokeWidth,
          });
        } else if (format === "svg") {
          bundleText = generateSvgBundle(iconsToBundle, {
            size: params.size,
            strokeWidth,
          });
        } else {
          bundleText = generateJsonBundle(iconsToBundle);
        }

        const text = truncateIfNeeded(bundleText);

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            format,
            output: "bundle",
            total: params.iconIds.length,
            successful: orderedIcons.length,
            code: bundleText,
          },
        };
      }

      // Individual mode: separate components (original behavior)
      const results = await Promise.all(
        params.iconIds.map(async (iconId) => {
          try {
            const icon = iconsById.get(iconId);
            if (!icon) {
              return {
                id: iconId,
                name: "",
                code: "",
                error: "Icon not found. Use search_icons to find valid IDs.",
              };
            }

            // Apply stroke normalization if requested (skips fill-based icons)
            const iconToConvert = normalizeStrokes
              ? normalizeIcon(icon, { strokeWidth, skipFillIcons: true })
              : icon;

            const code = await convertIconToFormat(iconToConvert, format, {
              size: params.size,
              strokeWidth,
            });

            return { id: icon.id, name: icon.name, code };
          } catch (error) {
            return {
              id: iconId,
              name: "",
              code: "",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      const output = {
        format,
        output: "individual",
        total: results.length,
        successful: results.filter((r) => !r.error).length,
        icons: results,
      };

      // Format text with identifying comments for each icon
      const formattedText = formatBatchIconsText(results, format);
      const text = truncateIfNeeded(formattedText);

      return {
        content: [{ type: "text", text }],
        structuredContent: output,
      };
    }
  );

  // ============================================
  // TOOL: get_starter_pack
  // ============================================
  server.registerTool(
    "get_starter_pack",
    {
      title: "Get Starter Pack",
      description: `Get a curated starter pack of icons for common use cases.

Popular packs: shadcn-ui, dashboard, ecommerce, navigation, developer, brand-ai

Args:
  - packId (string): Starter pack ID
  - output (string, optional): 'bundle' (default, single file) or 'individual' (separate components)
  - format (string, optional): svg, react, vue, svelte, json (default: react)
  - size (number, optional): Icon size (default: 24)
  - strokeWidth (number, optional): Stroke width (default: 2)
  - normalizeStrokes (boolean, optional): Normalize stroke widths, skipping fill icons (default: false)

Returns:
  Single copy-pasteable file with all icons (bundle) or individual components.`,
      inputSchema: z
        .object({
          packId: z
            .string()
            .min(1)
            .max(50)
            .describe(
              `Starter pack ID. Available: ${VALID_PACK_IDS.slice(0, 6).join(", ")}... Use unicon://starter_packs for full list.`
            ),
          output: outputSchema,
          format: formatSchema,
          size: sizeSchema,
          strokeWidth: strokeWidthSchema,
          normalizeStrokes: normalizeStrokesSchema,
        })
        .strict(),
      outputSchema: z
        .object({
          packId: z.string(),
          packName: z.string(),
          description: z.string(),
          format: z.string(),
          totalIcons: z.number(),
          retrievedIcons: z.number(),
          icons: z.array(
            z.object({
              name: z.string(),
              code: z.string(),
              error: z.string().optional(),
            })
          ),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const pack = STARTER_PACKS.find((p) => p.id === params.packId);
      if (!pack) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Starter pack not found: "${params.packId}". Available packs: ${VALID_PACK_IDS.join(", ")}. Use the unicon://starter_packs resource to see details.`,
            },
          ],
          isError: true,
        };
      }

      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const outputMode = params.output ?? "bundle";
      const normalizeStrokes = params.normalizeStrokes ?? false;
      const strokeWidth = params.strokeWidth ?? 2;

      // Batch fetch all icons (eliminates N+1)
      const fetchedIcons = await getIconsByNames(pack.iconNames);
      const iconsByName = new Map(
        fetchedIcons.map((icon) => [icon.normalizedName.toLowerCase(), icon])
      );

      // Get ordered list of found icons (preserving pack order)
      const orderedIcons = pack.iconNames
        .map((name) => iconsByName.get(name.toLowerCase()))
        .filter((icon): icon is NonNullable<typeof icon> => icon !== undefined);

      // Bundle mode: single file output (70% smaller)
      if (outputMode === "bundle") {
        // Validate format supports bundling
        if (format !== "react" && format !== "svg" && format !== "json") {
          return {
            content: [
              {
                type: "text",
                text: `Error: Bundle mode only supports format="react", "svg", or "json". Got "${format}". Use output="individual" for Vue/Svelte.`,
              },
            ],
            isError: true,
          };
        }

        // Apply stroke normalization if requested (skips fill-based icons)
        const iconsToBundle = normalizeStrokes
          ? normalizeIcons(orderedIcons, { strokeWidth, skipFillIcons: true })
          : orderedIcons;

        let bundleText: string;
        if (format === "react") {
          bundleText = generateReactBundle(iconsToBundle, {
            size: params.size,
            strokeWidth,
          });
        } else if (format === "svg") {
          bundleText = generateSvgBundle(iconsToBundle, {
            size: params.size,
            strokeWidth,
          });
        } else {
          bundleText = generateJsonBundle(iconsToBundle);
        }

        const text = truncateIfNeeded(bundleText);

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            packId: pack.id,
            packName: pack.name,
            description: pack.description,
            format,
            output: "bundle",
            totalIcons: pack.iconNames.length,
            retrievedIcons: orderedIcons.length,
            code: bundleText,
          },
        };
      }

      // Individual mode: separate components (original behavior)
      const results = await Promise.all(
        pack.iconNames.map(async (iconName) => {
          try {
            const icon = iconsByName.get(iconName.toLowerCase());
            if (!icon) {
              return { name: iconName, code: "", error: "Icon not found in database" };
            }

            // Apply stroke normalization if requested (skips fill-based icons)
            const iconToConvert = normalizeStrokes
              ? normalizeIcon(icon, { strokeWidth, skipFillIcons: true })
              : icon;

            const code = await convertIconToFormat(iconToConvert, format, {
              size: params.size,
              strokeWidth,
            });

            return { name: icon.normalizedName, code };
          } catch (error) {
            return {
              name: iconName,
              code: "",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      const output = {
        packId: pack.id,
        packName: pack.name,
        description: pack.description,
        format,
        output: "individual",
        totalIcons: pack.iconNames.length,
        retrievedIcons: results.filter((r) => !r.error).length,
        icons: results,
      };

      // Format text with identifying comments for each icon
      const header = `${getCommentSyntax(format).start}Starter Pack: ${pack.name} (${pack.id})${getCommentSyntax(format).end}\n${getCommentSyntax(format).start}${pack.description}${getCommentSyntax(format).end}\n\n`;
      const formattedText = header + formatBatchIconsText(results, format);
      const text = truncateIfNeeded(formattedText);

      return {
        content: [{ type: "text", text }],
        structuredContent: output,
      };
    }
  );

  // ============================================
  // RESOURCES
  // ============================================

  server.registerResource(
    "sources",
    "unicon://sources",
    {
      description: "List all available icon libraries",
      mimeType: "application/json",
    },
    async () => {
      const sources = await getSources();
      return {
        contents: [
          {
            uri: "unicon://sources",
            mimeType: "application/json",
            text: JSON.stringify(sources, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "categories",
    "unicon://categories",
    {
      description: "List all icon categories",
      mimeType: "application/json",
    },
    async () => {
      const categories = await getCategories();
      return {
        contents: [
          {
            uri: "unicon://categories",
            mimeType: "application/json",
            text: JSON.stringify({ categories }, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "stats",
    "unicon://stats",
    {
      description: "Total icon count and per-library statistics",
      mimeType: "application/json",
    },
    async () => {
      const totalIcons = await getTotalIconCount();
      const sources = await getSources();
      const stats = {
        totalIcons,
        sources: sources.map((s) => ({
          id: s.id,
          name: s.name,
          count: s.totalIcons,
        })),
      };
      return {
        contents: [
          {
            uri: "unicon://stats",
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "starter_packs",
    "unicon://starter_packs",
    {
      description: "Curated icon packs for common use cases",
      mimeType: "application/json",
    },
    async () => {
      const packs = {
        total: STARTER_PACKS.length,
        packs: STARTER_PACKS.map((pack) => ({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          color: pack.color,
          iconCount: pack.iconNames.length,
          icons: pack.iconNames,
        })),
      };
      return {
        contents: [
          {
            uri: "unicon://starter_packs",
            mimeType: "application/json",
            text: JSON.stringify(packs, null, 2),
          },
        ],
      };
    }
  );

  // ============================================
  // INSTRUCTIONS RESOURCE - Tool Discoverability
  // ============================================
  server.registerResource(
    "instructions",
    "unicon://instructions",
    {
      description: "How to use Unicon MCP - read this first to understand available tools",
      mimeType: "text/markdown",
    },
    async () => {
      const instructions = `# Unicon MCP Server

Access 19,000+ icons from 9 libraries (Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix, Simple Icons, Iconoir).

## Available Tools

### 1. search_icons
Search for icons by keyword. Returns matching icons with IDs.

**Example:**
\`\`\`json
{ "query": "arrow", "limit": 10 }
\`\`\`

**With code included:**
\`\`\`json
{ "query": "arrow", "includeCode": true, "format": "react", "limit": 5 }
\`\`\`

### 2. get_icon
Get a single icon's code by ID.

**Example:**
\`\`\`json
{ "iconId": "lucide:arrow-right", "format": "react" }
\`\`\`

Icon IDs use format \`source:name\` (e.g., "lucide:home", "phosphor:user", "heroicons:cog").

### 3. get_multiple_icons
Get multiple icons at once (up to 50). Returns a single bundled file.

**Example:**
\`\`\`json
{ "iconIds": ["lucide:home", "lucide:settings", "lucide:user"], "format": "react" }
\`\`\`

### 4. get_starter_pack
Get a curated set of icons for common use cases.

**Popular packs:** shadcn-ui, dashboard, ecommerce, navigation, developer, brand-ai

**Example:**
\`\`\`json
{ "packId": "shadcn-ui", "format": "react" }
\`\`\`

## Supported Formats

- \`react\` (default) - React component with TypeScript
- \`svg\` - Raw SVG markup
- \`vue\` - Vue 3 SFC component
- \`svelte\` - Svelte component
- \`json\` - JSON with SVG paths

## Quick Workflows

**Adding icons to a React project:**
1. Search: \`search_icons({ query: "dashboard", includeCode: true, limit: 10 })\`
2. Or get specific: \`get_multiple_icons({ iconIds: ["lucide:home", "lucide:settings"] })\`
3. Copy the returned code to \`src/components/icons/\`

**Starting a new project:**
1. Get a starter pack: \`get_starter_pack({ packId: "shadcn-ui" })\`
2. Save to your icons directory

## Icon Libraries

| Library | Prefix | Style |
|---------|--------|-------|
| Lucide | lucide: | Outline, clean |
| Phosphor | phosphor: | Multiple weights |
| Heroicons | heroicons: | Outline/solid |
| Tabler | tabler: | Consistent stroke |
| Hugeicons | hugeicons: | Modern, detailed |
| Feather | feather: | Minimal |
| Remix | remix: | Versatile |
| Simple Icons | simple-icons: | Brand logos |
| Iconoir | iconoir: | European style |
`;
      return {
        contents: [
          {
            uri: "unicon://instructions",
            mimeType: "text/markdown",
            text: instructions,
          },
        ],
      };
    }
  );

  return server;
}

// Create transport for stateless mode (new transport per request)
// Note: Omitting sessionIdGenerator enables stateless mode (no session tracking)
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
}

// Shared handler for MCP requests (used by both POST and GET)
async function handleMcpRequest(request: Request, method: string): Promise<Response> {
  const server = createMcpServer();
  const transport = createTransport();

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return withCors(response);
  } catch (error) {
    logger.error(`MCP ${method} Error:`, error);
    return withCors(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal server error",
          },
          id: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  } finally {
    // Ensure server resources are cleaned up to prevent memory leaks
    try {
      await server.close();
    } catch (closeError) {
      logger.error(`MCP ${method} Close Error:`, closeError);
    }
  }
}

/**
 * POST /api/mcp - Handle MCP requests
 */
export async function POST(request: Request) {
  return handleMcpRequest(request, "POST");
}

/**
 * GET /api/mcp - SSE stream for server-initiated messages
 */
export async function GET(request: Request) {
  return handleMcpRequest(request, "GET");
}

/**
 * DELETE /api/mcp - Terminate session (stateless, so just acknowledge)
 */
export async function DELETE() {
  return withCors(new Response(null, { status: 200 }));
}

/**
 * OPTIONS /api/mcp - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
