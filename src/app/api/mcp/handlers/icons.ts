/**
 * MCP Tool Handlers: get_icon, get_multiple_icons
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getIconById, getIconsByIds } from "@/lib/queries";
import {
  convertIconToFormat,
  generateReactBundle,
  generateSvgBundle,
  generateJsonBundle,
} from "@/lib/icon-converters";
import { normalizeIcons, normalizeIcon } from "@/lib/icon-utils";
import {
  iconIdSchema,
  formatSchema,
  sizeSchema,
  strokeWidthSchema,
  normalizeStrokesSchema,
  outputSchema,
  truncateIfNeeded,
  formatBatchIconsText,
} from "./shared";

export function registerIconTools(server: McpServer) {
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
}
