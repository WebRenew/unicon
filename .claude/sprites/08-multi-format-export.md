# Multi-Format Export System

## Problem
Developers need icons in different formats depending on their stack (React, Vue, Svelte, PNG, etc.) but manually converting is tedious.

## Goal
Provide one-click export of icons in multiple formats and framework-specific components.

## Supported Formats

### Vector Formats
- **SVG** - Raw SVG file
- **Optimized SVG** - SVGO processed, smaller filesize
- **SVG Sprite** - Combined sprite sheet
- **SVG Symbol** - For use with `<use>` tags

### Raster Formats
- **PNG** - Multiple sizes (16px, 24px, 32px, 64px, 128px, 256px, 512px)
- **WebP** - Modern format, smaller size
- **ICO** - Favicon format
- **ICNS** - macOS icon format

### Framework Components
```typescript
// React/Next.js
export const ArrowRight = (props) => (
  <svg {...props}>...</svg>
);

// React with TypeScript
export const ArrowRight: React.FC<SVGProps<SVGSVGElement>> = (props) => ...;

// Vue 3
<template>
  <svg v-bind="$attrs">...</svg>
</template>

// Svelte
<svg {...$$restProps}>...</svg>

// Web Component
class ArrowRightIcon extends HTMLElement {...}

// React Native
import Svg, { Path } from 'react-native-svg';
```

### Data Formats
- **JSON** - Icon data structure
- **CSS** - Data URI background images
- **Base64** - Encoded string
- **Icon Font** - Generate custom font files

## UI/UX

### Download Options
```
[Download ▼]
  ├─ SVG
  ├─ React Component
  ├─ Vue Component
  ├─ Svelte Component
  ├─ PNG (Multiple Sizes)
  ├─ WebP
  └─ Copy as JSX
```

### Customization
- Size/dimensions
- Stroke width
- Color/fill
- Class name
- Add TypeScript types
- Include props spreading
- Tree-shakeable exports

### Bulk Export
- Export bundle as zip
- Choose format per bundle
- Generate npm package
- Create icon font from selection

## Technical Implementation
- Server-side rendering/conversion
- SVGO for optimization
- Sharp for PNG generation
- Template system for components
- Streaming downloads for large bundles
