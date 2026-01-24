# Claude Code Skill Plan: unicon

## Overview

Create a Claude Code Skill to help **users integrate Unicon icons into their projects**. Unicon provides 19,000+ icons from 9 libraries (Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix, Simple Icons) via a CLI tool and API.

---

## Research Summary

### Claude Skills Anatomy

From the skill-creator guide:

| Component | Purpose | Required? |
|-----------|---------|-----------|
| `SKILL.md` | Frontmatter (name, description) + instructions | Yes |
| `scripts/` | Executable code for deterministic tasks | No |
| `references/` | Documentation loaded on-demand | No |
| `assets/` | Files used in output (templates, icons) | No |

**Key Principles:**
- Description is the **primary triggering mechanism**—must be comprehensive
- Context window is a public good—be concise
- Progressive disclosure: only load what's needed
- Body is only loaded after triggering

### Unicon User-Facing Features

| Feature | Description |
|---------|-------------|
| **CLI Tool** | `@webrenew/unicon` - search, get, bundle icons |
| **Output Formats** | React (.tsx), Vue (.vue), Svelte (.svelte), SVG, JSON |
| **Icon Sources** | Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix, Simple Icons |
| **Config Workflow** | `.uniconrc.json` for declarative icon management |
| **API** | REST endpoints for programmatic access |
| **Web UI** | https://unicon.webrenew.com for browsing/copying |

---

## Skill Design

### Name
`unicon`

### Trigger Description
```
Help users add icons to their projects using the Unicon icon library. 
Unicon provides 19,000+ icons from Lucide, Phosphor, Hugeicons, Heroicons, 
Tabler, Feather, Remix, and Simple Icons. Use when:
(1) Adding icons to React, Vue, Svelte, or any web project
(2) Using the unicon CLI to search, get, or bundle icons
(3) Setting up .uniconrc.json config for icon management
(4) Generating tree-shakeable icon components
(5) Using the Unicon API for programmatic icon access
(6) Converting between icon formats (SVG, React, Vue, Svelte, JSON)
```

### Skill Structure

```
unicon/
├── SKILL.md                    # Core instructions
└── references/
    ├── cli-commands.md         # Full CLI command reference
    ├── config-file.md          # .uniconrc.json schema and examples
    └── api-reference.md        # REST API documentation
```

---

## SKILL.md Content Plan

### Section 1: Quick Start (~80 words)
```bash
# Install CLI
npm install -g @webrenew/unicon

# Search for icons
unicon search "dashboard"

# Get a single icon
unicon get home --format react -o ./Home.tsx

# Bundle multiple icons
unicon bundle --category Dashboards -o ./icons
```

### Section 2: Core Concepts (~100 words)
- **19,000+ icons** from 9 libraries in one place
- **Output formats**: react, vue, svelte, svg, json
- **Tree-shakeable**: generates only icons you use
- **Config-driven**: define bundles in `.uniconrc.json`, regenerate with `unicon sync`
- **AI search**: semantic search finds icons by meaning, not just name

### Section 3: Common Workflows (~150 words)

#### Add Icons to a React Project
```bash
unicon init                          # Create .uniconrc.json
unicon search "navigation arrows"    # Find icons
unicon add nav --query "arrow menu"  # Add to config
unicon sync                          # Generate components
```

#### Get a Single Icon Quickly
```bash
unicon get home                      # stdout
unicon get home | pbcopy             # clipboard (macOS)
unicon get settings -o ./Settings.tsx
```

#### Bundle by Category
```bash
unicon bundle --category Dashboards --format react -o ./icons
```

### Section 4: Reference Navigation (~50 words)
- **CLI commands**: See `references/cli-commands.md` for all commands and options
- **Config file**: See `references/config-file.md` for `.uniconrc.json` schema
- **API**: See `references/api-reference.md` for REST endpoints

---

## Reference Files Plan

### 1. `references/cli-commands.md`

**When to load:** User asks about specific CLI commands or options

**Contents:**
| Command | Description |
|---------|-------------|
| `unicon search <query>` | AI-powered semantic search |
| `unicon get <name>` | Get single icon to stdout |
| `unicon info <name>` | Show icon details (source, tags, etc.) |
| `unicon preview <name>` | ASCII art preview in terminal |
| `unicon bundle` | Bundle icons to file |
| `unicon init` | Create .uniconrc.json config |
| `unicon sync` | Regenerate from config |
| `unicon add <name>` | Add bundle to config |
| `unicon categories` | List categories |
| `unicon sources` | List icon libraries |
| `unicon cache` | Manage local cache |

Plus detailed options for each command.

### 2. `references/config-file.md`

**When to load:** User wants to set up config-driven workflow

**Contents:**
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

Schema documentation and advanced examples.

### 3. `references/api-reference.md`

**When to load:** User wants programmatic access to icons

**Contents:**
```
GET /api/icons?q=arrow&source=lucide&limit=50
POST /api/search { "query": "dashboard", "limit": 20 }
```

Full parameter documentation and response schemas.

---

## Implementation Checklist

- [ ] Rename folder from `unicon-contributor` to `unicon`
- [ ] Create `SKILL.md` with user-focused instructions
- [ ] Create `references/cli-commands.md` with full command reference
- [ ] Create `references/config-file.md` with schema and examples
- [ ] Create `references/api-reference.md` with endpoint documentation
- [ ] Test skill with user-type questions ("add icons to my React app")
- [ ] Iterate based on real usage

---

## Success Criteria

1. **Triggering**: Skill activates when users ask about adding icons to their project
2. **Accuracy**: Instructions lead to working icon integrations
3. **Conciseness**: SKILL.md under 300 lines, references load only when needed
4. **Completeness**: Covers all user workflows:
   - Quick single-icon copy
   - Project-wide icon bundling
   - Config-driven management
   - Framework-specific output (React, Vue, Svelte)

---

## Next Steps

1. **Rename skill folder** to `unicon` (not `unicon-contributor`)
2. **Draft SKILL.md** with quick start and common workflows
3. **Create reference files** from CLI page and API routes
4. **Test** by asking "how do I add icons to my React project?"

---

## Notes

- This skill is for **end users**, not contributors
- Focus on **getting icons into projects quickly**
- Emphasize tree-shaking benefits over traditional npm icon packages
- Include examples for React, Vue, and Svelte
