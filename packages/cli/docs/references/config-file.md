# Config File Reference

The `.uniconrc.json` file defines your project's icon bundles for reproducible generation.

## Quick Start

```bash
# Create config file
unicon init

# Add bundles
unicon add dashboard --category Dashboards
unicon add nav --query "arrow menu"

# Generate all bundles
unicon sync
```

## Schema

```json
{
  "bundles": [
    {
      "name": "string",
      "query": "string (optional)",
      "category": "string (optional)",
      "source": "string (optional)",
      "limit": "number (optional, default: 50)",
      "format": "react | vue | svelte | svg | json",
      "output": "string (path)",
      "split": "boolean (optional, default: false)"
    }
  ]
}
```

## Bundle Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Bundle identifier |
| `query` | string | No* | Search query for icons |
| `category` | string | No* | Filter by category |
| `source` | string | No | Filter by library (lucide, phosphor, etc.) |
| `limit` | number | No | Max icons (default: 50) |
| `format` | string | Yes | Output format |
| `output` | string | Yes | Output path (file or directory) |
| `split` | boolean | No | One file per icon (default: false) |

*Either `query` or `category` should be specified.

## Complete Example

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
      "limit": 30,
      "format": "react",
      "output": "./src/icons/navigation.tsx"
    },
    {
      "name": "social",
      "category": "Social",
      "source": "phosphor",
      "format": "vue",
      "output": "./src/icons/social",
      "split": true
    },
    {
      "name": "brands",
      "query": "github twitter facebook",
      "source": "simple-icons",
      "format": "svg",
      "output": "./public/icons/brands",
      "split": true
    }
  ]
}
```

## Output Formats

### react (default)

TypeScript React components with proper typing.

```tsx
// Generated output
import { SVGProps } from "react";

export function Home(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="..." />
    </svg>
  );
}
```

### vue

Vue 3 Single File Components.

```vue
<!-- Generated output -->
<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" v-bind="$attrs">
    <path d="..." />
  </svg>
</template>

<script setup lang="ts">
defineOptions({ name: "Home", inheritAttrs: false });
</script>
```

### svelte

Svelte components.

```svelte
<!-- Generated output -->
<script lang="ts">
  export let size = 24;
  export let color = "currentColor";
</script>

<svg viewBox="0 0 24 24" width={size} height={size} stroke={color} {...$$restProps}>
  <path d="..." />
</svg>
```

### svg

Raw SVG files.

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="..." />
</svg>
```

### json

Icon data as JSON for programmatic use.

```json
{
  "name": "Home",
  "viewBox": "0 0 24 24",
  "content": "<path d=\"...\" />",
  "source": "lucide"
}
```

## Split Mode

When `split: true`, each icon becomes a separate file:

```
output/
├── Home.tsx
├── Settings.tsx
├── User.tsx
└── index.ts  # Re-exports all icons
```

This enables true tree-shaking:

```tsx
// Only Home is bundled
import { Home } from "./icons/dashboard";
```

## Workflow

### Initial Setup

```bash
# 1. Initialize config
unicon init

# 2. Search for icons you need
unicon search "dashboard"

# 3. Add bundles based on your needs
unicon add dashboard --category Dashboards
unicon add nav --query "arrow menu chevron home"
unicon add actions --query "edit delete save"
```

### Regenerating

```bash
# Regenerate all bundles
unicon sync

# Regenerate specific bundle
unicon sync --name dashboard

# Preview without writing
unicon sync --dry-run
```

### Adding to Git

Commit both the config and generated icons:

```gitignore
# Don't ignore generated icons - they're your source of truth
# .uniconrc.json defines what icons you need
# Generated files are the actual icons you ship
```

## Best Practices

1. **Use descriptive bundle names** - `dashboard`, `navigation`, `actions`
2. **Split for large bundles** - Enables tree-shaking
3. **Single file for small sets** - Simpler imports
4. **Limit appropriately** - Don't bundle more than you need
5. **Commit generated files** - They're your production icons
