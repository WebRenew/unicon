# Contributing to Unicon

Thanks for your interest in contributing to Unicon! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- A [Supabase](https://supabase.com/) account (for local development)

## Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/your-username/unicon.git
   cd unicon
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy the environment file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   See `.env.example` for descriptions of each variable. At minimum you need Supabase and Turso credentials.

4. Start the dev server:

   ```bash
   pnpm dev
   ```

## Code Style

- **TypeScript** for all code
- **Tailwind CSS** for styling, using theme variables (`bg-background`, `text-foreground`)
- **Custom icon components** in `src/components/icons/ui/` — no external icon libraries or emojis
- Use `cn()` from `@/lib/utils` for conditional classes

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

```
feat: add icon search filters
fix: correct bundle export count
chore: update dependencies
docs: improve setup instructions
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure checks pass:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm test:coverage
   pnpm build
   ```
4. Open a PR against `main` with a clear description
5. Fill out the PR template

Required GitHub checks for merge:
- `Lint, Typecheck & Build`
- `Test Coverage`

## Project Structure

```
src/
  app/          # Next.js app router pages and API routes
  components/   # React components
  lib/          # Shared utilities, database, auth
packages/
  cli/          # @webrenew/unicon CLI
  mcp-server/   # @webrenew/unicon-mcp-server
```

## Questions?

Open a [discussion](https://github.com/WebRenew/unicon/discussions) or file an issue.
