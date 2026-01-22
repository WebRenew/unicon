#!/usr/bin/env node
/**
 * Unicon MCP Server
 *
 * Provides Model Context Protocol (MCP) interface for Unicon icon library.
 * Connects AI assistants (Claude, Cursor) to 14,700+ icons from 8 libraries.
 *
 * This is a bridge that proxies MCP requests to the hosted Unicon API.
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
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
const API_BASE_URL = process.env.UNICON_API_URL || "https://unicon.webrenew.com/api/mcp";
let requestId = 0;
/**
 * Send MCP JSON-RPC request to the API
 */
async function mcpRequest(method, params = {}) {
    requestId++;
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: requestId,
            method,
            params,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed: ${response.status} ${text}`);
    }
    const data = (await response.json());
    if (data.error) {
        throw new Error(data.error.message || "API error");
    }
    return data.result;
}
/**
 * Create and configure MCP server
 */
const server = new Server({
    name: "unicon",
    version: "1.0.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    // First initialize the connection
    await mcpRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "unicon-bridge", version: "1.0.0" },
    });
    const result = await mcpRequest("tools/list", {});
    return { tools: result?.tools || [] };
});
/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const result = await mcpRequest("resources/list", {});
    return { resources: result?.resources || [] };
});
/**
 * Read a resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const result = await mcpRequest("resources/read", {
        uri: request.params.uri,
    });
    return {
        contents: result?.contents || [],
    };
});
/**
 * Call a tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const result = await mcpRequest("tools/call", {
            name: request.params.name,
            arguments: request.params.arguments || {},
        });
        // Return the content directly from the API response
        // The API already formats batch outputs with identifying comments
        return {
            content: result?.content || [
                { type: "text", text: JSON.stringify(result, null, 2) },
            ],
            structuredContent: result?.structuredContent,
            isError: result?.isError,
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}. Check your connection to ${API_BASE_URL}`,
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
//# sourceMappingURL=index.js.map