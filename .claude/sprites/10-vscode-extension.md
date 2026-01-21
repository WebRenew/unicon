# VS Code Extension

## Problem
Developers frequently need to browse icons, copy SVG code, or insert icon components while coding, requiring context switching to a browser.

## Goal
Create a VS Code extension that brings the icon library directly into the editor with intelligent code insertion.

## Core Features

### Icon Browser
- Sidebar panel with searchable icon grid
- Preview on hover
- Click to copy or insert
- Keyboard shortcuts for quick access

### Smart Insertion
```javascript
// Type trigger
import { /* cursor */ } from '@unicon/icons';
// Autocomplete shows icon names with previews

// Inline preview in JSX
<ArrowRight />  // Shows icon preview in gutter
```

### Quick Actions
```
Cmd+Shift+I → Open icon search
Cmd+K Cmd+I → Insert icon at cursor
```

### Context-Aware Insertion
```typescript
// Detects framework and inserts appropriate format
// React/Next.js
import { ArrowRight } from '@/icons/arrow-right';

// Vue
import ArrowRight from '@/icons/arrow-right.vue';

// Svelte
import ArrowRight from '@/icons/arrow-right.svelte';

// HTML
<!-- Inserts inline SVG or icon font class -->
```

## UI Features

### Sidebar Panel
```
UNICON ICONS
├─ 🔍 Search
├─ ⭐ Favorites
├─ 📦 Bundles
├─ 🕐 Recent
└─ 📚 Libraries
    ├─ Heroicons
    ├─ Lucide
    └─ Phosphor
```

### Hover Preview
- Show icon preview on hover over import
- Display icon metadata (size, license, library)
- Quick actions (copy, replace, customize)

### IntelliSense Integration
- Icon name autocomplete
- Preview in autocomplete dropdown
- Props/attributes suggestions
- Type definitions

## Configuration
```json
{
  "unicon.autoImport": true,
  "unicon.defaultFormat": "react",
  "unicon.iconSize": 24,
  "unicon.favoriteLibrary": "lucide",
  "unicon.customPath": "@/components/icons"
}
```

## Advanced Features
- Workspace icon cache
- Offline mode
- Custom icon library support
- Team settings sync
- Usage analytics
- Dead icon detection (find unused icon imports)

## Technical Stack
- VS Code Extension API
- Webview for icon browser
- Language server for IntelliSense
- File system watcher
- API integration

## Marketplace Presence
- Published to VS Code Marketplace
- Regular updates
- Clear documentation
- Demo GIFs/videos
