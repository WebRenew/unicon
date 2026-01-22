export interface SkillEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly publicPath: string;
  readonly tags: readonly string[];
  readonly updatedAt: string;
}

export const skillEntries: readonly SkillEntry[] = [
  {
    id: "unicon",
    name: "Unicon",
    description:
      "Help users add icons to React, Vue, Svelte, or web projects using the Unicon CLI and API.",
    publicPath: "/skills/unicon.md",
    tags: ["icons", "cli", "ai-assistants", "api"],
    updatedAt: "2026-01-22",
  },
  {
    id: "unicon-mcp",
    name: "Unicon MCP",
    description:
      "Guide setup and usage of the Unicon MCP server in Claude, Cursor, and other MCP clients.",
    publicPath: "/skills/unicon-mcp.md",
    tags: ["mcp", "ai-assistants", "icons", "setup"],
    updatedAt: "2026-01-22",
  },
];
