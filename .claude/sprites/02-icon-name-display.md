# Display Icon Names

**Status:** ✅ Implemented

## Problem
Icon names are not currently displayed in the library, making it harder for users to identify specific icons or understand what they represent.

## Goal
Show icon names in a way that keeps the UI clean while providing necessary information.

## Requirements

### Desktop
- Show icon name on hover (tooltip or overlay)
- Keep the default view clean without text clutter

### Mobile
- Display icon name directly underneath each icon
- Always visible (no hover state on mobile)
- Ensure text is readable and doesn't overflow

## Implementation Considerations
- Use CSS hover states for desktop
- Use media queries to switch between hover and always-visible display
- Consider text truncation/ellipsis for long icon names
- Ensure consistent typography and spacing
- May need to adjust icon grid sizing on mobile to accommodate text

---

## Implementation Summary (Completed)

### Files Modified
- `src/components/icons/icon-card.tsx` - Responsive icon card with tooltip + visible name

### Key Features
1. **Desktop (md+)**: Clean icon-only view with tooltip on hover showing the icon name
2. **Mobile (<md)**: Icon name and library badge always visible underneath the icon
3. **Responsive sizing**: Slightly smaller padding/gaps on mobile to accommodate text
4. **Text truncation**: Long icon names are truncated with ellipsis

### Behavior
- Desktop: Hover over icon → tooltip shows `icon-name`
- Mobile: Icon name visible below icon at all times (no hover interaction needed)
