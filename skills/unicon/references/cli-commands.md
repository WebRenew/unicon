# CLI Commands Reference

Complete reference for the Unicon CLI tool (v0.2.0).

## Installation

```bash
# Global install
npm install -g @webrenew/unicon

# Or use with npx
npx @webrenew/unicon <command>
```

---

## Commands

### `unicon search <query>`

Search for icons using AI-powered semantic search.

**Arguments:**
- `query` - Search term (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-s, --source <lib>` | Filter by library | all |
| `-c, --category <cat>` | Filter by category | all |
| `-l, --limit <n>` | Max results | 20 |
| `-j, --json` | Output as JSON | false |
| `-p, --pick` | Interactive selection mode | false |

**Examples:**
```bash
unicon search "dashboard"
unicon search "arrow" --source lucide --limit 10
unicon search "navigation" --pick  # Interactive mode
unicon search "social" --json
```

**Interactive Mode (`--pick`):**
When using `--pick`, you can select multiple icons and then choose an action:
- Copy to clipboard
- Save to files
- Add to favorites
- Create a bundle in config

---

### `unicon get <name>`

Get a single icon and output to stdout, file, or clipboard.

**Arguments:**
- `name` - Icon name or ID (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format <fmt>` | Output format | auto-detect |
| `-o, --output <path>` | Output file path | stdout |
| `-c, --copy` | Copy to clipboard | false |
| `-s, --source <lib>` | Prefer specific library | auto |

**Formats:** `react`, `vue`, `svelte`, `svg`, `json`

**Note:** Format is auto-detected from your `package.json` (React, Vue, or Svelte).

**Examples:**
```bash
# Output to stdout (auto-detects framework)
unicon get home

# Copy to clipboard
unicon get home --copy

# Save to file
unicon get settings --format react -o ./Settings.tsx

# Vue component
unicon get home --format vue -o ./Home.vue

# Prefer specific library
unicon get home --source phosphor
```

---

### `unicon info <name>`

Show detailed information about an icon.

**Arguments:**
- `name` - Icon name (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-s, --source <lib>` | Prefer specific library | auto |

**Output includes:**
- Source library
- Category
- ViewBox dimensions
- Tags
- Quick commands

**Example:**
```bash
unicon info home
unicon info arrow-right --source phosphor
```

---

### `unicon preview <name>`

Preview an icon as ASCII art in the terminal.

**Arguments:**
- `name` - Icon name (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-w, --width <n>` | Preview width | 20 |
| `-h, --height <n>` | Preview height | 20 |
| `-s, --source <lib>` | Prefer specific library | auto |

**Example:**
```bash
unicon preview home
unicon preview star --width 24
```

---

### `unicon bundle`

Bundle multiple icons. Tree-shakeable by default for component formats.

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-q, --query <term>` | Search query | - |
| `-c, --category <cat>` | Filter by category | - |
| `-s, --source <lib>` | Filter by library | all |
| `-f, --format <fmt>` | Output format | auto-detect |
| `-o, --output <path>` | Output directory | ./icons |
| `-l, --limit <n>` | Max icons | 100 |
| `--single-file` | Combine into one file | false |
| `--stars` | Bundle favorited icons | false |

**Note:** 
- Component formats (react, vue, svelte) are split by default (tree-shakeable)
- Vue/Svelte cannot use `--single-file` (one component per file required)
- Format is auto-detected from your `package.json`

**Examples:**
```bash
# Bundle by search query (tree-shakeable)
unicon bundle --query "social media" -o ./src/icons

# Bundle by category
unicon bundle --category Navigation -o ./src/icons/nav

# Bundle all favorited icons
unicon bundle --stars -o ./src/icons/favorites

# Single file mode (React only, not tree-shakeable)
unicon bundle --query "ui" --single-file -o ./icons.tsx

# SVG files
unicon bundle --query "logos" --format svg -o ./public/icons
```

---

### `unicon init`

Initialize a `.uniconrc.json` config file.

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-f, --force` | Overwrite existing | false |
| `-i, --interactive` | Setup wizard | false |

**Interactive mode** walks you through:
1. Framework detection/selection
2. Icon library selection
3. Output directory
4. Starter bundle creation

**Examples:**
```bash
unicon init                # Quick defaults
unicon init --interactive  # Setup wizard
unicon init --force        # Overwrite existing
```

---

### `unicon sync`

Regenerate all icon bundles defined in `.uniconrc.json`.

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <bundle>` | Sync specific bundle only | all |
| `-d, --dry-run` | Preview without writing | false |
| `-w, --watch` | Watch for config changes | false |

**Examples:**
```bash
unicon sync                    # Sync all bundles
unicon sync --name dashboard   # Sync specific bundle
unicon sync --dry-run          # Preview changes
unicon sync --watch            # Auto-sync on config change
```

---

### `unicon add <name>`

Add a new bundle to `.uniconrc.json`.

**Arguments:**
- `name` - Bundle name (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-q, --query <term>` | Search query | - |
| `-c, --category <cat>` | Category filter | - |
| `-s, --source <lib>` | Library filter | all |
| `-f, --format <fmt>` | Output format | react |
| `-l, --limit <n>` | Max icons | 50 |
| `-o, --output <path>` | Output path | auto |

**Examples:**
```bash
unicon add nav --query "arrow chevron menu"
unicon add social --category Social --source simple-icons
unicon add dashboard --category Dashboards --limit 100
```

---

### `unicon star <name>`

Add an icon to your favorites.

**Arguments:**
- `name` - Icon name (required)

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-s, --source <lib>` | Prefer specific library | auto |

**Examples:**
```bash
unicon star home
unicon star arrow-right --source lucide
```

---

### `unicon unstar <name>`

Remove an icon from favorites.

**Arguments:**
- `name` - Icon name (required)

**Example:**
```bash
unicon unstar home
```

---

### `unicon favorites`

List all favorited icons.

**Options:**
| Option | Description |
|--------|-------------|
| `-j, --json` | Output as JSON |

**Example:**
```bash
unicon favorites
unicon favorites --json
```

---

### `unicon audit`

Audit your project for icon usage.

**Output:**
- Bundled icons (from config)
- Used icons (found in code)
- Unused icons (bundled but not imported)
- Missing icons (imported but not bundled)
- Usage locations per icon

**Example:**
```bash
unicon audit
```

---

### `unicon categories`

List available icon categories.

**Options:**
| Option | Description |
|--------|-------------|
| `-j, --json` | Output as JSON |

**Example:**
```bash
unicon categories
```

---

### `unicon sources`

List available icon libraries.

**Example:**
```bash
unicon sources
```

---

### `unicon cache`

Manage the local icon cache.

**Options:**
| Option | Description |
|--------|-------------|
| `-s, --stats` | Show cache statistics |
| `-c, --clear` | Clear all cached icons |

**Cache location:** `~/.unicon/cache` (24-hour TTL)

**Examples:**
```bash
unicon cache --stats
unicon cache --clear
```

---

### `unicon skill`

Install AI assistant skills for IDEs.

**Options:**
| Option | Description |
|--------|-------------|
| `-l, --list` | List supported assistants |
| `--ide <name>` | Install for specific IDE |
| `--all` | Install for all supported IDEs |
| `-f, --force` | Overwrite existing files |

**Supported IDEs:**

| IDE | Directory | File |
|-----|-----------|------|
| `claude` | `.claude/skills/unicon/` | `SKILL.md` |
| `cursor` | `.cursor/rules/` | `unicon.mdc` |
| `windsurf` | `.windsurf/rules/` | `unicon.md` |
| `agent` | `.agent/rules/` | `unicon.md` |
| `antigravity` | `.antigravity/rules/` | `unicon.md` |
| `opencode` | `.opencode/rules/` | `unicon.md` |
| `codex` | `.codex/` | `unicon.md` |
| `aider` | `.aider/rules/` | `unicon.md` |

**Examples:**
```bash
unicon skill --list
unicon skill --ide claude
unicon skill --all
unicon skill --ide cursor --force
```

---

## Global Options

Available on all commands:

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `--no-color` | Disable colors |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNICON_API_URL` | Custom API base URL (default: https://unicon.sh) |
| `UNICON_CACHE_DIR` | Custom cache directory |
| `UNICON_NO_CACHE` | Disable caching |

---

## Framework Auto-Detection

The CLI automatically detects your framework from `package.json`:

| Detected | Dependencies | Format |
|----------|--------------|--------|
| React | `react`, `next`, `@remix-run/react` | `react` |
| Vue | `vue`, `nuxt`, `@nuxt/kit` | `vue` |
| Svelte | `svelte`, `@sveltejs/kit` | `svelte` |

If no framework is detected, defaults to `react`.
