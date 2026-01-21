# MCP Server for Unicon Icon Library

## Overview

Create a **hosted MCP (Model Context Protocol) server** that allows LLM applications (Claude, Cursor, etc.) to search, retrieve, and add icons from Unicon's 14,700+ icon library directly into user projects.

**Value Proposition:**
- LLMs can programmatically access icon data during code generation
- Users get contextual icon suggestions without leaving their AI workflow
- Seamless integration with existing Unicon infrastructure (Next.js API + SQLite)

---

## Architecture

### MCP Server Components

```
┌─────────────────────────────────────────────────┐
│           LLM Application (Client)              │
│         (Claude Desktop, Cursor, etc.)          │
└─────────────────┬───────────────────────────────┘
                  │ JSON-RPC 2.0 over SSE/HTTP
                  │
┌─────────────────▼───────────────────────────────┐
│            Unicon MCP Server (Hosted)           │
│  ┌──────────────────────────────────────────┐   │
│  │  Resources (Icon data, metadata)         │   │
│  │  Tools (Search, Get, Bundle)             │   │
│  │  Prompts (Icon selection workflows)      │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                │
│  ┌──────────────▼───────────────────────────┐   │
│  │      Business Logic Layer                │   │
│  │  - Query optimization                    │   │
│  │  - Format conversion (SVG → React/Vue)   │   │
│  │  - Caching (Redis)                       │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                │
│  ┌──────────────▼───────────────────────────┐   │
│  │      Unicon Database (SQLite/Turso)      │   │
│  │  - 14,700+ icons                         │   │
│  │  - Embeddings for semantic search        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Hosting Options

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Vercel Edge Function** | Low latency, global CDN, existing infra | Limited execution time (30s), cold starts | ✅ Best for MVP |
| **Cloudflare Workers** | Fastest cold starts, global KV store | Non-standard runtime, learning curve | Consider for v2 |
| **Dedicated Node.js Server** | Full control, persistent connections | More ops overhead, higher cost | Consider for enterprise |

**Decision:** Start with **Vercel Edge Function** via HTTP/SSE transport since Unicon is already hosted on Vercel.

---

## MCP Primitives Implementation

### 1. Resources (Read-Only Data)

Expose static/dynamic icon metadata that LLMs can read during context building.

#### Resource Types

| URI Scheme | Description | Example |
|------------|-------------|---------|
| `unicon://sources` | List all icon libraries | `unicon://sources` |
| `unicon://categories` | List all categories | `unicon://categories` |
| `unicon://icon/{id}` | Single icon details | `unicon://icon/lucide:arrow-right` |
| `unicon://pack/{name}` | Predefined icon packs | `unicon://pack/dashboard-essentials` |

#### Implementation Example

```typescript
server.resource({
  uri: "unicon://icon/*",
  name: "Icon Details",
  description: "Get full metadata for a specific icon",
  mimeType: "application/json"
}, async (uri: URL) => {
  const iconId = uri.pathname.replace("/icon/", "");
  const icon = await getIconById(iconId);
  
  if (!icon) {
    throw new Error(`Icon not found: ${iconId}`);
  }
  
  return {
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({
        id: icon.id,
        name: icon.name,
        source: icon.sourceId,
        category: icon.category,
        tags: icon.tags,
        svg: `<svg viewBox="${icon.viewBox}">${icon.content}</svg>`
      }, null, 2)
    }]
  };
});
```

### 2. Tools (Executable Actions)

Allow LLMs to perform searches and retrieve icon code in various formats.

#### Tool: `search_icons`

**Purpose:** AI-powered semantic search across 14,700+ icons

**Input Schema:**
```typescript
{
  query: z.string().describe("Search query (e.g., 'dashboard', 'arrow left')"),
  source?: z.enum(["lucide", "phosphor", "hugeicons", "heroicons", "tabler", "feather", "remix", "simple-icons"]),
  category?: z.string(),
  limit?: z.number().min(1).max(100).default(20)
}
```

**Output:**
```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      results: [
        { id: "lucide:home", name: "Home", category: "ui" },
        { id: "phosphor:house", name: "House", category: "buildings" }
      ],
      total: 156,
      hasMore: true
    })
  }]
}
```

**Implementation:**
```typescript
server.tool("search_icons", 
  z.object({
    query: z.string().describe("Search term"),
    source: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().default(20)
  }),
  async ({ query, source, category, limit }) => {
    const results = await searchIcons({
      query,
      sourceId: source,
      category,
      limit
    });
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results: results.map(icon => ({
            id: icon.id,
            name: icon.name,
            category: icon.category,
            tags: icon.tags
          })),
          total: results.length
        }, null, 2)
      }]
    };
  }
);
```

#### Tool: `get_icon`

**Purpose:** Retrieve icon source code in specified format

**Input Schema:**
```typescript
{
  iconId: z.string().describe("Icon ID (e.g., 'lucide:arrow-right')"),
  format: z.enum(["svg", "react", "vue", "svelte", "json"]).default("svg"),
  props?: z.object({
    size?: z.number().default(24),
    strokeWidth?: z.number(),
    color?: z.string()
  })
}
```

**Output:**
```typescript
{
  content: [{
    type: "text",
    text: "export function ArrowRight({ size = 24, ...props }) { ... }"
  }]
}
```

**Implementation:**
```typescript
server.tool("get_icon",
  z.object({
    iconId: z.string(),
    format: z.enum(["svg", "react", "vue", "svelte", "json"]).default("svg"),
    props: z.object({
      size: z.number().optional(),
      strokeWidth: z.number().optional(),
      color: z.string().optional()
    }).optional()
  }),
  async ({ iconId, format, props }) => {
    const icon = await getIconById(iconId);
    if (!icon) {
      throw new Error(`Icon not found: ${iconId}`);
    }
    
    const code = await convertIconToFormat(icon, format, props);
    
    return {
      content: [{
        type: "text",
        text: code
      }]
    };
  }
);
```

#### Tool: `get_icon_pack`

**Purpose:** Retrieve multiple related icons as a bundle

**Input Schema:**
```typescript
{
  packName?: z.string().describe("Predefined pack (e.g., 'dashboard')"),
  iconIds?: z.array(z.string()).describe("Custom icon list"),
  format: z.enum(["svg", "react", "vue", "svelte"]).default("react")
}
```

**Output:** Multi-file bundle or single-file export

### 3. Prompts (Guided Workflows)

Pre-defined interaction templates for common icon selection scenarios.

#### Prompt: `add_icons_to_project`

**Purpose:** Interactive workflow for selecting and adding icons

**Template:**
```typescript
server.prompt("add_icons_to_project", async () => ({
  messages: [{
    role: "user",
    content: {
      type: "text",
      text: `I need to add icons to my project. Here are the steps:

1. What type of icons do you need? (e.g., navigation, social media, dashboard)
2. Which format? (React, Vue, Svelte, or plain SVG)
3. Which icon library do you prefer? (Lucide, Phosphor, Heroicons, etc.)

I'll search Unicon's 14,700+ icon library and generate the code for you.`
    }
  }]
}));
```

---

## Data Model Extensions

### Icon Pack Registry

Add a new table for curated/user-defined icon packs.

```typescript
// schema.ts extension
export const iconPacks = sqliteTable("icon_packs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconIds: text("icon_ids", { mode: "json" }).$type<string[]>(),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  createdBy: text("created_by"), // For future user accounts
  createdAt: integer("created_at", { mode: "timestamp" }),
  downloads: integer("downloads").default(0)
});
```

### MCP Usage Analytics

Track which icons/packs are most popular via MCP.

```typescript
export const mcpUsage = sqliteTable("mcp_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  toolName: text("tool_name").notNull(), // 'search_icons', 'get_icon'
  iconId: text("icon_id"),
  clientId: text("client_id"), // Hashed client identifier
  timestamp: integer("timestamp", { mode: "timestamp" })
});
```

---

## API Routes (Next.js)

### `/api/mcp` - Main MCP Endpoint

```typescript
// src/app/api/mcp/route.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { searchIcons, getIconById, getCategories } from "@/lib/queries";
import { z } from "zod";

const server = new McpServer({
  name: "unicon",
  version: "1.0.0"
});

// Register all tools and resources
registerTools(server);
registerResources(server);
registerPrompts(server);

export async function POST(request: Request) {
  const transport = new SSEServerTransport("/api/mcp/sse", request);
  await server.connect(transport);
  
  return new Response(transport.stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}

function registerTools(server: McpServer) {
  // search_icons tool
  server.tool("search_icons", /* ... */);
  
  // get_icon tool
  server.tool("get_icon", /* ... */);
  
  // get_icon_pack tool
  server.tool("get_icon_pack", /* ... */);
}
```

---

## Icon Format Conversion

### Module: `src/lib/icon-converters.ts`

```typescript
export async function convertIconToFormat(
  icon: IconData,
  format: "svg" | "react" | "vue" | "svelte" | "json",
  props?: { size?: number; strokeWidth?: number; color?: string }
): Promise<string> {
  switch (format) {
    case "svg":
      return generateSVG(icon, props);
    case "react":
      return generateReactComponent(icon, props);
    case "vue":
      return generateVueComponent(icon, props);
    case "svelte":
      return generateSvelteComponent(icon, props);
    case "json":
      return JSON.stringify(icon, null, 2);
  }
}

function generateReactComponent(icon: IconData, props?: any): string {
  const componentName = toPascalCase(icon.name);
  
  return `
import type { SVGProps } from 'react';

export function ${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${icon.viewBox}"
      fill="none"
      stroke="currentColor"
      strokeWidth={${props?.strokeWidth || 2}}
      {...props}
    >
      ${icon.content}
    </svg>
  );
}
`.trim();
}

// Similar implementations for Vue, Svelte
```

---

## Security & Rate Limiting

### 1. Authentication (Future)

For public beta, use API keys stored in client config:

```json
{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-unicon"],
      "env": {
        "UNICON_API_KEY": "uk_..."
      }
    }
  }
}
```

### 2. Rate Limiting

Use Vercel's edge config + Upstash Redis for distributed rate limiting.

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
  analytics: true
});

export async function checkRateLimit(clientId: string): Promise<boolean> {
  const { success } = await ratelimit.limit(clientId);
  return success;
}
```

### 3. CORS & Transport Security

```typescript
export async function POST(request: Request) {
  // Verify origin for browser clients
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
  
  if (origin && !allowedOrigins.includes(origin) && !allowedOrigins.includes("*")) {
    return new Response("Forbidden", { status: 403 });
  }
  
  // Continue with MCP server logic...
}
```

---

## Caching Strategy

### 1. Edge Caching (CDN)

Cache static resources (icon lists, categories) at edge for 1 hour:

```typescript
export const revalidate = 3600; // Next.js edge caching
```

### 2. Database Query Caching

Use React Cache API for deduplication:

```typescript
import { cache } from "react";

export const getCachedIcon = cache(async (id: string) => {
  return await getIconById(id);
});
```

### 3. Redis Cache (Hot Icons)

Cache top 1000 most-requested icons in Redis:

```typescript
const cachedIcon = await redis.get(`icon:${iconId}`);
if (cachedIcon) return JSON.parse(cachedIcon);

const icon = await getIconById(iconId);
await redis.setex(`icon:${iconId}`, 86400, JSON.stringify(icon)); // 24h TTL
```

---

## Client Configuration

### How Users Add Unicon MCP Server

#### Option 1: Claude Desktop (JSON Config)

```json
{
  "mcpServers": {
    "unicon": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-unicon"]
    }
  }
}
```

#### Option 2: Cursor IDE

```json
{
  "mcpServers": {
    "unicon": {
      "url": "https://unicon.webrenew.com/api/mcp",
      "transport": "sse"
    }
  }
}
```

---

## Implementation Roadmap

### Phase 1: MVP (Week 1-2) ✅ COMPLETED
- [x] Set up MCP SDK in Next.js project (`npm install @modelcontextprotocol/sdk`)
- [x] Implement `/api/mcp/route.ts` REST API endpoint
- [x] Create `search_icons`, `get_icon`, and `get_multiple_icons` tools
- [x] Add resource endpoints (`unicon://sources`, `unicon://categories`, `unicon://stats`)
- [x] Create local MCP bridge server package (`@webrenew/unicon-mcp-server`)
- [x] Implement icon format converters (React, Vue, Svelte, SVG)
- [x] Write documentation (quickstart + full guide)
- [ ] Deploy to Vercel (ready for deployment)
- [ ] Test with Claude Desktop (ready for testing)
- [ ] Publish NPM package `@webrenew/unicon-mcp-server` (ready for publish)

### Phase 2: Format Conversion (Week 3)
- [ ] Implement `src/lib/icon-converters.ts`
  - [ ] SVG generator (pass-through with props)
  - [ ] React component generator
  - [ ] Vue component generator
  - [ ] Svelte component generator
- [ ] Add unit tests for converters
- [ ] Add `format` parameter to `get_icon` tool

### Phase 3: Icon Packs (Week 4)
- [ ] Create `icon_packs` table in schema
- [ ] Build admin UI for creating packs (Next.js page)
- [ ] Seed with starter packs:
  - [ ] `dashboard-essentials` (20 common dashboard icons)
  - [ ] `social-media` (all social platform logos)
  - [ ] `navigation` (arrows, chevrons, menus)
- [ ] Implement `get_icon_pack` tool
- [ ] Add `unicon://pack/*` resource

### Phase 4: Optimization & Analytics (Week 5)
- [ ] Add Redis caching (Upstash)
- [ ] Implement rate limiting (100 req/hour per client)
- [ ] Add `mcp_usage` analytics table
- [ ] Create admin dashboard for usage stats
- [ ] Optimize database queries (add indexes)

### Phase 5: Documentation & Launch (Week 6)
- [ ] Write integration guide (`docs/mcp-integration.md`)
- [ ] Record demo video (search → get → code generation)
- [ ] Publish NPM package `@webrenew/unicon-mcp-server`
- [ ] Announce on:
  - [ ] Twitter/X
  - [ ] Reddit r/ClaudeAI
  - [ ] MCP community Discord
  - [ ] Product Hunt

---

## Testing Strategy

### 1. Unit Tests

```typescript
// __tests__/mcp-tools.test.ts
import { describe, it, expect } from "vitest";
import { searchIcons, getIconById } from "@/lib/queries";

describe("MCP Tools", () => {
  it("should search icons by query", async () => {
    const results = await searchIcons({ query: "arrow", limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].normalizedName).toContain("arrow");
  });
  
  it("should get icon by ID", async () => {
    const icon = await getIconById("lucide:arrow-right");
    expect(icon).toBeDefined();
    expect(icon?.name).toBe("ArrowRight");
  });
});
```

### 2. Integration Tests

Test MCP server with official SDK test client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client({ name: "test-client", version: "1.0.0" });
const transport = new SSEClientTransport(new URL("http://localhost:3000/api/mcp"));
await client.connect(transport);

const result = await client.callTool("search_icons", { query: "home" });
console.log(result);
```

### 3. Manual Testing Checklist

- [ ] Add server to Claude Desktop config
- [ ] Restart Claude Desktop
- [ ] Ask: "Search for arrow icons in Lucide"
- [ ] Ask: "Get the React code for the home icon from Heroicons"
- [ ] Ask: "Give me a dashboard icon pack in React"
- [ ] Verify generated code compiles in a React project

---

## Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Active MCP users | 100+ |
| Daily icon requests | 1,000+ |
| Average response time | < 500ms |
| Uptime | 99.9% |
| User satisfaction (NPS) | 8+ |

---

## Open Questions

- [ ] **Pricing model:** Free tier (100 req/hour) + paid ($10/mo for unlimited)?
- [ ] **User accounts:** Should users create accounts to save custom packs?
- [ ] **Icon contributions:** Allow users to submit icons via MCP?
- [ ] **Offline mode:** Should we support local SQLite fallback?
- [ ] **Multi-tenant:** Support for teams/organizations?

---

## Alternative: NPM Package Approach

Instead of hosted server, distribute as installable package:

```bash
npm install -g @webrenew/unicon-mcp-server
```

**Pros:**
- No hosting costs
- Faster (local SQLite)
- Works offline

**Cons:**
- Users must manage updates
- Can't leverage centralized analytics
- Harder to monetize

**Recommendation:** Start with **hosted** for ease of use, add **local** option later.

---

## Related Sprites

- [x] 02-icon-name-display.md - Affects how icons are presented in MCP responses
- [x] 05-cli-tool.md - CLI shares format conversion logic with MCP
- [x] 11-npm-package.md - NPM package could bundle MCP server client

---

## Implementation Notes (Phase 1 Complete)

### What Was Built

#### 1. REST API Endpoint (`/api/mcp/route.ts`)
- **GET /api/mcp** - Server info and capabilities
- **POST /api/mcp** - Execute actions (list_tools, list_resources, read_resource, call_tool)
- **OPTIONS /api/mcp** - CORS support
- Direct JSON-RPC style interface that's MCP-compatible

#### 2. Icon Format Converters (`/lib/icon-converters.ts`)
- **React** - Full TypeScript support with proper props interface
- **Vue** - Composition API with `<script setup>`
- **Svelte** - TypeScript with exported props
- **SVG** - Standalone SVG with customizable attributes
- **JSON** - Raw icon metadata
- Handles stroke vs fill icons correctly
- Customizable size, strokeWidth, color

#### 3. Local MCP Server Package (`/packages/mcp-server/`)
- NPM package: `@webrenew/unicon-mcp-server`
- Runs locally via `npx`
- Provides stdio transport for Claude/Cursor
- Proxies requests to hosted API
- Zero config for users (just add to Claude config)

#### 4. Documentation
- **docs/mcp-quickstart.md** - 5-minute getting started guide
- **docs/mcp-integration.md** - Complete integration reference
- **packages/mcp-server/README.md** - Package documentation

### Architecture Decision: Hybrid Approach

We implemented a **hybrid architecture** instead of pure SSE:

**Why?**
1. MCP SDK's SSE transport is complex to implement in Next.js Edge
2. Stdio transport (for local MCP servers) is what Claude/Cursor expect
3. Hosting the API separately keeps icon data always up-to-date

**How it works:**
```
User's Machine                  Cloud
┌──────────────┐              ┌──────────────┐
│ Claude/Cursor│◄─stdio─────► │ npx package  │
└──────────────┘              │ (local MCP)  │
                               └──────┬───────┘
                                      │
                                    HTTPS
                                      │
                               ┌──────▼───────┐
                               │ Vercel API   │
                               │ /api/mcp     │
                               └──────┬───────┘
                                      │
                               ┌──────▼───────┐
                               │ SQLite DB    │
                               │ 14,700 icons │
                               └──────────────┘
```

**Benefits:**
- ✅ Works with all MCP clients (stdio standard)
- ✅ No complex SSE implementation needed
- ✅ Users don't download/sync icon database
- ✅ API can be updated without user updates
- ✅ Simple `npx` installation

**Trade-offs:**
- ⚠️ Requires internet connection
- ⚠️ First request has cold start (1-2s)
- ⚠️ Extra hop (local → API) vs pure local

### Files Created/Modified

#### New Files
- `/src/app/api/mcp/route.ts` - MCP API endpoint
- `/src/lib/icon-converters.ts` - Format conversion logic
- `/packages/mcp-server/package.json` - NPM package config
- `/packages/mcp-server/tsconfig.json` - TypeScript config
- `/packages/mcp-server/src/index.ts` - Local MCP server
- `/packages/mcp-server/README.md` - Package docs
- `/docs/mcp-quickstart.md` - Quick start guide
- `/docs/mcp-integration.md` - Full integration guide

#### Modified Files
- `/package.json` - Added MCP SDK dependency

### Testing Checklist

Before deploying:
- [ ] Test API endpoint: `curl https://unicon.webrenew.com/api/mcp`
- [ ] Test local server: `cd packages/mcp-server && node dist/index.js`
- [ ] Test with Claude Desktop using local build
- [ ] Verify all tools work (search, get, get_multiple)
- [ ] Verify all resources work (sources, categories, stats)
- [ ] Test error handling (invalid icon IDs, etc.)
- [ ] Test all formats (React, Vue, Svelte, SVG, JSON)

### Publishing Checklist

- [ ] Deploy Next.js app to Vercel (includes API endpoint)
- [ ] Test deployed API: `curl https://unicon.webrenew.com/api/mcp`
- [ ] Publish NPM package: `cd packages/mcp-server && npm publish`
- [ ] Test published package: `npx @webrenew/unicon-mcp-server`
- [ ] Update main README with MCP section
- [ ] Announce on:
  - [ ] GitHub Discussions
  - [ ] Twitter/X
  - [ ] Reddit r/ClaudeAI
  - [ ] MCP community Discord

---

## Next Actions

1. **Test:** Verify implementation with Claude Desktop locally
2. **Deploy:** Push to Vercel (API endpoint will be live)
3. **Publish:** Release NPM package `@webrenew/unicon-mcp-server`
4. **Announce:** Share with community
5. **Monitor:** Watch for issues and feedback

---

## References

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Example Servers](https://github.com/modelcontextprotocol/servers)
