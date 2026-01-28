---
name: unicon
description: Help users add icons to their projects using the Unicon icon library. Unicon provides 19,000+ icons from Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix, and Simple Icons. Use when adding icons to React, Vue, Svelte, or any web project; using the unicon CLI to search, get, or bundle icons; setting up .uniconrc.json config for icon management; generating tree-shakeable icon components; using the Unicon API for programmatic icon access; or converting between icon formats (SVG, React, Vue, Svelte, JSON).
---

# Unicon Icon Library

**19,000+ icons from 9 libraries** in one CLI tool. Generate tree-shakeable components for React, Vue, Svelte, or get raw SVG.

---

## Quick Start

```bash
# Install CLI globally
npm install -g @webrenew/unicon

# Search for icons (AI-powered semantic search)
unicon search "dashboard"

# Get a single icon to stdout
unicon get home

# Get icon as React component
unicon get home --format react -o ./Home.tsx

# Bundle multiple icons by category
unicon bundle --category Dashboards -o ./icons
```

**Web UI**: Browse all icons at [unicon.webrenew.com](https://unicon.webrenew.com)

---

## Core Concepts

- **19,000+ icons**: Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix, Simple Icons
- **Output formats**: `react`, `vue`, `svelte`, `svg`, `json`
- **Tree-shakeable**: Generates only the icons you use (no massive bundle imports)
- **Config-driven**: Define icon bundles in `.uniconrc.json`, regenerate with `unicon sync`
- **AI search**: Semantic search finds icons by meaning, not just exact name matches

---

## Common Workflows

### Add Icons to a React Project

```bash
# Create config file
unicon init

# Search for icons (shows matching icons)
unicon search "navigation arrows"

# Add icons to your config
unicon add nav --query "arrow menu"

# Generate all configured icon bundles
unicon sync
```

### Get a Single Icon Quickly

```bash
# Print to stdout
unicon get home

# Copy to clipboard (macOS)
unicon get home | pbcopy

# Save as React component
unicon get settings -o ./Settings.tsx

# Vue component
unicon get user --format vue -o ./User.vue

# Svelte component
unicon get search --format svelte -o ./Search.svelte
```

### Bundle Icons by Category

```bash
# Bundle all "Dashboards" icons as React
unicon bundle --category Dashboards --format react -o ./icons/dashboard.tsx

# Bundle from specific library
unicon bundle --source lucide --format vue -o ./icons/lucide-icons.vue

# Bundle with AI search query
unicon bundle --query "social media sharing" --limit 20 -o ./social.tsx
```

### Config-Driven Workflow

Create `.uniconrc.json`:

```json
{
  "bundles": [
    {
      "name": "dashboard",
      "category": "Dashboards",
      "limit": 50,
      "format": "react",
      "output": "./src/icons/dashboard.tsx"
    },
    {
      "name": "navigation",
      "query": "arrow chevron menu home",
      "source": "lucide",
      "format": "vue",
      "output": "./src/icons/navigation.vue"
    }
  ]
}
```

Then run:
```bash
unicon sync
```

Regenerates all bundles from config. Commit `.uniconrc.json` to version control.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `unicon search <query>` | AI-powered semantic search for icons |
| `unicon get <name>` | Get single icon (stdout or file) |
| `unicon info <name>` | Show icon details (source, tags, category) |
| `unicon preview <name>` | ASCII art preview in terminal |
| `unicon bundle` | Bundle multiple icons to a file |
| `unicon init` | Create `.uniconrc.json` config file |
| `unicon sync` | Regenerate all bundles from config |
| `unicon add <name>` | Add bundle to config |
| `unicon categories` | List all available categories |
| `unicon sources` | List icon libraries (Lucide, Phosphor, etc.) |
| `unicon cache` | Manage local icon cache |

**Global Flags:**
- `--format <type>` - Output format: `react`, `vue`, `svelte`, `svg`, `json`
- `-o, --output <path>` - Save to file instead of stdout
- `--source <library>` - Filter by library (lucide, phosphor, etc.)
- `--limit <n>` - Max results

---

## Output Formats

### React (.tsx)

```tsx
export function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  );
}
```

### Vue (.vue)

```vue
<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" v-bind="$attrs">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
</template>
```

### Svelte (.svelte)

```svelte
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...$$restProps}>
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
</svg>
```

### SVG (.svg)

Raw SVG file with viewBox and content.

### JSON

```json
{
  "id": "lucide:home",
  "name": "Home",
  "sourceId": "lucide",
  "category": "Buildings",
  "tags": ["house", "building"],
  "viewBox": "0 0 24 24",
  "content": "<path d=\"...\"/>",
  "defaultStroke": true,
  "defaultFill": false
}
```

---

## Icon Sources

| Library | Icons | Style |
|---------|-------|-------|
| Lucide | 1,900+ | Clean, consistent strokes |
| Phosphor | 1,500+ | Multiple weights (thin/regular/bold) |
| Hugeicons | 1,800+ | Modern, comprehensive |
| Heroicons | 292 | Tailwind's icon set |
| Tabler | 4,600+ | Pixel-perfect strokes |
| Feather | 287 | Minimal, beautiful |
| Remix | 2,800+ | Versatile, varied styles |
| Simple Icons | 3,300+ | Brand logos |

---

## Reference Documentation

For detailed information, see:

- **API Reference**: `references/api-reference.md` - REST API endpoints, parameters, response schemas
- **Full CLI docs**: Run `unicon --help` or `unicon <command> --help`
- **Web UI**: [unicon.webrenew.com](https://unicon.webrenew.com) - Browse, search, copy icons

---

## Why Unicon?

**vs npm icon packages:**
- ❌ Traditional: Import entire library (500KB+ bundle)
- ✅ Unicon: Generate only icons you use (2KB per icon)

**vs manual SVG copying:**
- ❌ Manual: Copy/paste SVGs, inconsistent formatting
- ✅ Unicon: Type-safe components, consistent API, version controlled

**vs icon fonts:**
- ❌ Icon fonts: Flash of unstyled icons (FOUC), accessibility issues
- ✅ Unicon: Inline SVGs, perfect rendering, accessible by default

---

## Advanced Usage

### Use in CI/CD

```bash
# Install in CI
npm install -g @webrenew/unicon

# Generate icons from config
unicon sync

# Commit generated files or verify they match
git diff --exit-code ./src/icons
```

### Programmatic API Access

```javascript
const response = await fetch(
  'https://unicon.webrenew.com/api/icons?q=dashboard&source=lucide'
);
const { icons } = await response.json();
```

See `references/api-reference.md` for full API documentation.

### Pre-commit Hook

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
unicon sync
git add src/icons
```

Ensures icon bundles stay in sync with config.

---

## Troubleshooting

**Icons not found:**
- Check spelling: `unicon search "your query"` to see matches
- Try semantic search: "arrow pointing right" instead of "arrow-right"

**Format not supported:**
- Use `--format react|vue|svelte|svg|json`
- Default is stdout (raw SVG content)

**Bundle too large:**
- Use `--limit <n>` to restrict results
- Filter by `--source <library>` or `--category <name>`

**Cache issues:**
- Run `unicon cache clear` to refresh local icon database
- Cache is auto-updated every 24 hours
