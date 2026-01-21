# Icon Customization Studio

## Problem
Users often need to modify icons (change colors, stroke width, size) before using them, but editing SVGs manually or in external tools breaks the workflow.

## Goal
Provide an in-app visual editor for real-time icon customization with instant preview and code generation.

## Core Features

### Visual Adjustments
- **Stroke Width** - Slider to adjust line thickness (0.5px - 4px)
- **Size** - Quick presets (16, 20, 24, 32, 48, 64) + custom input
- **Color** - Color picker with palette presets
- **Rotation** - Rotate in 45° increments
- **Flip** - Horizontal/vertical flip

### Advanced Editing
- **Padding** - Add internal padding
- **Border Radius** - Round icon corners
- **Background** - Add background shape (circle, square, rounded)
- **Effects** - Drop shadow, stroke outline

## UI Concept

### Studio Interface
```
┌─────────────────────────────────────────┐
│  ← Back to Library                      │
├───────────────┬─────────────────────────┤
│               │  Customization          │
│               │  ─────────────          │
│    [Icon]     │  Size: [24px ▼]        │
│   Preview     │  ○ 16 ○ 20 ● 24 ○ 32   │
│               │                         │
│   Changes     │  Color: [■ #000000]     │
│   live        │                         │
│               │  Stroke: [━━●━━] 2px    │
│               │                         │
│               │  Rotate: [○] 0°         │
│               │  Flip: [H] [V]          │
│               │                         │
│               │  Background             │
│               │  ○ None ○ Circle ○ Square│
│               │                         │
│               │  [Export ▼]             │
│               │  [Add to Bundle]        │
└───────────────┴─────────────────────────┘
```

### Live Code Preview
```typescript
// Show generated code in real-time
<ArrowRight
  size={24}
  color="#3b82f6"
  strokeWidth={2}
  className="rotate-45"
/>
```

## Preset Styles

### Quick Style Templates
- **Default** - Original icon style
- **Bold** - Thicker stroke weight
- **Light** - Thinner, delicate lines
- **Filled** - Solid fill instead of outline
- **Duotone** - Two-color variation
- **Gradient** - Color gradient fill

### Brand Themes
```typescript
// Save custom themes
const myBrandTheme = {
  primaryColor: '#3b82f6',
  strokeWidth: 1.5,
  size: 24,
  cornerRadius: 4
};
```

## Export Options

### After Customization
- Download modified SVG
- Copy optimized code
- Add to bundle (with customizations)
- Save as preset
- Generate component code

### Format-Specific Export
```typescript
// React with custom props
<ArrowRight className="text-blue-500" size={32} />

// Inline SVG with changes baked in
<svg width="32" height="32" stroke="#3b82f6">...</svg>

// CSS custom properties
<svg class="icon" style="--icon-color: #3b82f6; --icon-size: 32px">
```

## Advanced Features

### Batch Customization
- Apply same settings to multiple icons
- Bulk color change
- Consistent sizing across bundle

### Variations Generator
- Generate multiple size variations
- Create color palette variants
- Export all variations at once

### History & Undo
- Track customization steps
- Undo/redo changes
- Compare before/after
- Reset to original

## Technical Implementation
- Real-time SVG manipulation
- CSS-based previews
- SVGO integration for optimization
- Canvas API for advanced effects
- Code generation templates
