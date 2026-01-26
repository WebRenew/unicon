# Unicon Project Rules

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
