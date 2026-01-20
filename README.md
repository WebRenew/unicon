# 🦄 Unicon

**Just the icons you need. Zero bloat.**

Browse 14,700+ icons from popular libraries including [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), [Huge Icons](https://hugeicons.com), [Heroicons](https://heroicons.com), [Tabler](https://tabler.io/icons), [Feather](https://feathericons.com), [Remix Icon](https://remixicon.com), and [Simple Icons](https://simpleicons.org) (brand logos). Copy React components, SVGs, or bundle multiple icons for export. Like [shadcn/ui](https://ui.shadcn.com), but for icons.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WebRenew/unicon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **14,700+ Icons** — Lucide, Phosphor, Huge Icons, Heroicons, Tabler, Feather, Remix, and Simple Icons (3,300+ brand logos) in one place
- **AI-Powered Search** — Describe what you need ("business icons", "celebration") and find relevant icons
- **Bundle Builder** — Select multiple icons and export as React components, SVGs, or JSON
- **Copy to Clipboard** — One-click copy for SVG, React component, or usage example
- **Open in v0** — Send icons directly to [v0.dev](https://v0.dev) for rapid prototyping
- **Light/Dark Mode** — Follows system preference with manual toggle
- **Zero Bloat** — Only ship the icons you actually use

## Quick Start

### Prerequisites

- Node.js 18+
- [Turso](https://turso.tech) database (or any libSQL-compatible database)
- [Anthropic API key](https://console.anthropic.com) (for AI search)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key (for embeddings)

### Installation

```bash
# Clone the repository
git clone https://github.com/WebRenew/unicon.git
cd unicon

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Vercel AI Gateway (for embeddings)
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key

# Anthropic Claude (for AI search)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Admin API (optional)
ADMIN_SECRET=your-secret-for-admin-routes
```

### Database Setup

```bash
# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio
pnpm db:studio
```

### Populate Icons

The icon extraction pipeline is in the `extractor/` directory:

```bash
cd extractor
pip install -e .

# Extract icons from each library
python -m extractor.main
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to browse icons.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Database**: [Turso](https://turso.tech) (libSQL) + [Drizzle ORM](https://orm.drizzle.team)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) + [Anthropic Claude](https://anthropic.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Components**: [Radix UI](https://radix-ui.com) primitives
- **Icons**: [Lucide](https://lucide.dev) (for UI)
- **Deployment**: [Vercel](https://vercel.com)

## Project Structure

```
unicon/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   ├── icons/       # Icon search endpoint
│   │   │   ├── search/      # AI semantic search
│   │   │   └── admin/       # Admin endpoints
│   │   └── page.tsx         # Main browse page
│   ├── components/
│   │   ├── icons/           # Icon browser components
│   │   └── ui/              # Shared UI components
│   ├── lib/
│   │   ├── ai.ts            # AI/embedding utilities
│   │   ├── db.ts            # Database client
│   │   ├── queries.ts       # Database queries
│   │   └── schema.ts        # Drizzle schema
│   └── types/               # TypeScript types
├── extractor/               # Python icon extraction pipeline
│   ├── extractors/          # Per-library extractors
│   └── main.py              # Entry point
└── drizzle/                 # Database migrations
```

## API Reference

### `GET /api/icons`

Fetch paginated icons with optional filters.

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `q`       | string | Search query                         |
| `source`  | string | Filter by library (lucide, phosphor, hugeicons, heroicons, tabler, feather, remix, simple-icons) |
| `limit`   | number | Results per page (default: 100, max: 160) |
| `offset`  | number | Pagination offset                    |
| `ai`      | boolean | Enable AI search (default: true)    |

### `POST /api/search`

Semantic search using AI embeddings.

```json
{
  "query": "business icons",
  "sourceId": "lucide",
  "limit": 50
}
```

## CLI Tool

A command-line interface for browsing and exporting icons is available at `packages/cli/`.

**Quick access to CLI docs:**
```bash
# View full CLI documentation
curl https://raw.githubusercontent.com/WebRenew/unicon/main/CLI.md

# Or read locally
cat CLI.md
```

See [CLI.md](./CLI.md) for complete CLI documentation.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Credits

Built by [WebRenew](https://webrenew.com)

Icon libraries:
- [Lucide](https://lucide.dev) — ISC License
- [Phosphor Icons](https://phosphoricons.com) — MIT License
- [Huge Icons](https://hugeicons.com) — MIT License
- [Heroicons](https://heroicons.com) — MIT License
- [Tabler Icons](https://tabler.io/icons) — MIT License
- [Feather Icons](https://feathericons.com) — MIT License
- [Remix Icon](https://remixicon.com) — Apache-2.0 License
- [Simple Icons](https://simpleicons.org) — CC0 1.0 Universal (brand logos are trademarks of their respective owners)

---

<p align="center">
  <a href="https://unicon.webrenew.com">Live Demo</a> •
  <a href="https://github.com/WebRenew/unicon/issues">Report Bug</a> •
  <a href="https://github.com/WebRenew/unicon/issues">Request Feature</a>
</p>
