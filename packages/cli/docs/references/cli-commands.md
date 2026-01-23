# CLI Commands Reference

Complete reference for all `@webrenew/unicon` CLI commands.

## Installation

```bash
# Global install
npm install -g @webrenew/unicon

# Or use with npx
npx @webrenew/unicon <command>
```

---

## unicon search

AI-powered semantic search for icons.

```bash
unicon search <query> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source <id>` | Filter by library (lucide, phosphor, etc.) | all |
| `--category <name>` | Filter by category | all |
| `--limit <n>` | Max results | 20 |
| `--json` | Output as JSON | false |

### Examples

```bash
unicon search "dashboard settings"
unicon search "arrow" --source lucide --limit 10
unicon search "social" --category Social --json
```

---

## unicon get

Get a single icon and output to stdout or file.

```bash
unicon get <name> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <type>` | Output format: react, vue, svelte, svg, json | react |
| `--source <id>` | Specify source if name is ambiguous | auto |
| `-o, --output <path>` | Write to file instead of stdout | stdout |

### Examples

```bash
# Output React component to stdout
unicon get home

# Copy to clipboard (macOS)
unicon get home | pbcopy

# Save Vue component
unicon get settings --format vue -o ./Settings.vue

# Get from specific library
unicon get arrow-right --source phosphor

# Raw SVG
unicon get star --format svg -o ./star.svg
```

---

## unicon info

Show detailed information about an icon.

```bash
unicon info <name> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--source <id>` | Specify source if ambiguous |
| `--json` | Output as JSON |

### Output

- Icon name and normalized name
- Source library
- Category and tags
- ViewBox dimensions
- Stroke/fill defaults

### Examples

```bash
unicon info home
unicon info arrow-right --source phosphor
unicon info github --json
```

---

## unicon preview

Show ASCII art preview of an icon in the terminal.

```bash
unicon preview <name> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--width <n>` | Preview width in characters | 16 |
| `--height <n>` | Preview height in characters | auto |
| `--source <id>` | Specify source if ambiguous | auto |

### Examples

```bash
unicon preview home
unicon preview star --width 24
unicon preview arrow-right --source lucide
```

---

## unicon bundle

Bundle multiple icons into files.

```bash
unicon bundle [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--query <text>` | Search query to select icons | - |
| `--category <name>` | Bundle by category | - |
| `--source <id>` | Filter by library | all |
| `--format <type>` | Output format | react |
| `--limit <n>` | Max icons to bundle | 50 |
| `-o, --output <path>` | Output directory or file | ./icons |
| `--split` | One file per icon (tree-shakeable) | false |
| `--single-file` | All icons in one file | true |

### Examples

```bash
# Bundle by category
unicon bundle --category Dashboards -o ./src/icons

# Bundle by search query
unicon bundle --query "navigation arrows" --format vue -o ./icons

# Split into individual files
unicon bundle --category Social --split -o ./src/icons/social

# Single file with all icons
unicon bundle --query "home settings user" --single-file -o ./icons.tsx
```

---

## unicon init

Initialize a `.uniconrc.json` config file.

```bash
unicon init [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing config |

### Example

```bash
unicon init
# Creates .uniconrc.json with example bundles
```

---

## unicon sync

Regenerate all bundles defined in `.uniconrc.json`.

```bash
unicon sync [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--name <bundle>` | Sync only specified bundle |
| `--dry-run` | Preview changes without writing |

### Examples

```bash
# Sync all bundles
unicon sync

# Sync specific bundle
unicon sync --name dashboard

# Preview what would be generated
unicon sync --dry-run
```

---

## unicon add

Add a new bundle configuration to `.uniconrc.json`.

```bash
unicon add <name> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--query <text>` | Search query for icons |
| `--category <name>` | Category filter |
| `--source <id>` | Library filter |
| `--format <type>` | Output format |
| `--limit <n>` | Max icons |
| `-o, --output <path>` | Output path |

### Examples

```bash
# Add category bundle
unicon add dashboard --category Dashboards

# Add query-based bundle
unicon add nav --query "arrow menu chevron" --limit 30

# Add with specific options
unicon add social --category Social --source phosphor --format vue
```

---

## unicon categories

List all available icon categories.

```bash
unicon categories [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

---

## unicon sources

List all available icon libraries.

```bash
unicon sources [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

### Output

Shows each library with icon count and license.

---

## unicon cache

Manage local icon cache.

```bash
unicon cache [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--stats` | Show cache statistics |
| `--clear` | Clear all cached data |

### Examples

```bash
# View cache info
unicon cache --stats

# Clear cache
unicon cache --clear
```

### Cache Location

Icons are cached at `~/.unicon/cache` with a 24-hour TTL.

---

## unicon skill

Install Unicon skill/rules for AI coding assistants.

```bash
unicon skill [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--ide <name>` | Target IDE (claude, cursor, windsurf, agent, antigravity, opencode, codex, aider) |
| `--all` | Install for all supported IDEs |
| `-l, --list` | List all supported IDEs |
| `-f, --force` | Overwrite existing skill files |

### Supported IDEs

| IDE | Directory | File |
|-----|-----------|------|
| Claude Code | `.claude/skills/unicon/` | `SKILL.md` |
| Cursor | `.cursor/rules/` | `unicon.mdc` |
| Windsurf | `.windsurf/rules/` | `unicon.md` |
| Agent | `.agent/rules/` | `unicon.md` |
| Antigravity | `.antigravity/rules/` | `unicon.md` |
| OpenCode | `.opencode/rules/` | `unicon.md` |
| Codex | `.codex/` | `unicon.md` |
| Aider | `.aider/rules/` | `unicon.md` |

### Examples

```bash
# List supported IDEs
unicon skill --list

# Install for specific IDE
unicon skill --ide claude
unicon skill --ide cursor

# Install for all IDEs
unicon skill --all

# Force overwrite existing files
unicon skill --ide cursor --force

# Auto-detect (installs for detected IDE directories)
unicon skill
```

### What it does

Installs documentation files that teach AI coding assistants how to use Unicon. Once installed, you can ask your AI assistant things like:

- "Add a home icon to my project"
- "Search for dashboard icons"
- "Bundle navigation icons for my React app"

---

## unicon skills

List and download skills from the Unicon public registry.

```bash
unicon skills [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-l, --list` | List available skills (default) |
| `-g, --get <id>` | Download a skill by ID |
| `-o, --output <path>` | Write downloaded skill to file |
| `-j, --json` | Output list as JSON |

### Examples

```bash
# List available skills
unicon skills
unicon skills --list

# Download skill to stdout
unicon skills --get unicon

# Download skill to file
unicon skills --get unicon-mcp -o SKILL.md

# Output list as JSON
unicon skills --json
```

### Available Skills

Skills are hosted at `https://unicon.webrenew.com/skills/` and include:

- **unicon** - Core CLI usage skill for AI assistants
- **unicon-mcp** - MCP server setup guide

---

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--help` | Show command help |
| `--version` | Show CLI version |
| `--no-color` | Disable colored output |
