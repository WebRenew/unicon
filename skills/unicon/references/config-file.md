# Config File Reference

The `.uniconrc.json` file defines your project's icon configuration.

## Location

Place `.uniconrc.json` in your project root (same level as `package.json`).

## Schema

```json
{
  "$schema": "https://unicon.sh/schema/uniconrc.json",
  "outputDir": "./src/icons",
  "format": "react",
  "defaultSource": "lucide",
  "defaultSize": 24,
  "defaultStrokeWidth": 2,
  "bundles": [
    {
      "name": "nav",
      "query": "arrow chevron menu",
      "output": "./src/icons/nav"
    }
  ]
}
```

## Fields

### Root Options

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `$schema` | string | JSON schema URL for IDE support | - |
| `outputDir` | string | Default output directory | `./icons` |
| `format` | string | Default output format | `react` |
| `defaultSource` | string | Preferred icon library | all |
| `defaultSize` | number | Default icon size (px) | 24 |
| `defaultStrokeWidth` | number | Default stroke width | 2 |
| `bundles` | array | Bundle definitions | `[]` |

### Bundle Options

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | string | Bundle identifier | Yes |
| `query` | string | Search query | One of query/category/icons |
| `category` | string | Category filter | One of query/category/icons |
| `icons` | array | Explicit icon list | One of query/category/icons |
| `source` | string | Library filter | No |
| `output` | string | Output path | No (uses `outputDir/name`) |
| `format` | string | Override format | No |
| `split` | boolean | One file per icon | No |
| `size` | number | Override size | No |
| `strokeWidth` | number | Override stroke width | No |

## Examples

### Basic Config

```json
{
  "outputDir": "./src/icons",
  "format": "react",
  "bundles": [
    {
      "name": "ui",
      "query": "settings home user menu"
    }
  ]
}
```

### Multiple Bundles

```json
{
  "outputDir": "./src/components/icons",
  "format": "react",
  "defaultSource": "lucide",
  "bundles": [
    {
      "name": "navigation",
      "query": "arrow chevron menu hamburger",
      "split": true
    },
    {
      "name": "social",
      "category": "Social",
      "source": "simple-icons"
    },
    {
      "name": "actions",
      "icons": ["lucide:trash", "lucide:edit", "lucide:copy", "lucide:save"]
    }
  ]
}
```

### Vue Project

```json
{
  "outputDir": "./src/components/icons",
  "format": "vue",
  "bundles": [
    {
      "name": "common",
      "query": "home settings user search"
    }
  ]
}
```

### Svelte Project

```json
{
  "outputDir": "./src/lib/icons",
  "format": "svelte",
  "defaultStrokeWidth": 1.5,
  "bundles": [
    {
      "name": "ui",
      "query": "button input form"
    }
  ]
}
```

### Mixed Formats

```json
{
  "bundles": [
    {
      "name": "react-icons",
      "query": "dashboard",
      "format": "react",
      "output": "./src/icons"
    },
    {
      "name": "static-icons",
      "query": "logo brand",
      "format": "svg",
      "output": "./public/icons"
    }
  ]
}
```

## Workflow

1. Create config: `unicon init`
2. Add bundles: Edit `.uniconrc.json` or use `unicon add <name>`
3. Generate icons: `unicon sync`
4. Import in code: `import { Home } from "./src/icons/ui"`

## Tips

- Use `split: true` for tree-shaking in production builds
- Commit `.uniconrc.json` to version control
- Run `unicon sync` in CI/CD to ensure icons are up-to-date
- Use explicit `icons` array for precise control over which icons to include
