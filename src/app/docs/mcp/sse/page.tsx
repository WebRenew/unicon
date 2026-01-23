import { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon } from "@/components/icons/ui/check-circle";
import { AlertTriangleIcon } from "@/components/icons/ui/alert-triangle";
import { CopyButton } from "@/components/ui/copy-button";
import { MCPIcon } from "@/components/icons/mcp-icon";
import { DocsPageNav, getDocsNavLinks } from "@/components/docs-page-nav";
import { CopyPageButton } from "@/components/copy-page-button";

const PAGE_MARKDOWN = `# MCP SSE Transport

Use Unicon MCP with Server-Sent Events (SSE) transport for cloud IDEs and URL-based MCP clients.

## When to Use SSE Transport

### Use SSE When:
- Using cloud IDEs (v0, Bolt, Lovable, Replit)
- Building custom MCP integrations
- Your client supports URL-based MCP connections
- You want the simplest possible setup
- You're in an environment without Node.js

### Use stdio Transport When:
- Using Claude Desktop
- Using Cursor IDE
- Using local development tools
- Your client only supports stdio transport

## Endpoint URL

\`\`\`
https://unicon.webrenew.com/api/mcp
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
│ unicon.webrenew.com/api/mcp │
└─────────────────────────────┘
\`\`\`

The endpoint handles MCP protocol messages directly over HTTP. No local installation required.

## Configuration Examples

### v0 (Vercel)

Add Unicon as an MCP server in v0's settings:

\`\`\`
URL: https://unicon.webrenew.com/api/mcp
\`\`\`

### Bolt

Configure in project settings:

\`\`\`json
{
  "mcpServers": {
    "unicon": {
      "url": "https://unicon.webrenew.com/api/mcp"
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
  new URL("https://unicon.webrenew.com/api/mcp")
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
1. Verify the URL is exactly \`https://unicon.webrenew.com/api/mcp\`
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
    url: "https://unicon.webrenew.com/docs/mcp/sse",
    type: "website",
  },
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-muted/40">
      {title && (
        <div className="px-3 py-2 border-b border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
          <span>{title}</span>
          <CopyButton value={children} />
        </div>
      )}
      {!title && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton value={children} />
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground/80">
        <code>{children}</code>
      </pre>
    </div>
  );
}

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
        <h1 className="text-4xl md:text-5xl font-bold mb-4">MCP SSE Transport</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Use Unicon MCP with Server-Sent Events (SSE) transport for cloud IDEs and URL-based MCP clients.
        </p>
      </div>

      <div className="space-y-12">
        {/* When to Use */}
        <section>
          <h2 className="text-2xl font-bold mb-6">When to Use SSE Transport</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-[var(--accent-mint)]/20 bg-[var(--accent-mint)]/5">
              <h3 className="font-semibold text-[var(--accent-mint)] mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Use SSE When
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Using cloud IDEs (v0, Bolt, Lovable, Replit)
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Building custom MCP integrations
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Your client supports URL-based MCP connections
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  You want the simplest possible setup
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-mint)]">✓</span>
                  Environment without Node.js
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5" />
                Use stdio Transport Instead When
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span>→</span>
                  Using Claude Desktop
                </li>
                <li className="flex gap-2">
                  <span>→</span>
                  Using Cursor IDE
                </li>
                <li className="flex gap-2">
                  <span>→</span>
                  Using local development tools
                </li>
                <li className="flex gap-2">
                  <span>→</span>
                  Your client only supports stdio transport
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/docs/mcp" className="text-sm text-[var(--accent-aqua)] hover:underline">
                  See MCP Overview for stdio setup →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoint URL */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Endpoint URL</h2>
          <CodeBlock title="MCP Endpoint">{`https://unicon.webrenew.com/api/mcp`}</CodeBlock>
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
│ unicon.webrenew.com/api/mcp │
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
              <CodeBlock>{`https://unicon.webrenew.com/api/mcp`}</CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Bolt / Lovable</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Configure in project settings:
              </p>
              <CodeBlock title="mcp.json">{`{
  "mcpServers": {
    "unicon": {
      "url": "https://unicon.webrenew.com/api/mcp"
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
  new URL("https://unicon.webrenew.com/api/mcp")
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
                <li>1. Verify the URL is exactly <code className="text-[var(--accent-aqua)]">https://unicon.webrenew.com/api/mcp</code></li>
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
