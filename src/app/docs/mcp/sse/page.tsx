import { Metadata } from "next";
import { MCPIcon } from "@/components/icons/mcp-icon";
import { DocsPageNav, getDocsNavLinks } from "@/components/docs-page-nav";
import { CopyPageButton } from "@/components/copy-page-button";
import { CodeBlock } from "@/components/ui/code-block";

const PAGE_MARKDOWN = `# MCP Transport: stdio vs SSE

Unicon MCP supports two connection methods. This guide helps you choose the right one.

## Quick Decision

**Use the app you're using to decide:**

| Your App | Transport | Why |
|----------|-----------|-----|
| Claude Desktop | stdio | Only supports stdio |
| Claude Code (CLI) | stdio | Local Node.js available |
| Cursor IDE | Either | Supports both, stdio recommended |
| v0 (Vercel) | SSE | Cloud-based, no local process |
| Bolt / Lovable | SSE | Cloud-based, no local process |
| Replit | SSE | Cloud-based, no local process |
| Custom web app | SSE | Browser environment |

**TL;DR:** Desktop apps → stdio. Cloud/browser apps → SSE.

## What's the Difference?

### stdio (Standard I/O)
A local Node.js process runs on your machine. Your AI app talks to it via pipes.

\`\`\`
Your App ←→ Local Process (npx) ←→ Unicon API
\`\`\`

**Requires:** Node.js/npm installed locally

### SSE (Server-Sent Events / HTTP)
Direct HTTP connection to our hosted endpoint. Nothing runs locally.

\`\`\`
Your App ←→ unicon.sh/api/mcp
\`\`\`

**Requires:** Network access only

## Comparison

| Factor | stdio | SSE |
|--------|-------|-----|
| Setup complexity | Config file + restart | Just paste URL |
| Local dependencies | Needs Node.js | None |
| Latency | Lower (local process) | Slightly higher (HTTP) |
| Offline capability | Partial (process cached) | None |
| Works in browser | No | Yes |
| Resource usage | Spawns background process | None |
| Always latest version | npm update needed | Automatic |

## The Bottom Line

**Both give you the exact same tools and results.** The only difference is how your app connects to Unicon.

If your app supports both, stdio is marginally faster but SSE is simpler to set up. For most users, the difference is imperceptible.

---

## SSE Endpoint URL

\`\`\`
https://unicon.sh/api/mcp
\`\`\`

This is a Streamable HTTP endpoint that supports both SSE and standard HTTP responses.

## How It Works

\`\`\`
┌─────────────────────────────┐
│   v0 / Cloud IDE / Agent    │
└──────────┬──────────────────┘
           │ MCP Protocol (Streamable HTTP)
           │
┌──────────▼──────────────────┐
│ unicon.sh/api/mcp │
└─────────────────────────────┘
\`\`\`

The endpoint handles MCP protocol messages directly over HTTP. No local installation required.

## Configuration Examples

### v0 (Vercel)

Add Unicon as an MCP server in v0's settings:

\`\`\`
URL: https://unicon.sh/api/mcp
\`\`\`

### Bolt

Configure in project settings:

\`\`\`json
{
  "mcpServers": {
    "unicon": {
      "url": "https://unicon.sh/api/mcp"
    }
  }
}
\`\`\`

### Custom Integration

For custom MCP clients using the SDK:

\`\`\`typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://unicon.sh/api/mcp")
);

const client = new Client({
  name: "my-app",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Now you can call tools
const result = await client.callTool({
  name: "search_icons",
  arguments: { query: "dashboard", limit: 10 }
});
\`\`\`

## Available Tools

The SSE endpoint provides the same tools as the stdio transport:

| Tool | Description |
|------|-------------|
| search_icons | AI-powered semantic search |
| get_icon | Get single icon by ID |
| get_multiple_icons | Get multiple icons at once |
| list_libraries | List available icon sources |
| list_categories | List icon categories |
| get_starter_pack | Get curated icon collections |

## CORS Support

The endpoint supports CORS for browser-based integrations:

\`\`\`
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id
\`\`\`

## Rate Limits

| Tier | Requests | Window |
|------|----------|--------|
| Free | 100 | per minute |
| Burst | 10 | per second |

## Troubleshooting

### Connection Issues
1. Verify the URL is exactly \`https://unicon.sh/api/mcp\`
2. Check that your client supports Streamable HTTP transport
3. Ensure network allows outbound HTTPS connections

### Slow Responses
First requests may be slower due to cold starts. Subsequent requests are fast due to edge caching.

### Tool Not Found
Verify you're using the correct tool names (search_icons, get_icon, etc.)
`;

export const metadata: Metadata = {
  title: "MCP SSE Transport | Unicon",
  description: "Use Unicon MCP with Server-Sent Events (SSE) transport for cloud IDEs like v0, Bolt, and custom integrations.",
  keywords: [
    "mcp sse",
    "server sent events",
    "streamable http",
    "v0 mcp",
    "bolt mcp",
    "cloud ide mcp",
    "mcp transport",
  ],
  alternates: {
    canonical: "/docs/mcp/sse",
  },
  openGraph: {
    title: "Unicon MCP SSE Transport",
    description: "Use Unicon with cloud IDEs and URL-based MCP clients via SSE transport.",
    url: "https://unicon.sh/docs/mcp/sse",
    type: "website",
  },
};

export default function MCPSSEDocsPage() {
  return (
    <div className="w-full py-10 px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--accent-aqua)]/10 border border-[var(--accent-aqua)]/20">
            <MCPIcon className="w-6 h-6 text-[var(--accent-aqua)]" size={24} />
          </div>
          <CopyPageButton markdown={PAGE_MARKDOWN} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">MCP Transport: stdio vs SSE</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Unicon MCP supports two connection methods. This guide helps you choose the right one.
        </p>
      </div>

      <div className="space-y-12">
        {/* Quick Decision */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Quick Decision</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Use the app you&apos;re using to decide:</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Your App</th>
                  <th className="text-left py-3 px-4 font-semibold">Transport</th>
                  <th className="text-left py-3 px-4 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Claude Desktop</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-lavender)]">stdio</td>
                  <td className="py-3 px-4 text-muted-foreground">Only supports stdio</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Claude Code (CLI)</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-lavender)]">stdio</td>
                  <td className="py-3 px-4 text-muted-foreground">Local Node.js available</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Cursor IDE</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">Either</td>
                  <td className="py-3 px-4 text-muted-foreground">Supports both, stdio recommended</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">v0 (Vercel)</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">SSE</td>
                  <td className="py-3 px-4 text-muted-foreground">Cloud-based, no local process</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Bolt / Lovable</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">SSE</td>
                  <td className="py-3 px-4 text-muted-foreground">Cloud-based, no local process</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Replit</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">SSE</td>
                  <td className="py-3 px-4 text-muted-foreground">Cloud-based, no local process</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Custom web app</td>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">SSE</td>
                  <td className="py-3 px-4 text-muted-foreground">Browser environment</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 rounded-lg border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
            <p className="text-sm">
              <strong className="text-[var(--accent-mint)]">TL;DR:</strong>{" "}
              <span className="text-muted-foreground">Desktop apps → stdio. Cloud/browser apps → SSE.</span>
            </p>
          </div>
        </section>

        {/* What's the Difference */}
        <section>
          <h2 className="text-2xl font-bold mb-6">What&apos;s the Difference?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-[var(--accent-lavender)]/20 bg-[var(--accent-lavender)]/5">
              <h3 className="font-semibold text-[var(--accent-lavender)] mb-3">stdio (Standard I/O)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A local Node.js process runs on your machine. Your AI app talks to it via pipes.
              </p>
              <div className="p-3 rounded bg-black/20 font-mono text-xs text-muted-foreground">
                Your App ←→ Local Process (npx) ←→ Unicon API
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Requires:</strong> Node.js/npm installed locally
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--accent-aqua)]/20 bg-[var(--accent-aqua)]/5">
              <h3 className="font-semibold text-[var(--accent-aqua)] mb-3">SSE (Server-Sent Events / HTTP)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Direct HTTP connection to our hosted endpoint. Nothing runs locally.
              </p>
              <div className="p-3 rounded bg-black/20 font-mono text-xs text-muted-foreground">
                Your App ←→ unicon.sh/api/mcp
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Requires:</strong> Network access only
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Factor</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--accent-lavender)]">stdio</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--accent-aqua)]">SSE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Setup complexity</td>
                  <td className="py-3 px-4 text-muted-foreground">Config file + restart</td>
                  <td className="py-3 px-4 text-muted-foreground">Just paste URL</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Local dependencies</td>
                  <td className="py-3 px-4 text-muted-foreground">Needs Node.js</td>
                  <td className="py-3 px-4 text-muted-foreground">None</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Latency</td>
                  <td className="py-3 px-4 text-muted-foreground">Lower (local process)</td>
                  <td className="py-3 px-4 text-muted-foreground">Slightly higher (HTTP)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Offline capability</td>
                  <td className="py-3 px-4 text-muted-foreground">Partial (process cached)</td>
                  <td className="py-3 px-4 text-muted-foreground">None</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Works in browser</td>
                  <td className="py-3 px-4 text-muted-foreground">No</td>
                  <td className="py-3 px-4 text-muted-foreground">Yes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Resource usage</td>
                  <td className="py-3 px-4 text-muted-foreground">Spawns background process</td>
                  <td className="py-3 px-4 text-muted-foreground">None</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Always latest version</td>
                  <td className="py-3 px-4 text-muted-foreground">npm update needed</td>
                  <td className="py-3 px-4 text-muted-foreground">Automatic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Line */}
        <section>
          <div className="p-6 rounded-xl border-2 border-[var(--accent-mint)]/30 bg-[var(--accent-mint)]/5">
            <h2 className="text-xl font-bold mb-3 text-[var(--accent-mint)]">The Bottom Line</h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Both give you the exact same tools and results.</strong>{" "}
              The only difference is how your app connects to Unicon.
            </p>
            <p className="text-muted-foreground mt-2">
              If your app supports both, stdio is marginally faster but SSE is simpler to set up. 
              For most users, the difference is imperceptible.
            </p>
          </div>
        </section>

        <hr className="border-border" />

        {/* SSE Endpoint URL */}
        <section>
          <h2 className="text-2xl font-bold mb-4">SSE Endpoint URL</h2>
          <CodeBlock title="MCP Endpoint">{`https://unicon.sh/api/mcp`}</CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            This is a Streamable HTTP endpoint that supports both SSE and standard HTTP responses.
          </p>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="p-5 rounded-xl border border-border bg-card font-mono text-sm">
            <pre className="text-muted-foreground whitespace-pre">
{`┌─────────────────────────────┐
│   v0 / Cloud IDE / Agent    │
└──────────┬──────────────────┘
           │ MCP Protocol (Streamable HTTP)
           │
┌──────────▼──────────────────┐
│ unicon.sh/api/mcp │
└─────────────────────────────┘`}
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The endpoint handles MCP protocol messages directly over HTTP. No local installation required.
          </p>
        </section>

        {/* Configuration Examples */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Configuration Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">v0 (Vercel)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Add Unicon as an MCP server in v0&apos;s settings:
              </p>
              <CodeBlock>{`https://unicon.sh/api/mcp`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Bolt / Lovable</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Configure in project settings:
              </p>
              <CodeBlock title="mcp.json">{`{
  "mcpServers": {
    "unicon": {
      "url": "https://unicon.sh/api/mcp"
    }
  }
}`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Custom Integration</h3>
              <p className="text-sm text-muted-foreground mb-3">
                For custom MCP clients using the SDK:
              </p>
              <CodeBlock title="TypeScript">{`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://unicon.sh/api/mcp")
);

const client = new Client({
  name: "my-app",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Now you can call tools
const result = await client.callTool({
  name: "search_icons",
  arguments: { query: "dashboard", limit: 10 }
});`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Available Tools */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Available Tools</h2>
          <p className="text-muted-foreground mb-4">
            The SSE endpoint provides the same tools as the stdio transport:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Tool</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">search_icons</td>
                  <td className="py-3 px-4 text-muted-foreground">AI-powered semantic search</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_icon</td>
                  <td className="py-3 px-4 text-muted-foreground">Get single icon by ID</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_multiple_icons</td>
                  <td className="py-3 px-4 text-muted-foreground">Get multiple icons at once</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">list_libraries</td>
                  <td className="py-3 px-4 text-muted-foreground">List available icon sources</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">list_categories</td>
                  <td className="py-3 px-4 text-muted-foreground">List icon categories</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-[var(--accent-aqua)]">get_starter_pack</td>
                  <td className="py-3 px-4 text-muted-foreground">Get curated icon collections</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CORS Support */}
        <section>
          <h2 className="text-2xl font-bold mb-4">CORS Support</h2>
          <p className="text-muted-foreground mb-4">
            The endpoint supports CORS for browser-based integrations:
          </p>
          <CodeBlock>{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id`}</CodeBlock>
        </section>

        {/* Rate Limits */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Tier</th>
                  <th className="text-left py-3 px-4 font-semibold">Requests</th>
                  <th className="text-left py-3 px-4 font-semibold">Window</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Free</td>
                  <td className="py-3 px-4 font-mono">100</td>
                  <td className="py-3 px-4 text-muted-foreground">per minute</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Burst</td>
                  <td className="py-3 px-4 font-mono">10</td>
                  <td className="py-3 px-4 text-muted-foreground">per second</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Connection Issues</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Verify the URL is exactly <code className="text-[var(--accent-aqua)]">https://unicon.sh/api/mcp</code></li>
                <li>2. Check that your client supports Streamable HTTP transport</li>
                <li>3. Ensure network allows outbound HTTPS connections</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Slow Responses</h3>
              <p className="text-sm text-muted-foreground">
                First requests may be slower due to cold starts. Subsequent requests are fast due to edge caching.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">Tool Not Found</h3>
              <p className="text-sm text-muted-foreground">
                Verify you&apos;re using the correct tool names (search_icons, get_icon, etc.)
              </p>
            </div>
          </div>
        </section>

        {/* Page Navigation */}
        <DocsPageNav {...getDocsNavLinks("/docs/mcp/sse")} />
      </div>
    </div>
  );
}
