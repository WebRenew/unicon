/**
 * Unicon MCP API Endpoint
 * 
 * This endpoint provides MCP-compatible functionality over REST.
 * For full MCP integration, users should install the local server package:
 * 
 *   npx @webrenew/unicon-mcp-server
 * 
 * The local server proxies requests to this API and provides proper
 * MCP stdio/SSE transport for AI assistants.
 */

import {
  searchIcons,
  getIconById,
  getSources,
  getCategories,
  getTotalIconCount,
} from "@/lib/queries";
import { convertIconToFormat } from "@/lib/icon-converters";
import { STARTER_PACKS } from "@/lib/starter-packs";

/**
 * GET /api/mcp - Server info and capabilities
 */
export async function GET() {
  return Response.json({
    name: "Unicon MCP API",
    version: "1.0.0",
    description: "REST API for Unicon icon library with MCP compatibility",
    capabilities: {
      tools: ["search_icons", "get_icon", "get_multiple_icons", "get_starter_pack"],
      resources: ["sources", "categories", "stats", "starter_packs"],
    },
    usage: {
      direct: "POST /api/mcp with { action, params }",
      mcp: "Install: npx @webrenew/unicon-mcp-server",
      docs: "https://unicon.webrenew.com/docs/mcp",
    },
  });
}

/**
 * POST /api/mcp - Execute actions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, params = {} } = body;

    switch (action) {
      case "list_tools":
        return Response.json({
          tools: [
            {
              name: "search_icons",
              description:
                "Search through 14,700+ icons across 8 libraries using semantic search",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query (e.g., 'arrow', 'dashboard')",
                  },
                  source: {
                    type: "string",
                    enum: [
                      "lucide",
                      "phosphor",
                      "hugeicons",
                      "heroicons",
                      "tabler",
                      "feather",
                      "remix",
                      "simple-icons",
                    ],
                  },
                  category: { type: "string" },
                  limit: { type: "number", default: 20, maximum: 100 },
                },
                required: ["query"],
              },
            },
            {
              name: "get_icon",
              description: "Retrieve source code for a specific icon",
              inputSchema: {
                type: "object",
                properties: {
                  iconId: {
                    type: "string",
                    description: "Icon ID (e.g., 'lucide:arrow-right')",
                  },
                  format: {
                    type: "string",
                    enum: ["svg", "react", "vue", "svelte", "json"],
                    default: "react",
                  },
                  size: { type: "number", default: 24 },
                  strokeWidth: { type: "number", default: 2 },
                },
                required: ["iconId"],
              },
            },
            {
              name: "get_multiple_icons",
              description: "Retrieve multiple icons at once",
              inputSchema: {
                type: "object",
                properties: {
                  iconIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                  format: {
                    type: "string",
                    enum: ["svg", "react", "vue", "svelte", "json"],
                    default: "react",
                  },
                  size: { type: "number", default: 24 },
                  strokeWidth: { type: "number", default: 2 },
                },
                required: ["iconIds"],
              },
            },
            {
              name: "get_starter_pack",
              description: "Get a curated starter pack of icons for common use cases (e.g., dashboard, ecommerce, social media). Returns all icons in the pack.",
              inputSchema: {
                type: "object",
                properties: {
                  packId: {
                    type: "string",
                    description: "Starter pack ID (e.g., 'dashboard', 'ecommerce', 'social', 'brand-ai'). Use the starter_packs resource to see all available packs.",
                  },
                  format: {
                    type: "string",
                    enum: ["svg", "react", "vue", "svelte", "json"],
                    default: "react",
                  },
                  size: { type: "number", default: 24 },
                  strokeWidth: { type: "number", default: 2 },
                },
                required: ["packId"],
              },
            },
          ],
        });

      case "list_resources":
        return Response.json({
          resources: [
            {
              uri: "unicon://sources",
              name: "Icon Sources",
              description: "List all available icon libraries",
              mimeType: "application/json",
            },
            {
              uri: "unicon://categories",
              name: "Icon Categories",
              description: "List all icon categories",
              mimeType: "application/json",
            },
            {
              uri: "unicon://stats",
              name: "Library Statistics",
              description: "Total icon count and stats",
              mimeType: "application/json",
            },
            {
              uri: "unicon://starter_packs",
              name: "Starter Packs",
              description: "Curated icon packs for common use cases",
              mimeType: "application/json",
            },
          ],
        });

      case "read_resource": {
        const { uri } = params;
        if (!uri || typeof uri !== "string") {
          throw new Error("Missing or invalid uri parameter");
        }

        const url = new URL(uri);
        const path = url.pathname.replace(/^\/\//, "");

        switch (path) {
          case "sources": {
            const sources = await getSources();
            return Response.json({ contents: sources });
          }

          case "categories": {
            const categories = await getCategories();
            return Response.json({ contents: { categories } });
          }

          case "stats": {
            const totalIcons = await getTotalIconCount();
            const sources = await getSources();
            return Response.json({
              contents: {
                totalIcons,
                sources: sources.map((s) => ({
                  id: s.id,
                  name: s.name,
                  count: s.totalIcons,
                })),
              },
            });
          }

          case "starter_packs": {
            return Response.json({
              contents: {
                total: STARTER_PACKS.length,
                packs: STARTER_PACKS.map((pack) => ({
                  id: pack.id,
                  name: pack.name,
                  description: pack.description,
                  color: pack.color,
                  iconCount: pack.iconNames.length,
                  icons: pack.iconNames,
                })),
              },
            });
          }

          default:
            throw new Error(`Unknown resource path: ${path}`);
        }
      }

      case "call_tool": {
        const { name, arguments: args = {} } = params;

        switch (name) {
          case "search_icons": {
            const searchParams: {
              query: string;
              sourceId?: string;
              category?: string;
              limit: number;
            } = {
              query: args.query,
              limit: Math.min(args.limit || 20, 100),
            };

            if (args.source) {
              searchParams.sourceId = args.source;
            }
            if (args.category) {
              searchParams.category = args.category;
            }

            const results = await searchIcons(searchParams);

            return Response.json({
              result: {
                query: args.query,
                total: results.length,
                results: results.map((icon) => ({
                  id: icon.id,
                  name: icon.name,
                  normalizedName: icon.normalizedName,
                  source: icon.sourceId,
                  category: icon.category,
                  tags: icon.tags,
                })),
              },
            });
          }

          case "get_icon": {
            const icon = await getIconById(args.iconId);
            if (!icon) {
              throw new Error(`Icon not found: ${args.iconId}`);
            }

            const format = (args.format || "react") as "svg" | "react" | "vue" | "svelte" | "json";

            const convertProps: {
              size?: number;
              strokeWidth?: number;
            } = {};

            if (args.size !== undefined) {
              convertProps.size = args.size;
            }
            if (args.strokeWidth !== undefined) {
              convertProps.strokeWidth = args.strokeWidth;
            }

            const code = await convertIconToFormat(icon, format, convertProps);

            return Response.json({
              result: {
                iconId: args.iconId,
                format,
                code,
              },
            });
          }

          case "get_multiple_icons": {
            if (!Array.isArray(args.iconIds) || args.iconIds.length === 0) {
              throw new Error("iconIds must be a non-empty array");
            }

            if (args.iconIds.length > 50) {
              throw new Error("Maximum 50 icons per request");
            }

            const format = (args.format || "react") as "svg" | "react" | "vue" | "svelte" | "json";
            const results: Array<{
              id: string;
              name: string;
              code: string;
              error?: string;
            }> = [];

            for (const iconId of args.iconIds) {
              try {
                const icon = await getIconById(iconId);
                if (!icon) {
                  results.push({
                    id: iconId,
                    name: "",
                    code: "",
                    error: "Icon not found",
                  });
                  continue;
                }

                const convertProps: {
                  size?: number;
                  strokeWidth?: number;
                } = {};

                if (args.size !== undefined) {
                  convertProps.size = args.size;
                }
                if (args.strokeWidth !== undefined) {
                  convertProps.strokeWidth = args.strokeWidth;
                }

                const code = await convertIconToFormat(icon, format, convertProps);

                results.push({
                  id: icon.id,
                  name: icon.name,
                  code,
                });
              } catch (error) {
                results.push({
                  id: iconId,
                  name: "",
                  code: "",
                  error: error instanceof Error ? error.message : "Unknown error",
                });
              }
            }

            return Response.json({
              result: {
                format,
                icons: results,
              },
            });
          }

          case "get_starter_pack": {
            const pack = STARTER_PACKS.find((p) => p.id === args.packId);
            if (!pack) {
              throw new Error(`Starter pack not found: ${args.packId}. Use the starter_packs resource to see available packs.`);
            }

            const format = (args.format || "react") as "svg" | "react" | "vue" | "svelte" | "json";
            const results: Array<{
              name: string;
              code: string;
              error?: string;
            }> = [];

            // Search for each icon in the pack
            for (const iconName of pack.iconNames) {
              try {
                const searchResults = await searchIcons({
                  query: iconName,
                  limit: 1,
                });

                const icon = searchResults.find(
                  (i) => i.normalizedName === iconName || i.name === iconName
                );

                if (!icon) {
                  results.push({
                    name: iconName,
                    code: "",
                    error: "Icon not found",
                  });
                  continue;
                }

                const convertProps: {
                  size?: number;
                  strokeWidth?: number;
                } = {};

                if (args.size !== undefined) {
                  convertProps.size = args.size;
                }
                if (args.strokeWidth !== undefined) {
                  convertProps.strokeWidth = args.strokeWidth;
                }

                const code = await convertIconToFormat(icon, format, convertProps);

                results.push({
                  name: icon.normalizedName,
                  code,
                });
              } catch (error) {
                results.push({
                  name: iconName,
                  code: "",
                  error: error instanceof Error ? error.message : "Unknown error",
                });
              }
            }

            return Response.json({
              result: {
                packId: pack.id,
                packName: pack.name,
                description: pack.description,
                format,
                totalIcons: pack.iconNames.length,
                retrievedIcons: results.filter((r) => !r.error).length,
                icons: results,
              },
            });
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("MCP API Error:", error);
    return Response.json(
      {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/mcp - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
