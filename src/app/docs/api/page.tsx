import { Metadata } from "next";
import Link from "next/link";
import { CodeIcon } from "@/components/icons/ui/code";
import { DocsPageNav, getDocsNavLinks } from "@/components/docs-page-nav";
import { CopyPageButton } from "@/components/copy-page-button";
import { CodeBlock } from "@/components/ui/code-block";

const PAGE_MARKDOWN = `# Unicon API Reference

REST API for programmatic access to 19,000+ icons across 9 libraries.

Base URL: \`https://unicon.sh\`

## GET /api/icons

Search and retrieve icons.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (AI-powered semantic search) |
| names | string | Comma-separated icon IDs for exact lookup |
| source | string | Filter by library (lucide, phosphor, etc.) |
| category | string | Filter by category |
| limit | number | Max results (default: 50, max: 200) |
| offset | number | Pagination offset |

### Response

\`\`\`json
{
  "icons": [
    {
      "id": "lucide:home",
      "name": "Home",
      "normalizedName": "home",
      "sourceId": "lucide",
      "viewBox": "0 0 24 24",
      "content": "<path d='...'/>",
      "category": "Buildings",
      "tags": ["house", "building", "residence"]
    }
  ],
  "total": 150,
  "hasMore": true,
  "searchType": "semantic",
  "expandedQuery": "home house building residence"
}
\`\`\`

### Examples

\`\`\`bash
# Search for icons
curl "https://unicon.sh/api/icons?q=dashboard&limit=10"

# Get specific icons by name
curl "https://unicon.sh/api/icons?names=home,settings,user"

# Filter by library
curl "https://unicon.sh/api/icons?q=arrow&source=lucide"

# Paginate results
curl "https://unicon.sh/api/icons?q=social&limit=20&offset=40"
\`\`\`

## POST /api/search

Advanced search with more control.

### Request Body

\`\`\`json
{
  "query": "dashboard analytics",
  "sources": ["lucide", "phosphor"],
  "categories": ["Dashboards"],
  "limit": 20
}
\`\`\`

### Response

Same format as GET /api/icons.

## Rate Limits

| Tier | Requests | Window |
|------|----------|--------|
| Free | 100 | per minute |
| Burst | 10 | per second |

Rate limit headers included in responses:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`

## Code Examples

### JavaScript/TypeScript

\`\`\`typescript
async function searchIcons(query: string, limit = 20) {
  const url = new URL("https://unicon.sh/api/icons");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  
  const response = await fetch(url);
  const data = await response.json();
  return data.icons;
}

// Usage
const icons = await searchIcons("dashboard");
\`\`\`

### Python

\`\`\`python
import requests

def search_icons(query, limit=20):
    response = requests.get(
        "https://unicon.sh/api/icons",
        params={"q": query, "limit": limit}
    )
    response.raise_for_status()
    return response.json()["icons"]

# Usage
icons = search_icons("dashboard")
\`\`\`

### cURL

\`\`\`bash
# Search for icons
curl -s "https://unicon.sh/api/icons?q=dashboard&limit=10" | jq '.icons[] | {name: .name, source: .sourceId}'

# Get specific icons
curl -s "https://unicon.sh/api/icons?names=home,settings,user" | jq '.icons'
\`\`\`

## CORS

All API endpoints support CORS and can be called from any origin.

\`\`\`
Access-Control-Allow-Origin: *
\`\`\`
`;

export const metadata: Metadata = {
  title: "API Reference | Unicon",
  description: "REST API documentation for programmatic access to 19,000+ icons. Search, filter, and retrieve icon data in JSON format.",
  keywords: [
    "icon api",
    "rest api",
    "icon data",
    "api documentation",
    "icon search api",
    "programmatic icons",
  ],
  alternates: {
    canonical: "/docs/api",
  },
  openGraph: {
    title: "Unicon API Reference",
    description: "REST API for programmatic access to 19,000+ icons across 9 libraries.",
    url: "https://unicon.sh/docs/api",
    type: "website",
  },
};

interface ParamTableProps {
  params: Array<{
    name: string;
    type: string;
    required?: boolean;
    default?: string;
    description: string;
  }>;
}

function ParamTable({ params }: ParamTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Parameter</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Type</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Required</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Default</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2 px-3 font-mono text-[var(--accent-aqua)]">{param.name}</td>
              <td className="py-2 px-3 font-mono text-muted-foreground">{param.type}</td>
              <td className="py-2 px-3">
                {param.required ? (
                  <span className="text-[var(--accent-mint)]">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="py-2 px-3 font-mono text-muted-foreground">{param.default || "—"}</td>
              <td className="py-2 px-3 text-muted-foreground">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function APIDocsPage() {
  return (
    <div className="w-full py-10 px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--accent-aqua)]/10 border border-[var(--accent-aqua)]/20">
            <CodeIcon className="w-6 h-6 text-[var(--accent-aqua)]" />
          </div>
          <CopyPageButton markdown={PAGE_MARKDOWN} />
        </div>
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          REST API for programmatic access to Unicon&apos;s icon library. Search, filter, and retrieve icon data
          in JSON format.
        </p>
      </div>

      <div className="space-y-16">
        {/* Base URL */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Base URL</h2>
          <CodeBlock>https://unicon.sh/api</CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            All endpoints are HTTPS only. No authentication required for public endpoints.
          </p>
        </section>

        {/* Rate Limits */}
        <section id="rate-limits">
          <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
          <div className="p-5 rounded-xl border border-[var(--accent-lavender)]/20 bg-[var(--accent-lavender)]/5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Icon search (GET /api/icons)</span>
                <span className="font-mono text-[var(--accent-lavender)]">100 req/hour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Semantic search (POST /api/search)</span>
                <span className="font-mono text-[var(--accent-lavender)]">50 req/hour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">MCP endpoints</span>
                <span className="font-mono text-[var(--accent-lavender)]">200 req/hour</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Rate limits are per IP address. Contact us for higher limits or API key access.
            </p>
          </div>
        </section>

        {/* GET /api/icons */}
        <section id="get-icons">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs">GET</span>
            <h2 className="text-2xl font-bold">/api/icons</h2>
          </div>
          <p className="text-white/70 mb-6">
            Fetch icons with optional filters. Supports AI-powered semantic search for queries with 3+ characters.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Parameters</h3>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <ParamTable
                  params={[
                    { name: "q", type: "string", description: "Search query (AI search if 3+ characters)" },
                    { name: "source", type: "string", description: "Filter by library (lucide, phosphor, etc.)", default: "all" },
                    { name: "category", type: "string", description: "Filter by category", default: "all" },
                    { name: "names", type: "string", description: "Comma-separated exact icon names" },
                    { name: "limit", type: "number", description: "Results per page (max: 320)", default: "100" },
                    { name: "offset", type: "number", description: "Pagination offset", default: "0" },
                    { name: "ai", type: "boolean", description: "Enable AI search", default: "true" },
                  ]}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Response</h3>
              <CodeBlock title="Example Response">{`{
  "icons": [
    {
      "id": "lucide:home",
      "name": "Home",
      "normalizedName": "home",
      "sourceId": "lucide",
      "category": "Buildings",
      "tags": ["house", "building", "residence"],
      "viewBox": "0 0 24 24",
      "content": "<path d=\\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\\"/><polyline points=\\"9 22 9 12 15 12 15 22\\"/>",
      "defaultStroke": true,
      "defaultFill": false,
      "strokeWidth": "2",
      "brandColor": null
    }
  ],
  "hasMore": true,
  "searchType": "semantic"
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Examples</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Search with AI:</p>
                  <CodeBlock>{`curl "https://unicon.sh/api/icons?q=dashboard"`}</CodeBlock>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Filter by source:</p>
                  <CodeBlock>{`curl "https://unicon.sh/api/icons?q=arrow&source=lucide&limit=10"`}</CodeBlock>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Get specific icons by name:</p>
                  <CodeBlock>{`curl "https://unicon.sh/api/icons?names=home,settings,user"`}</CodeBlock>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Browse by category:</p>
                  <CodeBlock>{`curl "https://unicon.sh/api/icons?category=Social&limit=50"`}</CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POST /api/search */}
        <section id="post-search">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono text-xs">POST</span>
            <h2 className="text-2xl font-bold">/api/search</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Hybrid semantic + exact match search with relevance scoring. More advanced than the GET endpoint.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Request Body</h3>
              <CodeBlock title="application/json">{`{
  "query": "dashboard",
  "sourceId": "lucide",
  "limit": 50,
  "useAI": false
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Parameters</h3>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <ParamTable
                  params={[
                    { name: "query", type: "string", required: true, description: "Search query" },
                    { name: "sourceId", type: "string", description: "Filter by library", default: "all" },
                    { name: "limit", type: "number", description: "Max results", default: "50" },
                    { name: "useAI", type: "boolean", description: "Enable AI semantic search", default: "false" },
                  ]}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Response</h3>
              <CodeBlock title="Example Response">{`{
  "results": [
    {
      "id": "lucide:home",
      "name": "Home",
      "normalizedName": "home",
      "sourceId": "lucide",
      "category": "Buildings",
      "tags": ["house", "building"],
      "viewBox": "0 0 24 24",
      "content": "<path d=\\"...\\"/>",
      "score": 0.95
    }
  ]
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Examples</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Basic search:</p>
                  <CodeBlock>{`curl -X POST "https://unicon.sh/api/search" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "dashboard"}'`}</CodeBlock>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Filter by source:</p>
                  <CodeBlock>{`curl -X POST "https://unicon.sh/api/search" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "arrow", "sourceId": "phosphor", "limit": 20}'`}</CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GET /api/mcp */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs">GET</span>
            <h2 className="text-2xl font-bold">/api/mcp</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            MCP server information and capabilities. Used by the MCP server package.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Response</h3>
              <CodeBlock title="Example Response">{`{
  "name": "Unicon MCP API",
  "version": "1.0.0",
  "description": "REST API for Unicon icon library with MCP compatibility",
  "capabilities": {
    "tools": ["search_icons", "get_icon", "get_multiple_icons"],
    "resources": ["sources", "categories", "stats"]
  },
  "usage": {
    "direct": "POST /api/mcp with { action, params }",
    "mcp": "Install: npx @webrenew/unicon-mcp-server",
    "docs": "https://unicon.sh/docs/mcp"
  }
}`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* POST /api/mcp */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono text-xs">POST</span>
            <h2 className="text-2xl font-bold">/api/mcp</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Execute MCP actions. Used internally by the MCP server package. For direct use, prefer the CLI or
            standard API endpoints.
          </p>

          <div className="p-5 rounded-xl border border-[var(--accent-lavender)]/20 bg-[var(--accent-lavender)]/5">
            <p className="text-sm text-muted-foreground">
              This endpoint is designed for MCP protocol communication. For easier integration, use the{" "}
              <Link href="/docs/mcp" className="text-[var(--accent-lavender)] hover:underline">
                MCP Server package
              </Link>{" "}
              which handles the protocol details for you.
            </p>
          </div>
        </section>

        {/* Icon Sources */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Icon Sources</h2>
          <p className="text-muted-foreground mb-6">
            Available icon libraries for filtering. Use these IDs in the <code className="text-[var(--accent-aqua)]">source</code> or{" "}
            <code className="text-[var(--accent-aqua)]">sourceId</code> parameters.
          </p>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Source ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Icons</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">License</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "lucide", name: "Lucide Icons", count: "1,900+", license: "ISC" },
                  { id: "phosphor", name: "Phosphor Icons", count: "1,500+", license: "MIT" },
                  { id: "hugeicons", name: "Huge Icons", count: "1,800+", license: "MIT" },
                  { id: "heroicons", name: "Heroicons", count: "292", license: "MIT" },
                  { id: "tabler", name: "Tabler Icons", count: "4,600+", license: "MIT" },
                  { id: "feather", name: "Feather Icons", count: "287", license: "MIT" },
                  { id: "remix", name: "Remix Icon", count: "2,800+", license: "Apache-2.0" },
                  { id: "simple-icons", name: "Simple Icons", count: "3,300+", license: "CC0" },
                  { id: "iconoir", name: "Iconoir", count: "1,600+", license: "MIT" },
                ].map((source, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">{source.id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{source.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{source.count}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{source.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Error Responses */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Error Responses</h2>
          <p className="text-muted-foreground mb-6">
            All errors return a JSON object with an error message and appropriate HTTP status code.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">400 Bad Request</h3>
              <CodeBlock>{`{
  "error": "Invalid query parameter"
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">429 Too Many Requests</h3>
              <CodeBlock>{`{
  "error": "Rate limit exceeded. Please try again later."
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">500 Internal Server Error</h3>
              <CodeBlock>{`{
  "error": "Internal server error"
}`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section id="examples">
          <h2 className="text-2xl font-bold mb-6">Complete Examples</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">JavaScript/TypeScript</h3>
              <CodeBlock title="fetch-icons.ts">{`async function searchIcons(query: string) {
  const response = await fetch(
    \`https://unicon.sh/api/icons?q=\${encodeURIComponent(query)}&limit=20\`
  );
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  return data.icons;
}

// Usage
const icons = await searchIcons("dashboard");
console.log(icons);`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Python</h3>
              <CodeBlock title="fetch_icons.py">{`import requests

def search_icons(query: str, limit: int = 20):
    response = requests.get(
        "https://unicon.sh/api/icons",
        params={"q": query, "limit": limit}
    )
    response.raise_for_status()
    return response.json()["icons"]

# Usage
icons = search_icons("dashboard")
print(icons)`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">cURL</h3>
              <CodeBlock title="search-icons.sh">{`#!/bin/bash

# Search for icons
curl -s "https://unicon.sh/api/icons?q=dashboard&limit=10" \\
  | jq '.icons[] | {name: .name, source: .sourceId}'

# Get specific icons
curl -s "https://unicon.sh/api/icons?names=home,settings,user" \\
  | jq '.icons'`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* CORS */}
        <section>
          <h2 className="text-2xl font-bold mb-4">CORS</h2>
          <p className="text-muted-foreground mb-4">
            All API endpoints support CORS and can be called from any origin. This enables browser-based
            applications to use the API directly.
          </p>
          <div className="p-5 rounded-xl border border-border bg-card">
            <code className="text-sm text-muted-foreground">Access-Control-Allow-Origin: *</code>
          </div>
        </section>

        {/* Page Navigation */}
        <DocsPageNav {...getDocsNavLinks("/docs/api")} />
      </div>
    </div>
  );
}
