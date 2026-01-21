# Contributing Guide

## Problem
Potential contributors don't know how to get started, what the development workflow is, or what contributions are welcome. This creates friction and reduces community participation.

## Goal
Create a comprehensive, welcoming contributing guide that makes it easy for anyone to contribute to Unicon, whether through code, design, documentation, or other means.

## CONTRIBUTING.md Structure

### Complete Guide
```markdown
# Contributing to Unicon

Thank you for your interest in contributing to Unicon! We welcome contributions from everyone.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/unicon.git`
3. Create a branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Push and create a Pull Request

## Ways to Contribute

### 🐛 Report Bugs
- Check existing issues first
- Use the bug report template
- Include reproduction steps
- Provide system information

### ✨ Suggest Features
- Check the roadmap
- Use the feature request template
- Explain the use case
- Describe expected behavior

### 💻 Write Code
- Fix open issues
- Implement new features
- Improve performance
- Add tests

### 📝 Improve Documentation
- Fix typos and errors
- Add examples
- Clarify confusing sections
- Write tutorials

### 🎨 Design Contributions
- Improve UI/UX
- Create icons
- Design mockups
- Provide feedback

### 🌍 Translations
- Add new languages
- Improve existing translations
- Review translation accuracy

## Development Setup

### Prerequisites
- Node.js 18+ and pnpm 8+
- PostgreSQL 14+
- Git

### Installation
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
pnpm db:setup

# Run development server
pnpm dev
```

### Project Structure
```
unicon/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── lib/          # Utilities and helpers
│   └── hooks/        # Custom React hooks
├── public/           # Static assets
├── prisma/           # Database schema
└── tests/            # Test files
```

## Development Workflow

### 1. Create an Issue
- Describe what you want to work on
- Get feedback from maintainers
- Wait for approval before starting work

### 2. Write Code
- Follow the coding guidelines
- Write tests for new features
- Update documentation
- Keep commits focused and atomic

### 3. Test Your Changes
```bash
# Run tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run all checks
pnpm check
```

### 4. Submit Pull Request
- Fill out the PR template completely
- Link related issues
- Request review from maintainers
- Address review feedback

## Coding Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types alongside implementations

### React
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into hooks
- Avoid prop drilling (use context when needed)

### Styling
- Use Tailwind CSS utility classes
- Follow existing design patterns
- Ensure responsive design
- Support dark mode

### Performance
- Minimize re-renders
- Use proper React.memo() and useMemo()
- Lazy load components when appropriate
- Optimize images and assets

### Accessibility
- Use semantic HTML
- Include ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(search): add context-based synonym matching

Implements intelligent search that expands queries with related terms.
For example, searching "car" now also finds "automotive" icons.

Closes #123

---

fix(theme): resolve hydration mismatch on theme toggle

The theme toggle was causing a hydration error on mobile devices
due to mismatched server/client rendering.

Fixes #145

---

docs(contributing): add section on commit conventions

Clarifies the expected commit message format for contributors.
```

## Pull Request Process

### Before Submitting
- ✅ Code follows style guidelines
- ✅ Tests pass locally
- ✅ Types are correct
- ✅ Documentation is updated
- ✅ Commit messages follow convention
- ✅ Branch is up to date with main

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe how you tested this

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Tests pass
- [ ] Types are correct
- [ ] Documentation updated
- [ ] Follows code style
```

### Review Process
1. Automated checks run (CI/CD)
2. Maintainer reviews code
3. Address feedback
4. Maintainer approves
5. PR is merged

### After Merge
- Your contribution appears in the changelog
- You're added to contributors list
- Feature ships in next release

## Testing Guidelines

### Unit Tests
```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { searchIcons } from '@/lib/search';

describe('searchIcons', () => {
  it('should find icons by exact match', () => {
    const results = searchIcons('arrow-right');
    expect(results).toContain('arrow-right');
  });

  it('should find icons by synonym', () => {
    const results = searchIcons('car');
    expect(results).toContain('automotive');
  });
});
```

### Integration Tests
```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('user can search for icons', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search-input"]', 'arrow');

  const results = page.locator('[data-testid="icon-card"]');
  await expect(results).toHaveCount.greaterThan(0);
});
```

## Documentation Standards

### Code Comments
```typescript
// ✅ Good: Explains WHY
// Cache results to avoid redundant API calls during the same session
const cache = new Map();

// ❌ Bad: Explains WHAT (obvious from code)
// Create a new Map
const cache = new Map();
```

### JSDoc
```typescript
/**
 * Searches for icons matching the given query
 *
 * @param query - The search term
 * @param options - Search options
 * @returns Array of matching icon IDs
 *
 * @example
 * ```ts
 * const icons = searchIcons('arrow', { limit: 10 });
 * ```
 */
export function searchIcons(
  query: string,
  options?: SearchOptions
): string[] {
  // ...
}
```

## Issue Labels

We use labels to organize issues:

- `good first issue` - Great for newcomers
- `help wanted` - Looking for contributors
- `bug` - Something isn't working
- `feature` - New feature request
- `documentation` - Documentation improvements
- `enhancement` - Improvement to existing feature
- `question` - Further information requested
- `wontfix` - This won't be worked on

## Community

### Where to Get Help
- 💬 [GitHub Discussions](https://github.com/user/unicon/discussions)
- 🐛 [GitHub Issues](https://github.com/user/unicon/issues)
- 🐦 [Twitter](https://twitter.com/unicon)
- 💼 [Discord](https://discord.gg/unicon)

### Recognition
We appreciate all contributors! Your contributions will be:
- Listed in CHANGELOG.md
- Displayed on the website contributors page
- Mentioned in release notes
- Immortalized in git history

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! Open a discussion or reach out to maintainers.

Happy contributing! 🎉
```

## Additional Files

### CODE_OF_CONDUCT.md
```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone...

[Full Contributor Covenant text]
```

### .github/PULL_REQUEST_TEMPLATE.md
```markdown
## Description
<!-- Describe your changes in detail -->

## Motivation and Context
<!-- Why is this change required? What problem does it solve? -->

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
<!-- Describe how you tested your changes -->

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### .github/ISSUE_TEMPLATE/bug_report.md
```markdown
---
name: Bug report
about: Create a report to help us improve
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS]
 - Browser: [e.g. chrome, safari]
 - Version: [e.g. 22]

**Additional context**
Any other context about the problem.
```

### .github/ISSUE_TEMPLATE/feature_request.md
```markdown
---
name: Feature request
about: Suggest an idea for this project
---

**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## Implementation Checklist

- [ ] Create CONTRIBUTING.md
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Add PR template
- [ ] Add issue templates
- [ ] Set up GitHub labels
- [ ] Create contributors page on website
- [ ] Document development setup
- [ ] Add "Contributing" link to footer
- [ ] Set up Discord/discussion forum
- [ ] Create first "good first issue" tasks
