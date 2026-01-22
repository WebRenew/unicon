# 🦄 Unicon

**Just the icons you need. Zero bloat.**

Browse 17,786+ icons from popular libraries including [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), [Huge Icons](https://hugeicons.com), [Heroicons](https://heroicons.com), [Tabler](https://tabler.io/icons), [Feather](https://feathericons.com), [Remix Icon](https://remixicon.com), and [Simple Icons](https://simpleicons.org) (brand logos). Copy React components, SVGs, or bundle multiple icons for export. Like [shadcn/ui](https://ui.shadcn.com), but for icons.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WebRenew/unicon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **17,786+ Icons** — Lucide, Phosphor, Huge Icons, Heroicons, Tabler, Feather, Remix, and Simple Icons (3,384 brand logos) in one place
- **Semantic Search** — Vector embeddings power intelligent search that understands meaning, not just keywords (e.g., "happy face" finds smile icons)
- **AI Query Expansion** — Natural language queries like "business icons" or "celebration" automatically find relevant results
- **Bundle Builder** — Select multiple icons and export as React components, SVGs, or JSON
- **Intelligent Caching** — Popular searches are cached for instant results
- **Copy to Clipboard** — One-click copy for SVG, React component, or usage example
- **Open in v0** — Send icons directly to [v0.dev](https://v0.dev) for rapid prototyping
- **Light/Dark Mode** — Follows system preference with manual toggle
- **Zero Bloat** — Only ship the icons you actually use

## Quick Start

### Prerequisites

- Node.js 18+
- [Turso](https://turso.tech) database (or any libSQL-compatible database)
- [OpenRouter API key](https://openrouter.ai) or [OpenAI API key](https://platform.openai.com) (for semantic search embeddings)
- [Anthropic API key](https://console.anthropic.com) (optional, for AI query expansion)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key (optional, for other AI features)

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

# OpenAI/OpenRouter (for semantic search embeddings - choose one)
OPENAI_API_KEY=sk-...                    # OpenAI API key
# OR
OPENAI_API_KEY=sk-or-v1-...              # OpenRouter API key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Vercel AI Gateway (optional, for other AI features)
AI_GATEWAY_API_KEY=vck_...

# Anthropic Claude (optional, for AI query expansion)
ANTHROPIC_API_KEY=sk-ant-...

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

### Generate Embeddings (Enable Semantic Search)

After populating icons, generate vector embeddings for semantic search:

```bash
# Generate embeddings for all icons
pnpm embeddings

# Or generate for specific library
pnpm embeddings --source lucide

# Monitor progress
tail -f embedding-progress.log
```

This uses OpenAI's `text-embedding-3-large` model (3072 dimensions) to create semantic vectors for each icon, enabling intelligent search that understands meaning beyond keywords.

**Cost estimate**: ~$0.13 USD for all 17,786 icons on OpenRouter.

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to browse icons.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Database**: [Turso](https://turso.tech) (libSQL) + [Drizzle ORM](https://orm.drizzle.team)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) + [Anthropic Claude](https://anthropic.com) + [OpenRouter](https://openrouter.ai)
- **Embeddings**: OpenAI `text-embedding-3-large` (3072 dimensions)
- **Vector Search**: Turso's `vector_distance_cos()` for semantic similarity
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Components**: [Radix UI](https://radix-ui.com) primitives
- **Icons**: [Lucide](https://lucide.dev) (for UI)
- **Deployment**: [Vercel](https://vercel.com)

## How Semantic Search Works

Unicon uses vector embeddings to understand the meaning of search queries, not just keywords:

1. **Embedding Generation**: Each icon's metadata (name, category, tags, aliases) is converted to a 3072-dimensional vector using OpenAI's `text-embedding-3-large` model
2. **Query Embedding**: User search queries are embedded using the same model
3. **Similarity Search**: Turso's `vector_distance_cos()` finds icons with the most similar embeddings (cosine distance)
4. **Smart Fallback**: If no embeddings exist, falls back to traditional SQL `LIKE` search
5. **Intelligent Caching**: Popular queries are cached with TTL expiration and LRU eviction

**Example**: Searching for "happy face" semantically matches icons like:
- `FaceSmileSolid` (heroicons)
- `EmotionHappyLine` (remix)
- `SmileyBlank` (phosphor)

Even though they don't contain the exact words "happy" or "face" in their names.

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

Fetch paginated icons with optional filters and semantic search.

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `q`       | string | Search query (uses semantic search when embeddings available) |
| `source`  | string | Filter by library (lucide, phosphor, hugeicons, heroicons, tabler, feather, remix, simple-icons) |
| `limit`   | number | Results per page (default: 100, max: 160) |
| `offset`  | number | Pagination offset                    |
| `ai`      | boolean | Enable AI search (default: true)    |

**Response includes**:
- `searchType`: `"semantic"` (vector similarity) or `"text"` (SQL LIKE)
- `icons`: Array of matching icons
- Results are cached for performance

**Example**:
```bash
curl 'https://unicon.webrenew.com/api/icons?q=happy%20face&limit=5'
```

### `POST /api/search`

Legacy semantic search endpoint (prefer GET /api/icons for new implementations).

```json
{
  "query": "business icons",
  "sourceId": "lucide",
  "limit": 50
}
```

### `GET /api/health`

System health check with database, AI, and cache statistics.

**Response**:
```json
{
  "status": "healthy",
  "database": {
    "icons": { "total": 17786, "withEmbeddings": 17786, "percentage": 100 }
  },
  "ai": {
    "openai": { "configured": true },
    "anthropic": { "configured": false }
  },
  "cache": {
    "searchResults": { "size": 3, "utilization": 1 }
  }
}
```

### `POST /api/admin/warm-cache`

Pre-populate search cache with popular queries (requires ADMIN_SECRET).

**Response**:
```json
{
  "popularQueries": ["home", "user", "settings", "..."],
  "count": 20
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
