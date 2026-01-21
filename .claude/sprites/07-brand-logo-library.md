# Brand Logo Library Integration

## Problem
Developers frequently need brand logos (social media, company logos, service icons) but finding high-quality, consistent SVG versions is time-consuming.

## Goal
Integrate a comprehensive brand logo library with consistent styling and up-to-date logos.

## Primary Source

### Simple Icons (CC0 1.0 Universal)
- 3000+ brand icons
- Consistent monochrome SVGs
- Brand color hex codes included
- Actively maintained
- Free for any use

## Features

### Core Functionality
```typescript
// Search for brand logos
unicon search "github" --type brand
unicon search "social" --category brands

// Get with official brand color
unicon get github-logo --with-color
```

### Brand Metadata
```typescript
interface BrandIcon {
  name: string;
  slug: string;
  hex: string;        // Official brand color
  source: string;     // Simple Icons
  guidelines?: string; // Link to brand guidelines
  aliases: string[];  // e.g., "facebook" → "meta"
}
```

### UI Features
- Separate "Brands" category/section
- Color preview chips
- Link to brand guidelines
- Usage restrictions display
- Alternative names/aliases

## Additional Sources (Future)

### Other Collections
- **Flag Icons** (MIT) - Country flags
- **Cryptocurrency Icons** (CC0) - Crypto logos
- **Payment Icons** (MIT) - Payment provider logos
- **Vector Logo Zone** - Various brand vectors

## Legal Considerations
- Display trademark notices
- Link to brand usage guidelines
- Make clear distinction between icon license and trademark rights
- Include disclaimer about trademark usage
- Provide attribution where required

## Use Cases
- Social media links
- Partner/client logos
- Payment method icons
- Technology stack displays
- OAuth provider buttons
