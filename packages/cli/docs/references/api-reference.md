# API Reference

REST API for programmatic access to Unicon icons.

**Base URL**: `https://unicon.sh/api`

---

## GET /api/icons

Fetch icons with optional filters. Supports AI-powered semantic search.

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `q` | string | Search query (AI search if 3+ chars) | - |
| `source` | string | Filter by library | all |
| `category` | string | Filter by category | all |
| `names` | string | Comma-separated exact names | - |
| `limit` | number | Results per page (max: 320) | 100 |
| `offset` | number | Pagination offset | 0 |
| `ai` | boolean | Enable AI search | true |

### Response

```json
{
  "icons": [
    {
      "id": "lucide:home",
      "name": "Home",
      "normalizedName": "home",
      "sourceId": "lucide",
      "category": "Buildings",
      "tags": ["house", "building", "residence"],
      "viewBox": "0 0 24 24",
      "content": "<path d=\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>...",
      "defaultStroke": true,
      "defaultFill": false,
      "strokeWidth": "2",
      "brandColor": null
    }
  ],
  "hasMore": true,
  "searchType": "semantic",
  "expandedQuery": "home house building residence dwelling"
}
```

### Search Types

| Type | Description |
|------|-------------|
| `semantic` | AI-powered vector search with query expansion |
| `text` | Basic text matching (fallback or short queries) |
| `exact` | Exact name match (when using `names` param) |

### Examples

```bash
# Search with AI
curl "https://unicon.sh/api/icons?q=dashboard"

# Filter by source
curl "https://unicon.sh/api/icons?q=arrow&source=lucide"

# Get specific icons by name
curl "https://unicon.sh/api/icons?names=home,settings,user"

# Browse by category
curl "https://unicon.sh/api/icons?category=Social&limit=50"

# Disable AI search
curl "https://unicon.sh/api/icons?q=home&ai=false"
```

---

## POST /api/search

Hybrid semantic + exact match search with scoring.

### Request Body

```json
{
  "query": "string (required)",
  "sourceId": "string (optional)",
  "limit": "number (optional, default: 50)",
  "useAI": "boolean (optional, default: false)"
}
```

### Response

```json
{
  "results": [
    {
      "id": "lucide:home",
      "name": "Home",
      "normalizedName": "home",
      "sourceId": "lucide",
      "category": "Buildings",
      "tags": ["house", "building"],
      "viewBox": "0 0 24 24",
      "content": "<path ... />",
      "defaultStroke": true,
      "defaultFill": false,
      "strokeWidth": "2",
      "brandColor": null,
      "score": 0.95
    }
  ],
  "searchType": "semantic",
  "expandedQuery": "home house building residence"
}
```

### Score

Results include a `score` (0-1) combining:
- **Semantic similarity** (60% weight) - Vector distance
- **Exact match boost** (40% weight) - Name/tag/category matches

### Examples

```bash
# Basic search
curl -X POST "https://unicon.sh/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "dashboard"}'

# Filter by source
curl -X POST "https://unicon.sh/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "arrow", "sourceId": "phosphor", "limit": 20}'

# Enable AI expansion
curl -X POST "https://unicon.sh/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "celebration", "useAI": true}'
```

---

## Icon Data Schema

```typescript
interface IconData {
  id: string;              // "lucide:home"
  name: string;            // "Home" (PascalCase)
  normalizedName: string;  // "home" (kebab-case)
  sourceId: string;        // "lucide", "phosphor", etc.
  category: string | null; // "Buildings", "Arrows", etc.
  tags: string[];          // ["house", "building"]
  viewBox: string;         // "0 0 24 24"
  content: string;         // Raw SVG inner content
  defaultStroke: boolean;  // Uses stroke for rendering
  defaultFill: boolean;    // Uses fill for rendering
  strokeWidth: string | null;
  brandColor: string | null; // Hex color for brand icons
}
```

---

## Available Sources

| ID | Name | Icons |
|----|------|-------|
| `lucide` | Lucide | 1,900+ |
| `phosphor` | Phosphor | 1,500+ |
| `hugeicons` | Huge Icons | 1,800+ |
| `heroicons` | Heroicons | 292 |
| `tabler` | Tabler | 4,600+ |
| `feather` | Feather | 287 |
| `remix` | Remix Icon | 2,800+ |
| `simple-icons` | Simple Icons | 3,300+ |

---

## Rate Limits

- No authentication required
- Reasonable use expected
- Results are cached (1 hour for browsing, 1 minute for search)

---

## Usage in Code

### JavaScript/TypeScript

```typescript
async function searchIcons(query: string) {
  const response = await fetch(
    `https://unicon.sh/api/icons?q=${encodeURIComponent(query)}`
  );
  const { icons } = await response.json();
  return icons;
}

// Get specific icons
async function getIcons(names: string[]) {
  const response = await fetch(
    `https://unicon.sh/api/icons?names=${names.join(",")}`
  );
  const { icons } = await response.json();
  return icons;
}
```

### Rendering Icons

```tsx
function Icon({ icon }: { icon: IconData }) {
  return (
    <svg
      viewBox={icon.viewBox}
      dangerouslySetInnerHTML={{ __html: icon.content }}
      fill={icon.defaultFill ? "currentColor" : "none"}
      stroke={icon.defaultStroke ? "currentColor" : "none"}
      strokeWidth={icon.strokeWidth ?? 2}
    />
  );
}
```

---

## Error Responses

```json
{
  "error": "Failed to fetch icons"
}
```

| Status | Description |
|--------|-------------|
| 400 | Invalid request (missing query, etc.) |
| 500 | Server error |
