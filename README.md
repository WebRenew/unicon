# Unicon

**Just the icons you need. Zero bloat.**

Browse 17,786+ icons from popular libraries and copy exactly what you need. Like [shadcn/ui](https://ui.shadcn.com), but for icons.

[**Try it now at unicon.webrenew.com**](https://unicon.webrenew.com)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Unicon?

Most icon libraries force you to install thousands of icons just to use a handful. Unicon lets you browse everything in one place and copy only what you need.

- **Browse once, use anywhere** — Search across 8 icon libraries without installing any of them
- **Copy exactly what you need** — Get React components, SVG code, or usage snippets with one click
- **Bundle multiple icons** — Select several icons and export them all at once
- **Zero dependencies** — Paste components directly into your project

## Icon Libraries

| Library | Icons | Style |
|---------|-------|-------|
| [Lucide](https://lucide.dev) | 1,500+ | Minimal, consistent stroke |
| [Phosphor](https://phosphoricons.com) | 1,300+ | 6 weights per icon |
| [Huge Icons](https://hugeicons.com) | 4,000+ | Modern, versatile |
| [Heroicons](https://heroicons.com) | 300+ | By Tailwind CSS team |
| [Tabler](https://tabler.io/icons) | 5,000+ | Clean, customizable |
| [Feather](https://feathericons.com) | 280+ | Simple, elegant |
| [Remix Icon](https://remixicon.com) | 2,800+ | Outlined & filled |
| [Simple Icons](https://simpleicons.org) | 3,300+ | Brand logos |

## How to Use

### 1. Search for icons

Use natural language — search for "happy face" and find smile icons, search for "business" and find briefcases, charts, and handshakes.

### 2. Copy what you need

Click any icon and choose your format:

**React Component** — Drop directly into your project:
```jsx
export const ArrowRight = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M13.22 19.03a.75.75 0 0 1 0-1.06L18.19 13H3.75a.75.75 0 0 1 0-1.5h14.44l-4.97-4.97a.75.75 0 0 1 1.06-1.06l6.25 6.25a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0Z"/>
  </svg>
)
```

**Raw SVG** — For HTML, design tools, or anywhere else:
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M13.22 19.03..."/>
</svg>
```

### 3. Bundle multiple icons

Building a project and need several icons? Select multiple icons, then export them all as:
- A single file with all React components
- Individual SVG files
- JSON metadata

### 4. Open in v0

Send any icon directly to [v0.dev](https://v0.dev) to quickly prototype UI components around it.

## CLI

Install icons directly from your terminal.

### Installation

```bash
# Global install
npm install -g @webrenew/unicon

# Or use with npx (no install needed)
npx @webrenew/unicon search "dashboard"
```

### Quick Start

```bash
# Search for icons
unicon search "dashboard settings"

# Get a single icon (React component)
unicon get home

# Copy to clipboard (macOS)
unicon get home | pbcopy

# Save to file
unicon get settings --format react -o ./Settings.tsx

# Bundle multiple icons
unicon bundle --category Dashboards -o ./icons

# Preview icon in terminal
unicon preview star --width 24
```

### Output Formats

| Format | Description |
|--------|-------------|
| `react` | TypeScript React components (default) |
| `vue` | Vue 3 Single File Components |
| `svelte` | Svelte components |
| `svg` | Raw SVG files |
| `json` | Icon data as JSON |

### Config-Driven Workflow

For larger projects, use a config file to manage your icon bundles:

```bash
# Initialize config
unicon init

# Add bundles
unicon add dashboard --category Dashboards
unicon add nav --query "arrow menu chevron"

# Regenerate all bundles
unicon sync
```

See [CLI.md](./CLI.md) for full documentation.

## AI Integration

Unicon integrates with AI coding assistants to help you find and add icons while you code.

### Skills for AI Assistants

Install rules/skills that teach AI assistants how to use Unicon:

```bash
# Install for specific IDE
unicon skill --ide claude    # Claude Code
unicon skill --ide cursor    # Cursor
unicon skill --ide windsurf  # Windsurf

# Install for all supported IDEs
unicon skill --all

# List supported IDEs
unicon skill --list
```

**Supported IDEs:**

| IDE | Directory |
|-----|-----------|
| Claude Code | `.claude/skills/unicon/` |
| Cursor | `.cursor/rules/` |
| Windsurf | `.windsurf/rules/` |
| Agent | `.agent/rules/` |
| Antigravity | `.antigravity/rules/` |
| OpenCode | `.opencode/rules/` |
| Codex | `.codex/` |
| Aider | `.aider/rules/` |

Once installed, ask your AI assistant things like:
- "Add a home icon to my project"
- "Search for dashboard icons"
- "Bundle navigation icons for my React app"

### MCP Server

For deeper AI integration, use the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server. This gives AI assistants direct access to search and retrieve icons.

**Claude Desktop** — Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Cursor** — Add to your Cursor MCP settings:

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

**Available MCP Tools:**

| Tool | Description |
|------|-------------|
| `search_icons` | Semantic search across 14,700+ icons |
| `get_icon` | Get source code for a specific icon |
| `get_multiple_icons` | Retrieve multiple icons at once |

See [packages/mcp-server/README.md](./packages/mcp-server/README.md) for full MCP documentation.

## Self-Hosting

Want to run your own instance? See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WebRenew/unicon)

## License

MIT License — see [LICENSE](LICENSE) for details.

Icons retain their original licenses:
- Lucide, Phosphor, Huge Icons, Heroicons, Tabler, Feather — MIT
- Remix Icon — Apache-2.0
- Simple Icons — CC0 (brand logos are trademarks of their respective owners)

---

Built by [WebRenew](https://webrenew.com)

[Live Demo](https://unicon.webrenew.com) · [Report Bug](https://github.com/WebRenew/unicon/issues) · [Request Feature](https://github.com/WebRenew/unicon/issues)
