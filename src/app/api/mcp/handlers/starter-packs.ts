/**
 * MCP Tool Handler: get_starter_pack
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getIconsByNames } from "@/lib/queries";
import {
  convertIconToFormat,
  generateReactBundle,
  generateSvgBundle,
  generateJsonBundle,
} from "@/lib/icon-converters";
import { normalizeIcons, normalizeIcon } from "@/lib/icon-utils";
import { STARTER_PACKS } from "@/lib/starter-packs";
import {
  VALID_PACK_IDS,
  formatSchema,
  sizeSchema,
  strokeWidthSchema,
  normalizeStrokesSchema,
  outputSchema,
  truncateIfNeeded,
  formatBatchIconsText,
  getCommentSyntax,
} from "./shared";

export function registerStarterPackTools(server: McpServer) {
  server.registerTool(
    "get_starter_pack",
    {
      title: "Get Starter Pack",
      description: `Get a curated starter pack of icons for common use cases.

Popular packs: shadcn-ui, dashboard, ecommerce, navigation, developer, brand-ai-agents, brand-ai

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
}
