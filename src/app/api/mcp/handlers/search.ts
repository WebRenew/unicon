/**
 * MCP Tool Handler: search_icons
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchIcons, getSearchCount } from "@/lib/queries";
import {
  generateReactBundle,
  generateSvgBundle,
  generateJsonBundle,
} from "@/lib/icon-converters";
import { normalizeIcons } from "@/lib/icon-utils";
import {
  formatSchema,
  strokeWidthSchema,
  normalizeStrokesSchema,
  sourceSchema,
  truncateIfNeeded,
} from "./shared";

export function registerSearchTools(server: McpServer) {
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
}
