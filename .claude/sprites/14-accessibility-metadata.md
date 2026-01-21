# Accessibility Metadata & ARIA Support

## Problem
Icons often lack proper accessibility metadata, making it difficult for screen reader users and others using assistive technologies to understand their meaning and purpose.

## Goal
Provide comprehensive accessibility metadata for all icons and generate accessible code with proper ARIA attributes.

## Metadata Structure

### Icon Accessibility Data
```typescript
interface IconA11yMetadata {
  // Human-readable description
  description: string;

  // Short label for screen readers
  ariaLabel: string;

  // Categories for context
  role: 'decorative' | 'informative' | 'interactive';

  // Suggested usage contexts
  usageContext: string[];

  // Alternative text suggestions
  altTextSuggestions: string[];

  // Color contrast data (for colored versions)
  contrastRatios?: {
    foreground: string;
    background: string;
    ratio: number;
    wcagLevel: 'AA' | 'AAA' | 'fail';
  };
}
```

### Example Metadata
```json
{
  "id": "arrow-right",
  "a11y": {
    "description": "An arrow pointing to the right, commonly used for forward navigation",
    "ariaLabel": "Next",
    "role": "interactive",
    "usageContext": [
      "Next page button",
      "Forward navigation",
      "Carousel next",
      "Expand/show more"
    ],
    "altTextSuggestions": [
      "Next",
      "Continue",
      "Go forward",
      "Next page"
    ]
  }
}
```

## Code Generation with A11y

### Decorative Icons
```jsx
// Icon is purely decorative (next to text)
<button>
  Next <ArrowRight aria-hidden="true" />
</button>
```

### Informative Icons
```jsx
// Icon conveys meaning without text
<button aria-label="Next page">
  <ArrowRight role="img" aria-label="Next" />
</button>
```

### Interactive Icons
```jsx
// Icon is the interactive element
<button
  aria-label="Download file"
  title="Download file"
>
  <Download role="img" />
</button>
```

## UI Features

### Accessibility Panel
```
┌─────────────────────────────────┐
│ Accessibility Information      │
├─────────────────────────────────┤
│ Role: Interactive              │
│ Suggested Label: "Next"        │
│                                │
│ Usage Context:                 │
│ • Next page button             │
│ • Forward navigation           │
│ • Carousel control             │
│                                │
│ Alternative Text:              │
│ ○ "Next"                       │
│ ○ "Continue"                   │
│ ○ "Go forward"                 │
│ ○ Custom: [________]           │
│                                │
│ Generated Code:                │
│ [View Examples ▼]              │
└─────────────────────────────────┘
```

### Export Options with A11y
```typescript
// Export with accessibility context
const options = {
  includeAriaLabel: true,
  includeTitle: true,
  includeRole: true,
  usageContext: 'button' // or 'decorative', 'standalone'
};

// Generates appropriate code
<ArrowRight
  role="img"
  aria-label="Next page"
  title="Go to next page"
/>
```

## A11y Features

### Automatic Checks
- ✅ Sufficient color contrast
- ✅ Proper ARIA attributes
- ✅ Semantic HTML usage
- ✅ Keyboard navigability hints
- ⚠️ Warnings for common mistakes

### Context-Aware Suggestions
```typescript
// Detect usage context and suggest appropriate A11y
if (iconUsedInButton && hasAdjacentText) {
  suggest('aria-hidden="true"');
} else if (iconUsedInButton && !hasAdjacentText) {
  suggest('aria-label="..."');
}
```

### Multi-Language Support
```json
{
  "ariaLabel": {
    "en": "Next",
    "es": "Siguiente",
    "fr": "Suivant",
    "de": "Weiter",
    "ja": "次へ"
  }
}
```

## Documentation & Education

### A11y Guide Section
- When to use `aria-hidden`
- When icons need labels
- Best practices for icon buttons
- Color contrast requirements
- Screen reader testing tips

### Code Examples Library
```typescript
// Common patterns
const patterns = {
  iconButton: `<button aria-label="..."><Icon /></button>`,
  decorative: `<span aria-hidden="true"><Icon /></span>`,
  informative: `<Icon role="img" aria-label="..." />`,
  withTooltip: `<Icon aria-describedby="tooltip-id" />`
};
```

### Testing Tools Integration
- Generate accessible example code
- Link to WAVE, axe, or Lighthouse
- Provide test cases
- Screen reader compatibility notes

## Database Schema
```sql
CREATE TABLE icon_a11y (
  icon_id VARCHAR PRIMARY KEY,
  description TEXT,
  aria_label VARCHAR,
  role VARCHAR,
  usage_contexts JSON,
  alt_text_suggestions JSON,
  translations JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Benefits
- Improved accessibility compliance
- Better SEO (semantic HTML)
- Enhanced UX for all users
- Educational resource
- Easier to meet WCAG standards
- Reduced accessibility bugs
