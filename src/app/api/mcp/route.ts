import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  searchIcons,
  getIconById,
  getSources,
  getCategories,
  getTotalIconCount,
} from "@/lib/queries";
import { convertIconToFormat } from "@/lib/icon-converters";

/**
 * MCP Server for Unicon Icon Library
 * Provides tools and resources for AI assistants to search and retrieve icons.
 */
const server = new Server(
  {
    name: "unicon",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available resources (icon metadata endpoints)
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "unicon://sources",
        name: "Icon Sources",
        description: "List all available icon libraries (Lucide, Phosphor, Heroicons, etc.)",
        mimeType: "application/json",
      },
      {
        uri: "unicon://categories",
        name: "Icon Categories",
        description: "List all icon categories for filtering",
        mimeType: "application/json",
      },
      {
        uri: "unicon://stats",
        name: "Library Statistics",
        description: "Total icon count and library stats",
        mimeType: "application/json",
      },
    ],
  };
});

/**
 * Read a specific resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = new URL(request.params.uri);

  if (uri.protocol !== "unicon:") {
    throw new Error(`Unsupported protocol: ${uri.protocol}`);
  }

  const path = uri.pathname.replace(/^\/\//, "");

  switch (path) {
    case "sources": {
      const sources = await getSources();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(sources, null, 2),
          },
        ],
      };
    }

    case "categories": {
      const categories = await getCategories();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify({ categories }, null, 2),
          },
        ],
      };
    }

    case "stats": {
      const totalIcons = await getTotalIconCount();
      const sources = await getSources();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                totalIcons,
                sources: sources.map((s) => ({
                  id: s.id,
                  name: s.name,
                  count: s.totalIcons,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource path: ${path}`);
  }
});

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_icons",
        description:
          "Search through 14,700+ icons across 8 libraries using semantic search. Returns icon metadata including ID, name, category, and tags.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'arrow', 'dashboard', 'social media')",
            },
            source: {
              type: "string",
              description: "Filter by icon library",
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
            category: {
              type: "string",
              description: "Filter by category (use list_categories resource to see available)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20, max: 100)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_icon",
        description:
          "Retrieve the source code for a specific icon in various formats (React, Vue, Svelte, SVG, or JSON metadata).",
        inputSchema: {
          type: "object",
          properties: {
            iconId: {
              type: "string",
              description: "Icon ID in format 'source:name' (e.g., 'lucide:arrow-right')",
            },
            format: {
              type: "string",
              description: "Output format",
              enum: ["svg", "react", "vue", "svelte", "json"],
              default: "react",
            },
            size: {
              type: "number",
              description: "Icon size in pixels (default: 24)",
              default: 24,
            },
            strokeWidth: {
              type: "number",
              description: "Stroke width for outline icons (default: 2)",
              default: 2,
            },
          },
          required: ["iconId"],
        },
      },
      {
        name: "get_multiple_icons",
        description:
          "Retrieve multiple icons at once. Useful for generating icon libraries or components.",
        inputSchema: {
          type: "object",
          properties: {
            iconIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of icon IDs (e.g., ['lucide:home', 'lucide:settings'])",
            },
            format: {
              type: "string",
              description: "Output format for all icons",
              enum: ["svg", "react", "vue", "svelte", "json"],
              default: "react",
            },
            size: {
              type: "number",
              description: "Icon size in pixels (default: 24)",
              default: 24,
            },
            strokeWidth: {
              type: "number",
              description: "Stroke width for outline icons (default: 2)",
              default: 2,
            },
          },
          required: ["iconIds"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "search_icons": {
        const args = request.params.arguments as {
          query: string;
          source?: string;
          category?: string;
          limit?: number;
        };

        const results = await searchIcons({
          query: args.query,
          sourceId: args.source,
          category: args.category,
          limit: Math.min(args.limit || 20, 100),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
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
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_icon": {
        const args = request.params.arguments as {
          iconId: string;
          format?: "svg" | "react" | "vue" | "svelte" | "json";
          size?: number;
          strokeWidth?: number;
        };

        const icon = await getIconById(args.iconId);
        if (!icon) {
          throw new Error(`Icon not found: ${args.iconId}`);
        }

        const format = args.format || "react";
        const code = await convertIconToFormat(icon, format, {
          size: args.size,
          strokeWidth: args.strokeWidth,
        });

        return {
          content: [
            {
              type: "text",
              text: code,
            },
          ],
        };
      }

      case "get_multiple_icons": {
        const args = request.params.arguments as {
          iconIds: string[];
          format?: "svg" | "react" | "vue" | "svelte" | "json";
          size?: number;
          strokeWidth?: number;
        };

        if (!Array.isArray(args.iconIds) || args.iconIds.length === 0) {
          throw new Error("iconIds must be a non-empty array");
        }

        if (args.iconIds.length > 50) {
          throw new Error("Maximum 50 icons per request");
        }

        const format = args.format || "react";
        const results: Array<{ id: string; name: string; code: string; error?: string }> = [];

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

            const code = await convertIconToFormat(icon, format, {
              size: args.size,
              strokeWidth: args.strokeWidth,
            });

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

        // Format output based on format type
        if (format === "json") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        // For component formats, create separate sections for each icon
        const output = results
          .map((result) => {
            if (result.error) {
              return `// Error for ${result.id}: ${result.error}`;
            }
            return `// ${result.name} (${result.id})\n${result.code}`;
          })
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * SSE Transport Handler
 * Handles Server-Sent Events for real-time communication with MCP clients
 */
export async function POST(request: Request) {
  try {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Parse incoming messages from request body
    const body = await request.text();
    let messages: unknown[] = [];

    if (body) {
      try {
        messages = JSON.parse(body);
        if (!Array.isArray(messages)) {
          messages = [messages];
        }
      } catch (error) {
        console.error("Failed to parse request body:", error);
      }
    }

    // Process messages and send responses via SSE
    const processMessages = async () => {
      for (const message of messages) {
        try {
          // Handle the message through the MCP server
          const response = await server.handleRequest(message as never);
          
          // Send response as SSE event
          const data = JSON.stringify(response);
          await writer.write(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("Error processing message:", error);
          const errorResponse = {
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Internal error",
            },
            id: (message as { id?: unknown })?.id ?? null,
          };
          await writer.write(encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`));
        }
      }

      // Keep connection alive
      await writer.write(encoder.encode(": keepalive\n\n"));
    };

    // Start processing in background
    processMessages().catch(console.error);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("MCP Server Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
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

/**
 * Handle GET requests for server info
 */
export async function GET() {
  return Response.json({
    name: "Unicon MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for Unicon icon library",
    capabilities: {
      tools: ["search_icons", "get_icon", "get_multiple_icons"],
      resources: ["unicon://sources", "unicon://categories", "unicon://stats"],
    },
    usage: {
      endpoint: "/api/mcp",
      transport: "SSE",
      documentation: "https://unicon.webrenew.com/docs/mcp",
    },
  });
}
