# Quick Publish Guide - MCP Server

## ⚡ Quick Commands

```bash
# From root of unicon project:

# 1. Navigate to MCP server package
cd packages/mcp-server

# 2. Build and publish (uses NPM_TOKEN from .env)
npm run publish:package

# Done! 🎉
```

## 📋 Pre-Publish Checklist

Before running `npm run publish:package`:

- [ ] `NPM_TOKEN` is in `.env` or `.env.local` at project root
- [ ] Updated version in `packages/mcp-server/package.json`
- [ ] All tests passing
- [ ] Build works: `npm run build`
- [ ] Local test works: `node dist/index.js`

## 🔑 NPM Token Setup

If you don't have `NPM_TOKEN` in `.env`:

1. Get token from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to `.env` at project root:
   ```bash
   NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## ✅ Post-Publish Verification

```bash
# Test installation globally
npx @webrenew/unicon-mcp-server

# View on NPM
open https://www.npmjs.com/package/@webrenew/unicon-mcp-server
```

## 📖 Full Documentation

For detailed instructions, see: `packages/mcp-server/PUBLISHING.md`

---

## Current Setup

Your `.env` file should contain:

```bash
# NPM Publishing
NPM_TOKEN=npm_...your_token_here...

# Other env vars
DATABASE_URL=...
ANTHROPIC_API_KEY=...
```

✅ `.env` and `.env.local` are in `.gitignore` (never committed)

## Publishing Process

The publish script (`scripts/publish.sh`):

1. ✅ Loads `NPM_TOKEN` from `.env`
2. ✅ Cleans `dist/` directory
3. ✅ Builds TypeScript → JavaScript
4. ✅ Shows version for confirmation
5. ✅ Publishes to NPM with `--access public`
6. ✅ Shows success message with links

## Manual Publishing

If automated script doesn't work:

```bash
cd packages/mcp-server

# Build
npm run build

# Configure npm (one-time)
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Publish
npm publish --access public
```

## Need Help?

- Check: `packages/mcp-server/PUBLISHING.md`
- Issues: https://github.com/webrenew/unicon/issues
