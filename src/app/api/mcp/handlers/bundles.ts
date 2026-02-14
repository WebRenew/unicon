/**
 * MCP Tool Handlers: list_my_bundles, get_my_bundle, create_my_bundle (authenticated)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getIconsByIds } from "@/lib/queries";
import { generateReactBundle, generateSvgBundle, generateJsonBundle } from "@/lib/icon-converters";
import { normalizeIcons } from "@/lib/icon-utils";
import { STANDARD_VIEWBOX } from "@/lib/icon-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AuthContext,
  bundleNameSchema,
  bundleDescriptionSchema,
  bundleIconIdsSchema,
  strokePresetSchema,
  normalizeStrokesSchema,
  strokeWidthSchema,
  viewBoxSchema,
  truncateIfNeeded,
} from "./shared";

export function registerBundleTools(server: McpServer, authContext: AuthContext) {
  // TOOL: list_my_bundles
  server.registerTool(
    "list_my_bundles",
    {
      title: "List My Bundles",
      description: `List all your saved icon bundles. Requires authentication via UNICON_API_TOKEN.

Returns:
  Array of bundles with id, name, description, and icon count.

Example:
  list_my_bundles({})`,
      inputSchema: z.object({}).strict(),
      outputSchema: z
        .object({
          bundles: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              icon_count: z.number(),
              is_public: z.boolean(),
              share_slug: z.string().nullable(),
            })
          ),
          total: z.number(),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const supabase = createAdminClient();

      const { data: bundles, error } = await supabase
        .from("bundles")
        .select("id, name, description, icon_count, is_public, share_slug, created_at, updated_at")
        .eq("user_id", authContext.userId)
        .order("updated_at", { ascending: false });

      if (error) {
        return {
          content: [{ type: "text", text: `Error fetching bundles: ${error.message}` }],
          isError: true,
        };
      }

      const output = {
        bundles: bundles || [],
        total: bundles?.length || 0,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // TOOL: get_my_bundle
  server.registerTool(
    "get_my_bundle",
    {
      title: "Get My Bundle",
      description: `Get icons from one of your saved bundles. Requires authentication via UNICON_API_TOKEN.

Args:
  - bundleId (string): The bundle ID (UUID)
  - format (string, optional): Output format - svg, react, json (default: react)
  - includeCode (boolean, optional): Include generated code (default: true)

Returns:
  Bundle metadata, list of icons, and optionally generated code.

Example:
  get_my_bundle({ bundleId: "abc-123", format: "react" })`,
      inputSchema: z
        .object({
          bundleId: z.string().uuid().describe("Bundle ID"),
          format: z
            .enum(["svg", "react", "json"])
            .default("react")
            .describe("Output format"),
          includeCode: z
            .boolean()
            .default(true)
            .describe("Include generated code in response"),
        })
        .strict(),
      outputSchema: z
        .object({
          bundle: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            icon_count: z.number(),
            icons: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                normalizedName: z.string(),
                source: z.string(),
              })
            ),
          }),
          format: z.string(),
          code: z.string().optional(),
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
      const supabase = createAdminClient();
      const format = params.format as "svg" | "react" | "json";
      const includeCode = params.includeCode ?? true;

      // Fetch the bundle
      const { data: bundle, error } = await supabase
        .from("bundles")
        .select("*")
        .eq("id", params.bundleId)
        .eq("user_id", authContext.userId)
        .single();

      if (error || !bundle) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Bundle not found. Use list_my_bundles to see your available bundles.`,
            },
          ],
          isError: true,
        };
      }

      // Get icon IDs from bundle
      const iconIds = (bundle.icons as Array<{ id: string }>)?.map((i) => i.id) || [];

      if (iconIds.length === 0) {
        const output = {
          bundle: {
            id: bundle.id,
            name: bundle.name,
            description: bundle.description,
            icon_count: 0,
            icons: [],
          },
          format,
          code: includeCode ? "// Empty bundle - no icons" : undefined,
        };
        return {
          content: [{ type: "text", text: "Bundle is empty - no icons saved." }],
          structuredContent: output,
        };
      }

      // Fetch full icon data
      const icons = await getIconsByIds(iconIds);

      // Apply normalization if configured
      const normalizedIcons = bundle.normalize_strokes
        ? normalizeIcons(icons, {
            strokeWidth: bundle.target_stroke_width || 2,
            skipFillIcons: true,
          })
        : icons;

      // Generate code if requested
      let code: string | undefined;
      if (includeCode) {
        const strokeWidth = bundle.target_stroke_width || 2;
        switch (format) {
          case "react":
            code = generateReactBundle(normalizedIcons, { strokeWidth });
            break;
          case "svg":
            code = generateSvgBundle(normalizedIcons, { strokeWidth });
            break;
          case "json":
            code = generateJsonBundle(normalizedIcons);
            break;
        }
      }

      const output = {
        bundle: {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          icon_count: icons.length,
          icons: icons.map((icon) => ({
            id: icon.id,
            name: icon.name,
            normalizedName: icon.normalizedName,
            source: icon.sourceId,
          })),
        },
        format,
        code,
      };

      const text = includeCode && code ? truncateIfNeeded(code) : JSON.stringify(output, null, 2);

      return {
        content: [{ type: "text", text }],
        structuredContent: output,
      };
    }
  );

  // TOOL: create_my_bundle
  server.registerTool(
    "create_my_bundle",
    {
      title: "Create My Bundle",
      description: `Create and save a new bundle to your account. Requires authentication via UNICON_API_TOKEN.

Args:
  - name (string): Bundle name
  - iconIds (string[]): Array of icon IDs (source:name)
  - description (string, optional): Bundle description
  - strokePreset (string, optional): thin | regular | bold
  - normalizeStrokes (boolean, optional): Normalize stroke widths across icons
  - targetStrokeWidth (number, optional): Stroke width when normalizeStrokes=true
  - normalizeViewbox (boolean, optional): Normalize viewBox sizes
  - targetViewbox (string, optional): Target viewBox when normalizeViewbox=true

Returns:
  Bundle metadata with id and icon count.

Example:
  create_my_bundle({ name: "dashboard", iconIds: ["lucide:home", "lucide:settings"] })`,
      inputSchema: z
        .object({
          name: bundleNameSchema,
          description: bundleDescriptionSchema,
          iconIds: bundleIconIdsSchema,
          strokePreset: strokePresetSchema,
          normalizeStrokes: normalizeStrokesSchema,
          targetStrokeWidth: strokeWidthSchema.optional(),
          normalizeViewbox: z.boolean().default(false),
          targetViewbox: viewBoxSchema,
        })
        .strict(),
      outputSchema: z
        .object({
          bundle: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            icon_count: z.number(),
            is_public: z.boolean().optional(),
            share_slug: z.string().nullable().optional(),
          }),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      const supabase = createAdminClient();

      const uniqueIconIds: string[] = [];
      const seen = new Set<string>();
      for (const id of params.iconIds) {
        if (!seen.has(id)) {
          seen.add(id);
          uniqueIconIds.push(id);
        }
      }

      if (uniqueIconIds.length === 0) {
        return {
          content: [{ type: "text", text: "Error: No icon IDs provided." }],
          isError: true,
        };
      }

      const icons = await getIconsByIds(uniqueIconIds);
      const iconMap = new Map(icons.map((icon) => [icon.id, icon]));
      const missing = uniqueIconIds.filter((id) => !iconMap.has(id));

      if (missing.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${missing.length} icon(s) not found: ${missing.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const orderedIcons = uniqueIconIds
        .map((id) => iconMap.get(id))
        .filter((icon): icon is NonNullable<typeof icon> => !!icon);

      const bundleIcons = orderedIcons.map((icon) => ({
        id: icon.id,
        name: icon.name,
        normalizedName: icon.normalizedName,
        sourceId: icon.sourceId,
        svg: icon.content,
        viewBox: icon.viewBox,
        strokeWidth: icon.strokeWidth,
        defaultFill: icon.defaultFill,
        defaultStroke: icon.defaultStroke,
      }));

      const { data, error } = await supabase.rpc("create_bundle_atomic", {
        p_user_id: authContext.userId,
        p_name: params.name,
        p_description: params.description ?? null,
        p_icons: bundleIcons,
        p_stroke_preset: params.strokePreset ?? null,
        p_normalize_strokes: params.normalizeStrokes ?? false,
        p_target_stroke_width: params.targetStrokeWidth ?? null,
        p_normalize_viewbox: params.normalizeViewbox ?? false,
        p_target_viewbox: params.targetViewbox ?? STANDARD_VIEWBOX,
      });

      if (error) {
        return {
          content: [{ type: "text", text: `Error creating bundle: ${error.message}` }],
          isError: true,
        };
      }

      const result = data?.[0];
      if (!result?.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating bundle: ${result?.error ?? "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const bundleResult = (result.bundle || {}) as {
        id?: string;
        name?: string;
        description?: string | null;
        icon_count?: number;
        is_public?: boolean;
        share_slug?: string | null;
      };

      const output = {
        bundle: {
          id: bundleResult.id ?? "",
          name: bundleResult.name ?? params.name,
          description: bundleResult.description ?? null,
          icon_count: bundleResult.icon_count ?? bundleIcons.length,
          is_public: bundleResult.is_public ?? false,
          share_slug: bundleResult.share_slug ?? null,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}
