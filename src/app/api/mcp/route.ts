/**
 * Unicon MCP Streamable HTTP Endpoint
 *
 * This endpoint exposes the MCP server via Streamable HTTP transport for
 * integrations like v0, Bolt, Vercel AI, and other URL-based MCP clients.
 *
 * URL: https://unicon.webrenew.com/api/mcp
 *
 * CORS: Open access enabled for cloud IDE integrations (v0, Bolt, Lovable, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  searchIcons,
  getIconById,
  getIconsByNames,
  getSources,
  getCategories,
  getTotalIconCount,
} from "@/lib/queries";
import { convertIconToFormat } from "@/lib/icon-converters";
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

// Create MCP server with all tools and resources
function createMcpServer() {
  const server = new McpServer({
    name: "unicon",
    version: "1.0.0",
  });

  // ============================================
  // TOOL: unicon_search_icons
  // ============================================
  server.registerTool(
    "unicon_search_icons",
    {
      title: "Search Icons",
      description: `Search through 14,700+ icons across 8 libraries using semantic search.

Args:
  - query (string): Search query (e.g., 'arrow', 'dashboard', 'user profile')
  - source (string, optional): Filter by library (lucide, phosphor, hugeicons, heroicons, tabler, feather, remix, simple-icons)
  - category (string, optional): Filter by category
  - limit (number, optional): Maximum results (1-100, default: 20)
  - offset (number, optional): Skip results for pagination (default: 0)

Returns:
  Object with query, total count, has_more flag, and array of matching icons.

Examples:
  - "search for arrow icons" -> query="arrow"
  - "find dashboard icons from lucide" -> query="dashboard", source="lucide"
  - "get next page of results" -> query="arrow", offset=20`,
      inputSchema: z
        .object({
          query: z.string().min(1).max(200).describe("Search query"),
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
      const searchParams: {
        query: string;
        sourceId?: string;
        category?: string;
        limit: number;
      } = {
        query: params.query,
        // Fetch one extra to determine has_more
        limit: Math.min((params.limit ?? 20) + 1, 101),
      };

      if (params.source) {
        searchParams.sourceId = params.source;
      }
      if (params.category) {
        searchParams.category = params.category;
      }

      const allResults = await searchIcons(searchParams);
      const offset = params.offset ?? 0;
      const limit = params.limit ?? 20;

      // Apply offset and limit
      const paginatedResults = allResults.slice(offset, offset + limit + 1);
      const hasMore = paginatedResults.length > limit;
      const results = paginatedResults.slice(0, limit);

      const output = {
        query: params.query,
        total: allResults.length,
        offset,
        limit,
        has_more: hasMore,
        results: results.map((icon) => ({
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
  // TOOL: unicon_get_icon
  // ============================================
  server.registerTool(
    "unicon_get_icon",
    {
      title: "Get Icon",
      description: `Retrieve source code for a specific icon in various formats.

Args:
  - iconId (string): Icon ID in format 'source:name' (e.g., 'lucide:arrow-right')
  - format (string, optional): Output format - svg, react, vue, svelte, json (default: react)
  - size (number, optional): Icon size in pixels (default: 24)
  - strokeWidth (number, optional): Stroke width for line icons (default: 2)

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
              text: `Error: Icon not found: ${params.iconId}. Use unicon_search_icons to find valid icon IDs, or browse https://unicon.webrenew.com`,
            },
          ],
          isError: true,
        };
      }

      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const code = await convertIconToFormat(icon, format, {
        size: params.size,
        strokeWidth: params.strokeWidth,
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
  // TOOL: unicon_get_multiple_icons
  // ============================================
  server.registerTool(
    "unicon_get_multiple_icons",
    {
      title: "Get Multiple Icons",
      description: `Retrieve multiple icons at once (max 50 per request).

Args:
  - iconIds (array): Array of icon IDs (e.g., ['lucide:arrow-right', 'lucide:home'])
  - format (string, optional): Output format - svg, react, vue, svelte, json (default: react)
  - size (number, optional): Icon size in pixels (default: 24)
  - strokeWidth (number, optional): Stroke width (default: 2)

Returns:
  Object with format and array of icons with their source code.`,
      inputSchema: z
        .object({
          iconIds: z
            .array(iconIdSchema)
            .min(1)
            .max(50)
            .describe("Array of icon IDs to retrieve"),
          format: formatSchema,
          size: sizeSchema,
          strokeWidth: strokeWidthSchema,
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

      // Fetch all icons in parallel
      const results = await Promise.all(
        params.iconIds.map(async (iconId) => {
          try {
            const icon = await getIconById(iconId);
            if (!icon) {
              return {
                id: iconId,
                name: "",
                code: "",
                error: "Icon not found. Use unicon_search_icons to find valid IDs.",
              };
            }

            const code = await convertIconToFormat(icon, format, {
              size: params.size,
              strokeWidth: params.strokeWidth,
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
        total: results.length,
        successful: results.filter((r) => !r.error).length,
        icons: results,
      };

      const text = truncateIfNeeded(JSON.stringify(output, null, 2));

      return {
        content: [{ type: "text", text }],
        structuredContent: output,
      };
    }
  );

  // ============================================
  // TOOL: unicon_get_starter_pack
  // ============================================
  server.registerTool(
    "unicon_get_starter_pack",
    {
      title: "Get Starter Pack",
      description: `Get a curated starter pack of icons for common use cases.

Popular packs: dashboard, ecommerce, social, navigation, developer, brand-ai

Use the unicon://starter_packs resource to see all ${VALID_PACK_IDS.length} available packs.

Args:
  - packId (string): Starter pack ID (e.g., 'dashboard', 'ecommerce', 'brand-ai')
  - format (string, optional): Output format (default: react)
  - size (number, optional): Icon size (default: 24)
  - strokeWidth (number, optional): Stroke width (default: 2)

Returns:
  All icons in the pack with their source code.`,
      inputSchema: z
        .object({
          packId: z
            .string()
            .min(1)
            .max(50)
            .describe(
              `Starter pack ID. Available: ${VALID_PACK_IDS.slice(0, 6).join(", ")}... Use unicon://starter_packs for full list.`
            ),
          format: formatSchema,
          size: sizeSchema,
          strokeWidth: strokeWidthSchema,
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

      // Batch fetch all icons (eliminates N+1)
      const fetchedIcons = await getIconsByNames(pack.iconNames);
      const iconsByName = new Map(
        fetchedIcons.map((icon) => [icon.normalizedName.toLowerCase(), icon])
      );

      // Process all icons in parallel
      const results = await Promise.all(
        pack.iconNames.map(async (iconName) => {
          try {
            const icon = iconsByName.get(iconName.toLowerCase());
            if (!icon) {
              return { name: iconName, code: "", error: "Icon not found in database" };
            }

            const code = await convertIconToFormat(icon, format, {
              size: params.size,
              strokeWidth: params.strokeWidth,
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
        totalIcons: pack.iconNames.length,
        retrievedIcons: results.filter((r) => !r.error).length,
        icons: results,
      };

      const text = truncateIfNeeded(JSON.stringify(output, null, 2));

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

  return server;
}

// Create transport for stateless mode (new transport per request)
// Note: Omitting sessionIdGenerator enables stateless mode (no session tracking)
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
}

/**
 * POST /api/mcp - Handle MCP requests
 */
export async function POST(request: Request) {
  try {
    const server = createMcpServer();
    const transport = createTransport();

    await server.connect(transport);

    const response = await transport.handleRequest(request);

    return withCors(response);
  } catch (error) {
    logger.error("MCP Error:", error);
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
  }
}

/**
 * GET /api/mcp - SSE stream for server-initiated messages
 */
export async function GET(request: Request) {
  try {
    const server = createMcpServer();
    const transport = createTransport();

    await server.connect(transport);

    const response = await transport.handleRequest(request);

    return withCors(response);
  } catch (error) {
    logger.error("MCP GET Error:", error);
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
  }
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
