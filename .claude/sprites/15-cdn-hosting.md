# CDN Hosting & Direct SVG Links

## Problem
Not all projects use npm or build tools. Developers need a fast, reliable way to load icons via CDN for quick prototyping or simple websites.

## Goal
Provide global CDN hosting for all icons with permanent URLs, versioning, and optimized delivery.

## CDN Architecture

### Base URL Structure
```
https://cdn.unicon.dev/v1/{library}/{icon}.svg
https://cdn.unicon.dev/v1/{library}/{icon}@{size}.svg
https://cdn.unicon.dev/v1/{library}/{icon}@{size}.png
```

### Examples
```html
<!-- Direct SVG embedding -->
<img src="https://cdn.unicon.dev/v1/heroicons/arrow-right.svg" alt="Next">

<!-- Specific size -->
<img src="https://cdn.unicon.dev/v1/lucide/home@32.svg" alt="Home">

<!-- PNG fallback -->
<img src="https://cdn.unicon.dev/v1/phosphor/user@48.png" alt="User">
```

## Version Management

### Semantic Versioning
```html
<!-- Latest version (auto-updates) -->
<img src="https://cdn.unicon.dev/latest/heroicons/arrow-right.svg">

<!-- Pinned major version -->
<img src="https://cdn.unicon.dev/v1/heroicons/arrow-right.svg">

<!-- Exact version (immutable) -->
<img src="https://cdn.unicon.dev/v1.2.3/heroicons/arrow-right.svg">
```

## Customization via URL Parameters

### Query Parameters
```
?size=24          # Icon dimensions
?color=3b82f6     # Fill/stroke color (hex without #)
?stroke=2         # Stroke width
?rotate=90        # Rotation (degrees)
?flip=h           # Flip (h/v/hv)
```

### Examples
```html
<!-- Blue 32px icon -->
<img src="https://cdn.unicon.dev/v1/heroicons/arrow-right.svg?size=32&color=3b82f6">

<!-- Rotated icon -->
<img src="https://cdn.unicon.dev/v1/lucide/arrow-up.svg?rotate=45">

<!-- Combined parameters -->
<img src="https://cdn.unicon.dev/v1/phosphor/heart.svg?size=48&color=ef4444&stroke=2">
```

## Inline SVG via JavaScript

### Script Tag
```html
<script src="https://cdn.unicon.dev/v1/unicon.js"></script>
<script>
  // Load and insert icon
  Unicon.load('heroicons/arrow-right', {
    target: '#icon-container',
    size: 24,
    color: 'currentColor'
  });
</script>
```

### ESM Module
```html
<script type="module">
  import { loadIcon } from 'https://cdn.unicon.dev/v1/unicon.esm.js';

  await loadIcon('heroicons/arrow-right', {
    target: document.querySelector('.icon'),
    size: 24
  });
</script>
```

## Icon Sprites

### Sprite Sheet
```html
<!-- Load entire library as sprite -->
<script src="https://cdn.unicon.dev/v1/heroicons/sprite.js"></script>

<!-- Use with <use> tag -->
<svg><use href="#unicon-arrow-right"></use></svg>
```

### Custom Sprite Builder
```
https://cdn.unicon.dev/v1/sprite?icons=arrow-right,arrow-left,home,user
```

## Performance Features

### Optimization
- Automatic SVGO compression
- Gzip/Brotli compression
- HTTP/2 server push
- Aggressive caching headers
```http
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123..."
```

### Global Distribution
- Multi-region CDN (CloudFlare/Fastly)
- Edge caching
- < 50ms latency worldwide
- 99.99% uptime SLA

### Smart Routing
- Geo-based routing
- Automatic failover
- DDoS protection
- Rate limiting per IP

## Usage Analytics

### Public Stats
```
https://cdn.unicon.dev/stats/heroicons/arrow-right
```

```json
{
  "icon": "heroicons/arrow-right",
  "requests": 1234567,
  "bandwidth": "45.2 GB",
  "popularRegions": ["US", "EU", "APAC"],
  "peakTime": "2024-06-15T14:00:00Z"
}
```

## Developer Tools

### NPM Package for CDN
```javascript
import { getCDNUrl } from '@unicon/cdn-helper';

const url = getCDNUrl('heroicons/arrow-right', {
  size: 24,
  color: '3b82f6',
  version: 'v1'
});
// https://cdn.unicon.dev/v1/heroicons/arrow-right.svg?size=24&color=3b82f6
```

### Preload Hints
```html
<!-- Optimize loading -->
<link rel="preconnect" href="https://cdn.unicon.dev">
<link rel="dns-prefetch" href="https://cdn.unicon.dev">
<link rel="preload" as="image" href="https://cdn.unicon.dev/v1/heroicons/arrow-right.svg">
```

## Subresource Integrity (SRI)

### Generate SRI Hashes
```html
<script
  src="https://cdn.unicon.dev/v1.2.3/unicon.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
></script>
```

## API Endpoints

### Metadata
```
GET https://cdn.unicon.dev/api/v1/libraries
GET https://cdn.unicon.dev/api/v1/heroicons/icons
GET https://cdn.unicon.dev/api/v1/heroicons/arrow-right
```

## Documentation
- CDN usage guide
- Performance best practices
- Caching strategies
- Migration from other CDNs
- Security considerations
- SRI hash generator tool
