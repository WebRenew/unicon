# Unicon Project Rules

## Reminders

**Team Bundle Sharing (added 2025-01-25):**
Implement rate limiting + bundle-specific MCP for Pro team sharing. Two tasks:
1. Add Upstash rate limiting for `/b/*` and `/api/bundles/*` endpoints
2. Create `/api/mcp/b/[share_slug]` - scoped MCP that only exposes bundle icons

Context: Pro users share bundles via public link. Teams using AI tools (Claude, Cursor) need an MCP config they can copy that scopes to their curated bundle. Rate limit to prevent abuse.

## Icons

**NEVER use emojis in the UI.** Always use icon components from `@/components/icons/ui/`.

All icons must be:
1. Imported from `@/components/icons/ui/[icon-name].tsx`
2. React components following the standard Unicon pattern
3. Named with `Icon` suffix (e.g., `SearchIcon`, `PackageIcon`)

### Adding New Icons

Create icon components in `src/components/icons/ui/` following this pattern:

```tsx
import { SVGProps } from "react";

export function IconNameIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {/* SVG paths */}
    </svg>
  );
}
```

### Prohibited

- No emojis (🎯, ⚡, 🤖, etc.) in UI components
- No external icon libraries (lucide-react, heroicons, react-icons, etc.)
- No inline SVGs without extracting to a component

## Code Style

- TypeScript preferred
- Functional components with hooks
- Tailwind CSS for styling
- Use `cn()` from `@/lib/utils` for conditional classes
