#!/usr/bin/env node

/**
 * Unicon MCP Server
 * 
 * Provides Model Context Protocol (MCP) interface for Unicon icon library.
 * Connects AI assistants (Claude, Cursor) to 14,700+ icons from 8 libraries.
 * 
 * Usage:
 *   npx @webrenew/unicon-mcp-server
 * 
 * Configuration in Claude Desktop:
 *   {
 *     "mcpServers": {
 *       "unicon": {
 *         "command": "npx",
 *         "args": ["-y", "@webrenew/unicon-mcp-server"]
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = process.env.UNICON_API_URL || "https://unicon.webrenew.com/api/mcp";

/**
 * API Response Types
 */
interface APIResponse {
  tools?: unknown[];
  resources?: unknown[];
  contents?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI(action: string, params: Record<string, unknown> = {}): Promise<APIResponse> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      const error = await response.json() as APIResponse;
      throw new Error(error.error?.message || `API request failed: ${response.statusText}`);
    }

    return await response.json() as APIResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to communicate with Unicon API");
  }
}

/**
 * Create and configure MCP server
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
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const data = await fetchAPI("list_tools");
  return { tools: (data.tools || []) as unknown[] };
});

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const data = await fetchAPI("list_resources");
  return { resources: (data.resources || []) as unknown[] };
});

/**
 * Read a resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const data = await fetchAPI("read_resource", { uri: request.params.uri });
  
  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(data.contents, null, 2),
      },
    ],
  };
});

/**
 * Call a tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const data = await fetchAPI("call_tool", {
      name: request.params.name,
      arguments: request.params.arguments || {},
    });

    const result = data.result;
    const resultText = typeof result === "string" 
      ? result 
      : JSON.stringify(result, null, 2);

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  } catch (error: unknown) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : "Unknown error occurred",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start server with stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error("Unicon MCP Server running");
  console.error(`API endpoint: ${API_BASE_URL}`);
  console.error("Ready for requests from AI assistants");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
