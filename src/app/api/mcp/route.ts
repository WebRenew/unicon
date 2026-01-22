/**
 * Unicon MCP Streamable HTTP Endpoint
 *
 * This endpoint exposes the MCP server via Streamable HTTP transport for
 * integrations like v0, Vercel AI, and other URL-based MCP clients.
 *
 * URL: https://unicon.webrenew.com/api/mcp
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

// Create a shared MCP server instance
function createMcpServer() {
  const server = new McpServer({
    name: "unicon",
    version: "1.0.0",
  });

  // Register tools
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

Returns:
  Array of matching icons with id, name, source, category, and tags.

Examples:
  - "search for arrow icons" -> query="arrow"
  - "find dashboard icons from lucide" -> query="dashboard", source="lucide"`,
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        source: z
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
          .describe("Filter by icon library"),
        category: z.string().optional().describe("Filter by category"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum results to return"),
      },
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
        limit: params.limit ?? 20,
      };

      if (params.source) {
        searchParams.sourceId = params.source;
      }
      if (params.category) {
        searchParams.category = params.category;
      }

      const results = await searchIcons(searchParams);

      const output = {
        query: params.query,
        total: results.length,
        results: results.map((icon) => ({
          id: icon.id,
          name: icon.name,
          normalizedName: icon.normalizedName,
          source: icon.sourceId,
          category: icon.category,
          tags: icon.tags,
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

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
  The icon source code in the requested format.

Examples:
  - "get the lucide arrow-right icon" -> iconId="lucide:arrow-right"
  - "get phosphor house icon as SVG" -> iconId="phosphor:house", format="svg"`,
      inputSchema: {
        iconId: z
          .string()
          .describe("Icon ID in format 'source:name' (e.g., 'lucide:arrow-right')"),
        format: z
          .enum(["svg", "react", "vue", "svelte", "json"])
          .default("react")
          .describe("Output format"),
        size: z.number().int().min(8).max(512).default(24).describe("Icon size in pixels"),
        strokeWidth: z.number().min(0.5).max(4).default(2).describe("Stroke width"),
      },
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
          content: [{ type: "text", text: `Error: Icon not found: ${params.iconId}` }],
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
  Array of icons with their source code.`,
      inputSchema: {
        iconIds: z
          .array(z.string())
          .min(1)
          .max(50)
          .describe("Array of icon IDs to retrieve"),
        format: z
          .enum(["svg", "react", "vue", "svelte", "json"])
          .default("react")
          .describe("Output format"),
        size: z.number().int().min(8).max(512).default(24).describe("Icon size"),
        strokeWidth: z.number().min(0.5).max(4).default(2).describe("Stroke width"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const results: Array<{
        id: string;
        name: string;
        code: string;
        error?: string;
      }> = [];

      for (const iconId of params.iconIds) {
        try {
          const icon = await getIconById(iconId);
          if (!icon) {
            results.push({ id: iconId, name: "", code: "", error: "Icon not found" });
            continue;
          }

          const code = await convertIconToFormat(icon, format, {
            size: params.size,
            strokeWidth: params.strokeWidth,
          });

          results.push({ id: icon.id, name: icon.name, code });
        } catch (error) {
          results.push({
            id: iconId,
            name: "",
            code: "",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const output = { format, icons: results };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  server.registerTool(
    "unicon_get_starter_pack",
    {
      title: "Get Starter Pack",
      description: `Get a curated starter pack of icons for common use cases.

Available packs:
  - dashboard: Admin dashboard icons (home, settings, users, charts)
  - ecommerce: Shopping icons (cart, payment, shipping)
  - social: Social media icons (share, like, comment)
  - brand-ai: AI/ML brand icons (OpenAI, Anthropic, etc.)

Args:
  - packId (string): Starter pack ID
  - format (string, optional): Output format (default: react)
  - size (number, optional): Icon size (default: 24)
  - strokeWidth (number, optional): Stroke width (default: 2)

Returns:
  All icons in the pack with their source code.`,
      inputSchema: {
        packId: z.string().describe("Starter pack ID (e.g., 'dashboard', 'ecommerce')"),
        format: z
          .enum(["svg", "react", "vue", "svelte", "json"])
          .default("react")
          .describe("Output format"),
        size: z.number().int().min(8).max(512).default(24).describe("Icon size"),
        strokeWidth: z.number().min(0.5).max(4).default(2).describe("Stroke width"),
      },
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
        const availablePacks = STARTER_PACKS.map((p) => p.id).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Error: Starter pack not found: ${params.packId}. Available packs: ${availablePacks}`,
            },
          ],
          isError: true,
        };
      }

      const format = params.format as "svg" | "react" | "vue" | "svelte" | "json";
      const results: Array<{ name: string; code: string; error?: string }> = [];

      const fetchedIcons = await getIconsByNames(pack.iconNames);
      const iconsByName = new Map(
        fetchedIcons.map((icon) => [icon.normalizedName.toLowerCase(), icon])
      );

      await Promise.all(
        pack.iconNames.map(async (iconName) => {
          try {
            const icon = iconsByName.get(iconName.toLowerCase());
            if (!icon) {
              results.push({ name: iconName, code: "", error: "Icon not found" });
              return;
            }

            const code = await convertIconToFormat(icon, format, {
              size: params.size,
              strokeWidth: params.strokeWidth,
            });

            results.push({ name: icon.normalizedName, code });
          } catch (error) {
            results.push({
              name: iconName,
              code: "",
              error: error instanceof Error ? error.message : "Unknown error",
            });
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

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // Register resources
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
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
}

/**
 * POST /api/mcp/sse - Handle MCP requests
 */
export async function POST(request: Request) {
  try {
    const server = createMcpServer();
    const transport = createTransport();

    await server.connect(transport);

    const response = await transport.handleRequest(request);

    return response;
  } catch (error) {
    logger.error("MCP SSE Error:", error);
    return new Response(
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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * GET /api/mcp/sse - SSE stream for server-initiated messages
 */
export async function GET(request: Request) {
  try {
    const server = createMcpServer();
    const transport = createTransport();

    await server.connect(transport);

    const response = await transport.handleRequest(request);

    return response;
  } catch (error) {
    logger.error("MCP SSE GET Error:", error);
    return new Response(
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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * DELETE /api/mcp/sse - Terminate session (stateless, so just acknowledge)
 */
export async function DELETE() {
  return new Response(null, { status: 200 });
}

/**
 * OPTIONS /api/mcp/sse - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id",
    },
  });
}
