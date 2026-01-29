# CLI Tool for Icon Management

**Status**: ✅ Complete  
**Package**: `@webrenew/unicon`

## Problem
Developers need a quick way to search, preview, and integrate icons into their projects without leaving the terminal or opening a browser.

## Implementation Summary

### All Commands

| Command | Description |
|---------|-------------|
| `unicon search <query>` | AI-powered semantic search |
| `unicon get <name>` | Get single icon to stdout |
| `unicon info <name>` | Show icon details (source, tags, etc.) |
| `unicon preview <name>` | ASCII art preview in terminal |
| `unicon bundle` | Bundle icons to file with `--split` option |
| `unicon init` | Create .uniconrc.json config |
| `unicon sync` | Regenerate from config |
| `unicon add <name>` | Add bundle to config |
| `unicon categories` | List categories |
| `unicon sources` | List icon libraries |
| `unicon cache` | Manage local cache |

### Output Formats

| Format | Extension | Framework |
|--------|-----------|-----------|
| `react` | `.tsx` | React/Next.js |
| `vue` | `.vue` | Vue 3 |
| `svelte` | `.svelte` | Svelte |
| `svg` | `.svg` | Any |
| `json` | `.json` | Any |

### Features

- [x] Search with AI semantic expansion
- [x] Single icon copy (`unicon get home | pbcopy`)
- [x] Icon info with tags, source, category
- [x] ASCII art preview in terminal
- [x] Batch bundling with split mode
- [x] Config file support (.uniconrc.json)
- [x] Tree-shaking hints in generated code
- [x] Multiple framework support (React, Vue, Svelte)
- [x] Local caching (24hr TTL) for offline use
- [x] Colorful output with Chalk
- [x] ASCII banner with Figlet
- [x] GitHub Actions for npm publish

## Usage Examples

```bash
# Search icons
unicon search "dashboard settings"

# Preview in terminal
unicon preview home --width 24

# Get single icon
unicon get home --format vue -o ./Home.vue

# Bundle with split (tree-shakeable)
unicon bundle --category Dashboards --split -o ./src/icons

# Config-based workflow
unicon init
unicon sync

# Cache management
unicon cache --stats
unicon cache --clear
```

## Cache

Icons are cached locally at `~/.unicon/cache` for 24 hours to reduce API calls and enable partial offline usage.

## Documentation

Full docs at: https://unicon.sh/cli
