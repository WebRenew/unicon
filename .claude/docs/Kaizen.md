# Kaizen - Continuous Improvement Log

## Agent Recommendations

### 2026-01-22: Shared Event Listener Hook

**What was improved:**
- Added `useEventListener` hook for stable event subscriptions with latest handlers
- Refactored header and icon browser listeners to use the shared hook
- Logged localStorage read failures in `home-header` to avoid silent errors
- Split `metallic-icon-browser` into focused subcomponents to keep files under 500 lines

**Future kaizen opportunities:**
1. **Element ref support** - Accept `RefObject` targets for DOM element listeners
2. **EffectEvent adoption** - Prefer `useEffectEvent` once stabilized in React
3. **Usage docs** - Document the hook in component guidelines and examples

---

### 2026-01-20: Auto-invert Dark Brand Icons in Dark Mode

**What was improved:**
- Added color luminance detection utility using WCAG relative luminance formula
- Implemented automatic color inversion for dark brand icons (black, very dark colors) in dark mode
- Updated icon rendering across all components (icon-card, styled-icon, icon-preview)
- Dark brand icons now display as white in dark mode for visibility
- Maintains original brand colors for light/colorful icons

**Technical approach:**
- `isDarkColor()` calculates relative luminance (0-1 scale)
- Colors with luminance < 0.3 (darker than ~#777) are inverted in dark mode
- `getBrandIconColor()` returns white for dark colors in dark mode, original otherwise
- Integrates with next-themes `resolvedTheme` for theme detection

**Future kaizen opportunities:**
1. **User preference toggle** - Allow users to override auto-inversion per icon
2. **Gradient handling** - Detect and adapt icons with gradient fills
3. **Color palette extraction** - For multi-color brand icons, adapt entire palette
4. **Contrast ratio display** - Show WCAG contrast ratio in icon preview
5. **Custom inversion colors** - Let users choose inversion color (white, light gray, theme accent)

---

### 2026-01-20: LLMs.txt Documentation

**What was improved:**
- Created comprehensive LLMs.txt file for AI-friendly project documentation
- Documented project overview, tech stack, architecture, and database schema
- Detailed API routes, project structure, and development workflow
- Included code style guidelines from Agentic-Coder Ruleset
- Added common tasks, troubleshooting guide, and contribution guidelines
- Documented AI search implementation (embeddings, similarity search, synonyms)

**Future kaizen opportunities:**
1. **Add API examples** - Include curl/fetch examples for each API endpoint
2. **Expand troubleshooting** - Add more common issues and solutions as they arise
3. **Performance benchmarks** - Document expected performance metrics and optimization tips
4. **Video tutorials** - Create video guides for common workflows
5. **Keep updated** - Review LLMs.txt quarterly and update with new features/changes

---

### 2026-01-19: Context-Based Search Implementation

**What was improved:**
- Implemented context-based word linking with pre-computed synonyms (100+ term groups)
- Added client-side fuzzy search with scoring for instant results
- Created hybrid search combining semantic similarity with exact-match boosting
- Added optimistic UI pattern to show local results while API loads

**Future kaizen opportunities:**
1. **Expand synonym coverage** - Monitor search queries with low results and add missing synonym groups
2. **Learn from user behavior** - Track which icons users select for given queries to improve ranking
3. **Cache popular query embeddings** - Store embeddings for frequent searches to eliminate API calls entirely
4. **Enrich icon metadata** - Run a batch job to AI-generate richer descriptions/use-cases for each icon
5. **Add search analytics** - Log search queries and result counts to identify gaps in the synonym database

---

### 2026-01-19: Icon Display & Stroke Weight Presets

**What was improved:**
- Added responsive icon name display (tooltip on desktop, visible on mobile)
- Implemented stroke weight presets (Thin/Regular/Bold) with sleek segmented control UI
- Added localStorage persistence for user's preferred stroke weight
- Visual feedback with line stroke preview in preset buttons

**Future kaizen opportunities:**
1. **Add size presets** - Let users toggle icon grid size (compact/comfortable/large)
2. **Apply presets to bundle panel** - Ensure exported icons respect the selected stroke weight
3. **Per-library stroke defaults** - Auto-detect optimal stroke for each library (Phosphor uses fill, etc.)
4. **Keyboard shortcuts** - Allow 1/2/3 keys to quickly switch between presets
5. **Preview panel sync** - Consider syncing the preview panel controls with global presets
