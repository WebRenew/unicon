---
name: unicon-mcp
description: Help users connect the Unicon MCP server to Claude Desktop, Cursor, and other MCP clients. Use when setting up MCP config, verifying installs, or using Unicon tools for icon search and generation.
---

# Unicon MCP

Use the Unicon MCP server to search and generate icon components through AI assistants like Claude Desktop and Cursor.

## Quick Start

### Claude Desktop

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add:

```json
{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@webrenew/unicon-mcp-server"]
    }
  }
}
```

3. Fully quit and restart Claude Desktop.

### Cursor

1. Open **Settings → MCP Servers**
2. Add the same JSON config shown above
3. Restart Cursor

## Verify Installation

- Claude Desktop: look for the 🔌 icon, ensure `unicon` appears
- Cursor: run `claude mcp list` if using Claude Code

## Common Prompts

- “Search for dashboard icons in Lucide”
- “Get React component for lucide:arrow-right”
- “Generate Vue components for social media icons”
- “List available icon libraries”

## Available Tools

### search_icons

Search through 14,700+ icons with optional filters.

**Parameters**
- `query` (required)
- `source` (optional)
- `category` (optional)
- `limit` (optional)

### get_icon

Return code for a single icon in a requested format.

**Parameters**
- `iconId` (required)
- `format` (optional: svg, react, vue, svelte, json)
- `size` (optional)
- `strokeWidth` (optional)

### get_multiple_icons

Fetch up to 50 icons at once in a shared format.

**Parameters**
- `iconIds` (required)
- `format` (optional)
- `size` (optional)
- `strokeWidth` (optional)

## Resources

- `unicon://sources` for library metadata
- `unicon://categories` for category list
- `unicon://stats` for overall counts

## Troubleshooting

- If the server does not appear, restart the app fully (Cmd+Q on macOS)
- If installs are slow, the first `npx` run downloads the package
- If icons are missing, run `search_icons` to confirm the ID
