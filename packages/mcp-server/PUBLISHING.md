# Publishing Guide for @webrenew/unicon-mcp-server

Complete guide to publishing the MCP server package to NPM.

## Prerequisites

### 1. NPM Account Setup

- [ ] Create NPM account at https://www.npmjs.com/signup
- [ ] Verify email address
- [ ] Enable 2FA (required for publishing)

### 2. Generate NPM Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Select "Automation" token type (for CI/CD) or "Publish" (for manual publishing)
4. Copy the token (you'll only see it once!)

### 3. Add Token to .env

In the **root** of the Unicon project, add to `.env` or `.env.local`:

```bash
NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Never commit this file!** It's already in `.gitignore`.

## Publishing Process

### Step 1: Prepare for Release

1. **Update version** in `package.json`:
   ```json
   {
     "version": "1.0.0"  // or 1.0.1, 1.1.0, etc.
   }
   ```

2. **Update CHANGELOG** (if you have one):
   ```markdown
   ## [1.0.0] - 2026-01-20
   - Initial release
   - Search 14,700+ icons
   - Generate React/Vue/Svelte components
   ```

3. **Test locally**:
   ```bash
   # Build the package
   npm run build
   
   # Test it works
   node dist/index.js
   
   # Test with Claude (update config to use local build)
   ```

4. **Verify package contents**:
   ```bash
   # See what will be published
   npm pack --dry-run
   ```

### Step 2: Publish

From the `packages/mcp-server` directory:

```bash
npm run publish:package
```

This will:
1. Load `NPM_TOKEN` from `.env`
2. Clean the `dist` directory
3. Build the package
4. Show the version number
5. Ask for confirmation
6. Publish to NPM

**Or manually:**

```bash
# Build
npm run build

# Configure npm with token
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Publish
npm publish --access public
```

### Step 3: Verify Publication

1. **Check NPM page**:
   ```
   https://www.npmjs.com/package/@webrenew/unicon-mcp-server
   ```

2. **Test installation**:
   ```bash
   # In a different directory
   npx @webrenew/unicon-mcp-server
   ```
   Should start the server (Ctrl+C to exit)

3. **Test with Claude**:
   ```json
   {
     "mcpServers": {
       "unicon": {
         "command": "npx",
         "args": ["-y", "@webrenew/unicon-mcp-server"]
       }
     }
   }
   ```

### Step 4: Post-Publish

- [ ] Update main README with installation instructions
- [ ] Create Git tag: `git tag mcp-server-v1.0.0 && git push --tags`
- [ ] Announce on social media / GitHub Discussions
- [ ] Monitor for issues

## Version Guidelines

Follow Semantic Versioning (semver):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

Examples:
- Adding new tool → Minor version bump
- Fixing error handling → Patch version bump
- Changing API structure → Major version bump

## Troubleshooting

### "npm ERR! need auth"

**Problem:** NPM token not configured or invalid

**Solution:**
```bash
# Check if token is in .env
grep NPM_TOKEN ../../.env

# Manually configure
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
```

### "npm ERR! 403 Forbidden"

**Problem:** No permission to publish to `@webrenew` scope

**Solution:**
- Contact NPM support to request access to the org
- Or publish under your own scope (change package name)

### "npm ERR! You must sign up for private packages"

**Problem:** Publishing as private package by default

**Solution:**
```bash
npm publish --access public
```

### "ENEEDAUTH"

**Problem:** 2FA required but not provided

**Solution:**
```bash
# If you have 2FA enabled, use OTP
npm publish --otp=123456

# Or use automation token (no 2FA required)
```

### Build fails

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist
npm run build

# Check for type errors
npx tsc --noEmit
```

## Automated Publishing (GitHub Actions)

To automate publishing on version tags:

```yaml
# .github/workflows/publish-mcp-server.yml
name: Publish MCP Server

on:
  push:
    tags:
      - 'mcp-server-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        working-directory: packages/mcp-server
        run: npm ci
      
      - name: Build
        working-directory: packages/mcp-server
        run: npm run build
      
      - name: Publish
        working-directory: packages/mcp-server
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then add `NPM_TOKEN` to GitHub Secrets.

## Package Registry

The package is published to NPM's public registry:
- Registry: https://registry.npmjs.org/
- Package: https://www.npmjs.com/package/@webrenew/unicon-mcp-server
- Install: `npx @webrenew/unicon-mcp-server`

## Support

If you encounter issues:
1. Check this guide
2. Search NPM docs: https://docs.npmjs.com/
3. Create issue: https://github.com/webrenew/unicon/issues

---

**Happy Publishing! 🚀**
