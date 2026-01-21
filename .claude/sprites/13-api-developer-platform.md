# API & Developer Platform

## Problem
Developers and third-party applications need programmatic access to the icon library for integrations, automation, and building on top of the platform.

## Goal
Provide a comprehensive REST API with SDKs that enables developers to integrate Unicon into their tools and workflows.

## API Endpoints

### Icon Discovery
```http
GET /api/v1/icons
GET /api/v1/icons/{id}
GET /api/v1/icons/search?q=arrow&library=heroicons
GET /api/v1/icons/categories
GET /api/v1/icons/libraries
```

### Icon Data
```http
GET /api/v1/icons/{id}/svg
GET /api/v1/icons/{id}/variants  # Different sizes/styles
GET /api/v1/icons/{id}/metadata
```

### Bundles
```http
GET /api/v1/bundles
POST /api/v1/bundles
GET /api/v1/bundles/{id}
PATCH /api/v1/bundles/{id}
DELETE /api/v1/bundles/{id}
GET /api/v1/bundles/{id}/export?format=zip
```

### User Management
```http
GET /api/v1/user/favorites
POST /api/v1/user/favorites/{iconId}
GET /api/v1/user/recent
```

## Response Format

### Icon Object
```json
{
  "id": "arrow-right",
  "name": "Arrow Right",
  "library": "heroicons",
  "category": "arrows",
  "tags": ["navigation", "direction", "next"],
  "license": "MIT",
  "svg": {
    "outline": "<svg>...</svg>",
    "solid": "<svg>...</svg>"
  },
  "variants": [
    { "size": 16, "url": "/api/v1/icons/arrow-right/svg?size=16" },
    { "size": 24, "url": "/api/v1/icons/arrow-right/svg?size=24" }
  ],
  "metadata": {
    "viewBox": "0 0 24 24",
    "strokeWidth": 2,
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-06-15T12:00:00Z"
  }
}
```

## Authentication

### API Keys
```http
Authorization: Bearer sk_live_abc123...
```

### Rate Limiting
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Plans
- **Free** - 1,000 requests/month
- **Developer** - 10,000 requests/month
- **Team** - 100,000 requests/month
- **Enterprise** - Custom limits

## SDKs

### Official SDKs
```typescript
// JavaScript/TypeScript
import { UniconClient } from '@unicon/sdk';

const client = new UniconClient('sk_live_...');

const icons = await client.icons.search('arrow');
const icon = await client.icons.get('arrow-right');
const svg = await icon.toSVG({ size: 24, color: '#000' });
```

```python
# Python
from unicon import UniconClient

client = UniconClient('sk_live_...')

icons = client.icons.search('arrow')
icon = client.icons.get('arrow-right')
svg = icon.to_svg(size=24, color='#000')
```

```go
// Go
import "github.com/unicon/unicon-go"

client := unicon.NewClient("sk_live_...")

icons, _ := client.Icons.Search("arrow")
icon, _ := client.Icons.Get("arrow-right")
svg := icon.ToSVG(24, "#000")
```

### Community SDKs
- Ruby
- PHP
- Rust
- Swift
- Kotlin

## Webhooks

### Events
```http
POST https://your-app.com/webhooks/unicon
{
  "event": "icon.created",
  "data": {
    "id": "new-icon",
    "library": "heroicons",
    "timestamp": "2024-06-15T12:00:00Z"
  }
}
```

### Supported Events
- `icon.created`
- `icon.updated`
- `icon.deleted`
- `library.updated`
- `bundle.created`

## Developer Portal

### Features
- API key management
- Usage dashboard
- Rate limit monitoring
- Webhook configuration
- Documentation
- Code examples
- API playground (interactive)
- Changelog

### Interactive Docs
- Try API calls directly in browser
- Auto-generated code snippets
- Response examples
- Error code reference

## Use Cases
- Build custom icon search tools
- Integrate into design systems
- Automate icon updates in CI/CD
- Create icon management dashboards
- Power icon marketplaces
- Support IDE extensions
