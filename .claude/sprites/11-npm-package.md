# NPM Package Distribution

## Problem
Developers want to install and use the icon library via npm rather than copying files or using a CDN, for better version control and build integration.

## Goal
Create a well-structured, tree-shakeable npm package that integrates seamlessly with modern JavaScript frameworks.

## Package Structure

### Monorepo Approach
```
@unicon/
├─ core              # Base SVG icons
├─ react             # React components
├─ vue               # Vue components
├─ svelte            # Svelte components
├─ solid             # Solid.js components
├─ react-native      # React Native components
├─ angular           # Angular components
└─ web-components    # Web Components
```

### Installation
```bash
npm install @unicon/react
pnpm add @unicon/vue
yarn add @unicon/svelte
```

### Usage Examples

#### React
```typescript
import { ArrowRight, Home, User } from '@unicon/react';
import { ArrowRight } from '@unicon/react/arrow-right'; // Individual import

<ArrowRight size={24} color="currentColor" strokeWidth={2} />
```

#### Vue
```vue
<script setup>
import { ArrowRight } from '@unicon/vue';
</script>

<template>
  <ArrowRight :size="24" color="currentColor" />
</template>
```

#### Tree-Shaking
```typescript
// ✅ Good - Only ArrowRight is bundled
import { ArrowRight } from '@unicon/react';

// ✅ Better - Explicit path
import { ArrowRight } from '@unicon/react/arrow-right';

// ❌ Avoid - Imports everything
import * as Icons from '@unicon/react';
```

## Package Features

### TypeScript Support
- Full type definitions
- Prop types for all components
- Icon name autocomplete
- Generic component types

### Customization
```typescript
interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  // Framework-specific props spread
}
```

### Configuration
```typescript
// Configure defaults
import { configure } from '@unicon/react';

configure({
  defaultSize: 24,
  defaultColor: 'currentColor',
  defaultStrokeWidth: 2
});
```

### Aliases & Helpers
```typescript
import { createIcon, Icon } from '@unicon/react';

// Create custom icon
const CustomIcon = createIcon({
  path: '<path d="..." />',
  viewBox: '0 0 24 24'
});

// Render any icon by name
<Icon name="arrow-right" size={24} />
```

## Build Optimization

### Multiple Module Formats
- ESM (modern bundlers)
- CJS (Node.js compatibility)
- UMD (browser globals)
- Individual files (maximum tree-shaking)

### File Structure
```
dist/
├─ esm/
│  ├─ index.js
│  └─ arrow-right.js
├─ cjs/
│  ├─ index.js
│  └─ arrow-right.js
├─ types/
│  ├─ index.d.ts
│  └─ arrow-right.d.ts
└─ umd/
   └─ unicon-react.min.js
```

### Package.json
```json
{
  "name": "@unicon/react",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./*": {
      "import": "./dist/esm/*.js",
      "require": "./dist/cjs/*.js",
      "types": "./dist/types/*.d.ts"
    }
  },
  "sideEffects": false
}
```

## Publishing Strategy
- Automated releases with changesets
- Semantic versioning
- Changelog generation
- npm provenance
- GitHub releases
- Comprehensive README with examples
