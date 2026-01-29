# MCP Server Testing Checklist

Complete this checklist before deploying and publishing the MCP server.

## Pre-Deployment Testing

### ✅ Build Verification

- [x] Main project builds: `npm run build`
- [x] MCP server builds: `cd packages/mcp-server && npm run build`
- [x] Type checking passes: `npm run typecheck`
- [x] No linter errors

### 🌐 Local API Testing

Test the API endpoint locally before deploying:

```bash
# Start dev server
npm run dev

# In another terminal, test the API:
```

- [ ] **GET /api/mcp** - Server info
  ```bash
  curl http://localhost:3000/api/mcp | jq
  ```
  Should return server name, version, capabilities

- [ ] **POST /api/mcp - list_tools**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "list_tools"}' | jq
  ```
  Should return 3 tools: search_icons, get_icon, get_multiple_icons

- [ ] **POST /api/mcp - list_resources**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "list_resources"}' | jq
  ```
  Should return 3 resources: sources, categories, stats

- [ ] **POST /api/mcp - read_resource (sources)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "read_resource", "params": {"uri": "unicon://sources"}}' | jq
  ```
  Should return list of icon libraries

- [ ] **POST /api/mcp - read_resource (categories)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "read_resource", "params": {"uri": "unicon://categories"}}' | jq
  ```
  Should return list of categories

- [ ] **POST /api/mcp - read_resource (stats)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "read_resource", "params": {"uri": "unicon://stats"}}' | jq
  ```
  Should return total icon count and per-library stats

- [ ] **POST /api/mcp - call_tool (search_icons)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "search_icons",
        "arguments": {"query": "arrow", "limit": 5}
      }
    }' | jq
  ```
  Should return 5 arrow icons

- [ ] **POST /api/mcp - call_tool (get_icon - React)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "get_icon",
        "arguments": {"iconId": "lucide:arrow-right", "format": "react"}
      }
    }' | jq -r '.result.code'
  ```
  Should return React component code

- [ ] **POST /api/mcp - call_tool (get_icon - Vue)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "get_icon",
        "arguments": {"iconId": "lucide:home", "format": "vue"}
      }
    }' | jq -r '.result.code'
  ```
  Should return Vue component code

- [ ] **POST /api/mcp - call_tool (get_icon - Svelte)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "get_icon",
        "arguments": {"iconId": "lucide:settings", "format": "svelte"}
      }
    }' | jq -r '.result.code'
  ```
  Should return Svelte component code

- [ ] **POST /api/mcp - call_tool (get_icon - SVG)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "get_icon",
        "arguments": {"iconId": "lucide:user", "format": "svg"}
      }
    }' | jq -r '.result.code'
  ```
  Should return SVG code

- [ ] **POST /api/mcp - call_tool (get_multiple_icons)**
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "action": "call_tool",
      "params": {
        "name": "get_multiple_icons",
        "arguments": {
          "iconIds": ["lucide:home", "lucide:settings", "lucide:user"],
          "format": "react"
        }
      }
    }' | jq
  ```
  Should return 3 React components

### 🖥️ Local MCP Server Testing

Test the local bridge server:

- [ ] **Build local server**
  ```bash
  cd packages/mcp-server
  npm run build
  ```

- [ ] **Test server starts**
  ```bash
  node dist/index.js
  ```
  Should print: "Unicon MCP Server running" to stderr

- [ ] **Test with custom API endpoint**
  ```bash
  UNICON_API_URL=http://localhost:3000/api/mcp node dist/index.js
  ```
  Should connect to local API

### 🤖 Claude Desktop Integration

- [ ] **Create test config**
  ```json
  {
    "mcpServers": {
      "unicon-test": {
        "command": "node",
        "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"],
        "env": {
          "UNICON_API_URL": "http://localhost:3000/api/mcp"
        }
      }
    }
  }
  ```

- [ ] **Restart Claude Desktop** (complete quit)

- [ ] **Verify server appears** (🔌 icon → "unicon-test")

- [ ] **Test: List libraries**
  Prompt: "What icon libraries are available in Unicon?"
  Expected: Should show 9 libraries with counts

- [ ] **Test: Search**
  Prompt: "Search for arrow icons in Lucide"
  Expected: Should return list of arrow icons with IDs

- [ ] **Test: Get icon (React)**
  Prompt: "Get the React component for lucide:arrow-right"
  Expected: Should return complete React TypeScript component

- [ ] **Test: Get icon (Vue)**
  Prompt: "Generate a Vue component for lucide:home"
  Expected: Should return Vue component with <script setup>

- [ ] **Test: Get icon (Svelte)**
  Prompt: "Create a Svelte component for lucide:settings"
  Expected: Should return Svelte component

- [ ] **Test: Get icon (SVG)**
  Prompt: "Get the SVG code for lucide:user"
  Expected: Should return standalone SVG

- [ ] **Test: Multiple icons**
  Prompt: "Give me React components for home, settings, and user icons from Lucide"
  Expected: Should return 3 components

- [ ] **Test: With options**
  Prompt: "Get lucide:arrow-right as React with size 32 and strokeWidth 1.5"
  Expected: Component should have size=32 and strokeWidth=1.5 defaults

- [ ] **Test: Error handling**
  Prompt: "Get the icon lucide:does-not-exist"
  Expected: Should return clear error message

- [ ] **Test: Browse categories**
  Prompt: "What icon categories are available?"
  Expected: Should list all categories

- [ ] **Test: Library stats**
  Prompt: "How many icons does Unicon have?"
  Expected: Should show ~19,000 total with breakdown

## Post-Deployment Testing

After deploying to Vercel:

### 🚀 Production API Testing

- [ ] **GET https://unicon.sh/api/mcp**
  ```bash
  curl https://unicon.sh/api/mcp | jq
  ```

- [ ] **Test search_icons on production**
  ```bash
  curl -X POST https://unicon.sh/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "call_tool", "params": {"name": "search_icons", "arguments": {"query": "arrow", "limit": 5}}}' | jq
  ```

- [ ] **Test get_icon on production**
  ```bash
  curl -X POST https://unicon.sh/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"action": "call_tool", "params": {"name": "get_icon", "arguments": {"iconId": "lucide:home", "format": "react"}}}' | jq
  ```

- [ ] **Verify CORS headers**
  ```bash
  curl -I https://unicon.sh/api/mcp
  ```
  Should include: Access-Control-Allow-Origin: *

### 📦 NPM Package Testing

After publishing:

- [ ] **Test npx installation**
  ```bash
  npx -y @webrenew/unicon-mcp-server
  ```
  Should start server (Ctrl+C to exit)

- [ ] **Update Claude config for production**
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

- [ ] **Restart Claude and verify**
  Should see "unicon" in MCP servers list

- [ ] **Run all Claude tests again** (using production)

### 🔍 Performance Testing

- [ ] **Measure cold start time**
  First request should complete in < 2s

- [ ] **Measure warm request time**
  Subsequent requests should complete in < 500ms

- [ ] **Test rate limits**
  Make 101 search requests - should get rate limit error

- [ ] **Test batch operations**
  Get 50 icons in one request - should work
  Try 51 icons - should error

### 🐛 Error Cases

- [ ] Invalid icon ID
- [ ] Invalid format
- [ ] Invalid action
- [ ] Malformed JSON
- [ ] Missing required parameters
- [ ] Icon not found
- [ ] Batch size exceeded

## Documentation Verification

- [ ] **README accurate** - Check packages/mcp-server/README.md
- [ ] **Quick start works** - Follow docs/mcp-quickstart.md step by step
- [ ] **Full guide complete** - Review docs/mcp-integration.md
- [ ] **Examples work** - Test all code examples in docs

## Security Review

- [ ] No API keys in code
- [ ] No secrets in logs
- [ ] CORS properly configured
- [ ] Input validation working
- [ ] Error messages don't leak internals

## Monitoring Setup

- [ ] Vercel analytics enabled
- [ ] Error tracking configured
- [ ] Usage dashboard accessible
- [ ] Rate limit monitoring active

## Launch Checklist

- [ ] All tests passing ✅
- [ ] API deployed to production
- [ ] NPM package published
- [ ] Documentation complete
- [ ] GitHub README updated with MCP section
- [ ] Announcement post drafted
- [ ] Support channels ready

## Post-Launch Monitoring (First Week)

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Watch for user issues
- [ ] Gather feedback
- [ ] Fix any critical bugs
- [ ] Update docs based on questions

---

**Notes:**
- ✅ = Automated test passed
- ⚠️ = Manual verification needed
- ❌ = Test failed, needs fix
- ⏭️ = Skipped (document why)

**Tester:** _______________  
**Date:** _______________  
**Version:** v1.0.0  
**Status:** _______________
