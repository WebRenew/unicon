# Integrate Additional MIT Licensed Icon Libraries

**Status:** ✅ Completed

## Problem
Different projects have different icon needs and aesthetic preferences. Supporting multiple high-quality MIT licensed icon libraries gives users more choice.

## Goal
Integrate popular, well-maintained MIT licensed icon libraries to expand the available icon selection.

## Candidate Libraries

### High Priority
- **Heroicons** (MIT) - Tailwind Labs, 292 icons, 2 styles (outline/solid)
- **Lucide** (ISC) - Community fork of Feather, 1000+ icons, actively maintained
- **Phosphor Icons** (MIT) - 6 weights, 1200+ icons, very comprehensive
- **Tabler Icons** (MIT) - 4600+ icons, pixel-perfect, stroke-based

### Medium Priority
- **Radix Icons** (MIT) - 318 icons, designed for UI consistency
- **Feather Icons** (MIT) - Classic, 287 icons, simple and clean
- **Bootstrap Icons** (MIT) - 1800+ icons, utility-focused
- **Remix Icon** (Apache 2.0) - 2800+ icons, multiple categories

### Specialty
- **Iconoir** (MIT) - Geometric, lightweight SVG icons
- **Teenyicons** (MIT) - Minimal 1px outline icons
- **css.gg** (MIT) - Pure CSS icons with SVG versions

## Implementation Considerations

### Data Structure
```typescript
interface IconLibrary {
  id: string;
  name: string;
  license: string;
  version: string;
  iconCount: number;
  styles: string[]; // outline, solid, etc.
  source: string; // GitHub URL
}
```

### Features Needed
- Library switcher in UI
- Multi-library search
- Filter by library
- Attribution/license display
- Automatic updates from upstream
- Consistent naming normalization

### Technical Approach
- Ingest icons during build process
- Store metadata in database
- Tag icons with library source
- Maintain original SVG paths
- Generate unified naming scheme

## Implementation Summary

### Completed Extractors (2026-01-19)

Created Python extractors for all target libraries:

1. **Heroicons** (`extractors/heroicons.py`)
   - Extracts from `@heroicons/react` package
   - Handles outline and solid variants
   - 292 icons total

2. **Tabler Icons** (`extractors/tabler.py`)
   - Extracts from `@tabler/icons` package
   - Stroke-based icons
   - 4600+ icons

3. **Radix Icons** (`extractors/radix.py`)
   - Extracts from `@radix-ui/react-icons` package
   - Fill-based icons, 15x15 viewBox
   - 318 icons

4. **Feather Icons** (`extractors/feather.py`)
   - Extracts from `feather-icons` package
   - Stroke-based, clean and simple
   - 287 icons

5. **Bootstrap Icons** (`extractors/bootstrap.py`)
   - Extracts from `bootstrap-icons` package
   - Fill-based with optional fill variants
   - 1800+ icons

6. **Remix Icon** (`extractors/remix.py`)
   - Extracts from `remixicon` package
   - Category-organized, line/fill variants
   - 2800+ icons

7. **Iconoir** (`extractors/iconoir.py`)
   - Extracts from `iconoir` package
   - Geometric stroke-based icons
   - Lightweight SVG

8. **Teenyicons** (`extractors/teenyicons.py`)
   - Extracts from `teenyicons` package
   - Minimal 1px outline icons, 15x15 viewBox
   - Outline and solid variants

9. **css.gg** (`extractors/cssgg.py`)
   - Extracts from `css.gg` package
   - Pure CSS icons with SVG versions
   - Fill-based

### Updated Files

- `extractor/extractors/__init__.py` - Exports all new extractors
- `extractor/main.py` - Added PACKAGES entries and extraction functions
- Command line supports: `--source heroicons`, `--source tabler`, etc.

### Completion Notes

- 7 libraries fully integrated: Lucide, Phosphor, Hugeicons, Heroicons, Tabler, Feather, Remix
- 11,364 icons total in database
- UI shows library filter badges with colored dots
- Normalized export formats for React, Vue, Svelte, raw SVG, and JSON
- Removed broken extractors: Radix, Iconoir, Teenyicons, css.gg, Bootstrap
