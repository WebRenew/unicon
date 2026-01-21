# Public Roadmap

## Problem
Users and contributors don't have visibility into what features are planned, what's being worked on, or how to influence the product direction.

## Goal
Create a transparent, interactive public roadmap that shows planned features, current progress, and allows community input on priorities.

## Roadmap Structure

### Status Categories
- **✅ Shipped** - Live in production
- **🚧 In Progress** - Currently being built
- **📋 Planned** - Committed to building
- **💡 Under Consideration** - Exploring feasibility
- **🗳️ Community Voted** - Requested by users

### Time Horizons
- **Now** - Current sprint (2 weeks)
- **Next** - Next 1-2 months
- **Later** - Next 3-6 months
- **Future** - No timeline yet

## Roadmap Page Design

### Main View
```
┌─────────────────────────────────────────────────┐
│  Unicon Roadmap                                 │
│  Help us build the future of icons              │
│                                                 │
│  [Now] [Next] [Later] [Future] [All]          │
├─────────────────────────────────────────────────┤
│                                                 │
│  🚧 In Progress                                │
│  ┌─────────────────────────────────┐          │
│  │ ✨ Icon Customization Studio    │          │
│  │ Visual editor for icons         │          │
│  │ 👍 234 votes  💬 12 comments    │          │
│  └─────────────────────────────────┘          │
│                                                 │
│  📋 Planned (Next)                             │
│  ┌─────────────────────────────────┐          │
│  │ 🎨 Figma Plugin                 │          │
│  │ Search and insert icons in...   │          │
│  │ 👍 189 votes  💬 8 comments     │          │
│  └─────────────────────────────────┘          │
│                                                 │
│  💡 Under Consideration                        │
│  ┌─────────────────────────────────┐          │
│  │ 🤖 AI Icon Generation           │          │
│  │ Generate custom icons with AI   │          │
│  │ 👍 567 votes  💬 45 comments    │          │
│  └─────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
```

### Feature Detail Page
```
┌─────────────────────────────────────────────────┐
│  ← Back to Roadmap                              │
│                                                 │
│  🎨 Figma Plugin                               │
│  📋 Planned for Q2 2026                        │
│                                                 │
│  Search and insert icons directly into Figma   │
│  designs without leaving your workspace.       │
│                                                 │
│  👍 189 votes   [👍 Upvote]                    │
│                                                 │
│  Why we're building this:                      │
│  Designers need quick access to icons without  │
│  context switching. This plugin will...        │
│                                                 │
│  What's included:                              │
│  ✓ Icon search within Figma                   │
│  ✓ Drag and drop insertion                    │
│  ✓ Customization controls                     │
│  ✓ Bundle sync                                 │
│                                                 │
│  💬 Discussion (8)                             │
│  ┌─────────────────────────────────┐          │
│  │ @user1: Will this support...    │          │
│  │ @dev: Yes, we plan to...        │          │
│  └─────────────────────────────────┘          │
│                                                 │
│  [Subscribe to Updates]                        │
└─────────────────────────────────────────────────┘
```

## Data Structure

### Roadmap Item
```typescript
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'shipped' | 'in-progress' | 'planned' | 'consideration';
  category: 'feature' | 'integration' | 'improvement' | 'infrastructure';
  timeframe: 'now' | 'next' | 'later' | 'future';

  // Community engagement
  votes: number;
  commentCount: number;

  // Progress tracking
  progress?: number; // 0-100
  startDate?: Date;
  targetDate?: Date;
  shippedDate?: Date;

  // Related items
  relatedTo?: string[];
  dependencies?: string[];

  // Additional context
  rationale?: string;
  scope?: string[];
  links?: {
    discussion?: string;
    pr?: string;
    docs?: string;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  author?: string;
}
```

## Interactive Features

### Voting System
```typescript
// Users can upvote features
<button onClick={() => vote(item.id)}>
  👍 {item.votes}
</button>

// Voting weight
- Anonymous: 1 vote per IP
- Logged in: 1 vote per user
- Contributors: 2x weight
- Sponsors: 3x weight
```

### Comments & Discussion
- Threaded discussions on each item
- Subscribe to updates
- Tag maintainers
- Markdown support
- Reactions (👍 ❤️ 🎉 🚀)

### Filtering & Search
```typescript
// Filter options
filters = {
  status: ['shipped', 'in-progress', 'planned'],
  category: ['feature', 'integration', 'improvement'],
  timeframe: ['now', 'next', 'later'],
  sort: 'votes' | 'recent' | 'trending'
};
```

### Notifications
- Email when item status changes
- Updates when maintainers comment
- Shipped announcements
- RSS feed for roadmap updates

## Integration Points

### From Sprites Folder
```typescript
// Auto-populate roadmap from sprites
// Each sprite becomes a roadmap item
const sprites = await loadSprites('.claude/sprites/*.md');
const roadmapItems = sprites.map(spriteToRoadmapItem);
```

### GitHub Integration
```typescript
// Sync with GitHub issues/projects
roadmapItem.links = {
  discussion: 'https://github.com/user/unicon/discussions/123',
  issue: 'https://github.com/user/unicon/issues/456',
  pr: 'https://github.com/user/unicon/pull/789'
};
```

### Changelog Connection
```typescript
// When item ships, auto-create changelog entry
onStatusChange(item, 'shipped', async () => {
  await createChangelogEntry({
    version: nextVersion,
    features: [item.title],
    date: new Date()
  });
});
```

## Public API

### Endpoints
```http
GET /api/roadmap
GET /api/roadmap/{id}
POST /api/roadmap/{id}/vote
POST /api/roadmap/{id}/comments
GET /api/roadmap/trending
```

### Embeddable Widget
```html
<!-- Embed roadmap on other sites -->
<iframe src="https://unicon.dev/roadmap/embed" />

<!-- Or use JavaScript widget -->
<script src="https://unicon.dev/widgets/roadmap.js"></script>
<div id="unicon-roadmap"></div>
```

## Content Strategy

### Initial Population
- Import sprites as roadmap items
- Mark completed items as shipped
- Add target dates for planned items
- Write clear rationales

### Maintenance
- Weekly updates
- Monthly roadmap review
- Quarterly planning sessions
- Community feedback incorporation

### Transparency
- Explain why features are deprioritized
- Share technical constraints
- Discuss trade-offs openly
- Celebrate community contributions

## Analytics

### Track Engagement
- Most voted features
- Most discussed items
- Trending topics
- User sentiment analysis

### Influence Product
- Use votes to inform priorities
- Analyze comment themes
- Identify pain points
- Validate assumptions

## Implementation Options

### Quick Win (MVP)
- GitHub Projects board (public)
- Link from main site
- Manual updates

### Medium (Custom Page)
- Next.js page at `/roadmap`
- Store data in database
- Basic voting/comments
- Status filters

### Advanced (Full Platform)
- Dedicated roadmap app
- Real-time updates
- Advanced analytics
- AI-powered insights
- Multi-language support

## Examples to Study
- Linear Roadmap
- GitHub Public Roadmap
- Vercel Roadmap
- Canny.io
- ProductBoard
