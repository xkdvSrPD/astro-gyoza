# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro Gyoza is a static blog template built with Astro and React. It features a custom markdown processing pipeline, dark mode support, and integrates with Giscus for comments.

## Development Commands

- `pnpm i` - Install dependencies
- `pnpm dev` - Start dev server at localhost:4321
- `pnpm build` - Type check, build site to ./dist/, and generate pagefind search index
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Format code with Prettier (also runs automatically via git hooks)
- `pnpm new-post` - Interactive CLI to create a new blog post
- `pnpm new-friend` - Interactive CLI to create a new friend link
- `pnpm new-project` - Interactive CLI to create a new project entry

### Multi-domain Deployment

The site URL can be overridden at build time to support deploying to multiple domains:

```bash
SITE_URL=https://example.com pnpm build
```

This overrides the default `site.url` from `src/config.json`. The override affects:

- Sitemap generation
- RSS feed links
- Open Graph meta tags
- Canonical URLs
- All absolute URLs in generated HTML

The site URL configuration is managed through:

- `astro.config.js` - Reads from `SITE_URL` environment variable
- `src/config.ts` - Exports merged config with env override support
- Components can access via `Astro.site` which reflects the configured URL

## Git Workflow

- Commits use conventional commits format (enforced by commitlint)
- Pre-commit hook runs prettier formatting on staged files
- Commit messages validated against @commitlint/config-conventional

## Architecture

### Content Collections

The site uses Astro content collections defined in `src/content/config.ts`:

- **posts**: Blog posts (markdown with frontmatter)
  - Note: `src/content/posts` is a symlink to `/home/violet/Code/transform-obsidian/output/content`
  - Fields: title, createAt, updateAt, summary, cover, category, tags, comments, draft, sticky
- **spec**: Special pages like "about" (markdown with frontmatter)
- **projects**: Project showcase entries (JSON data files)
- **friends**: Friend links (JSON data files)

### Markdown Processing Pipeline

Custom markdown processing uses both remark (markdown AST) and rehype (HTML AST) plugins:

**Remark plugins** (process markdown):

- `remarkMath` - Math notation support
- `remarkDirective` - Custom markdown directives
- `remarkEmbed` - Embed external content
- `remarkSpoiler` - Spoiler tags
- `remarkReadingTime` - Calculate reading time

**Rehype plugins** (process HTML):

- `rehypeHeadingIds` - Add IDs to headings
- `rehypeKatex` - Render math with KaTeX
- `rehypeLink` - Process links
- `rehypeImage` - Process images
- `rehypeHeading` - Heading enhancements
- `rehypeCodeBlock` - Code block wrapper processing
- `rehypeCodeHighlight` - Code syntax highlighting (Shiki)
- `rehypeTableBlock` - Table wrapper processing

All custom plugins are in `src/plugins/`. When modifying markdown rendering, update the appropriate plugin file.

### State Management

Uses Jotai for global state management. Atoms are defined in `src/store/`:

- `theme.ts` - Dark mode toggle state
- `viewport.ts` - Viewport/responsive state
- `scrollInfo.ts` - Scroll position tracking
- `modalStack.ts` - Modal/dialog stack management
- `metaInfo.ts` - Page metadata state

### Layout System

Three main layouts in `src/layouts/`:

- `Layout.astro` - Base layout with head, header, footer
- `MarkdownLayout.astro` - For markdown content (posts)
- `PageLayout.astro` - For static pages

### Component Organization

Components are organized by feature in `src/components/`:

- `comment/` - Giscus comment integration
- `footer/` - Site footer with uptime counter
- `head/` - Meta tags, SEO, analytics
- `head-gradient/` - Animated gradient background
- `header/` - Navigation and theme toggle
- `hero/` - Homepage hero section
- `post/` - Post-specific components (card, metadata, TOC)
- `provider/` - React context providers
- `ui/` - Reusable UI components (built with Radix UI)

### Styling

- Uses Tailwind CSS with custom theme defined in `tailwind.config.ts`
- Dynamic color scheme configured via `src/config.json` - supports 10 accent color pairs (light/dark)
- Custom styles in `src/styles/`

### Configuration

All site configuration is centralized in `src/config.json`:

- Site metadata (title, description, URL)
- Author info
- Navigation menus
- Color themes (10 accent color pairs for variety)
- Giscus comment settings
- Analytics integrations (Google Analytics, Umami, Microsoft Clarity)
- Footer start time for uptime counter

When making configuration changes, edit this file rather than hardcoding values.

### Page Transitions

Uses Swup for smooth page transitions between routes. Configuration in `astro.config.js` specifies:

- Animation class prefix: `swup-transition-`
- Container: `main` element
- Morph targets: Provider component (preserves React state)

### Search

Pagefind search index is generated during build (`pnpm build`). The index is excluded from Vite bundling via rollupOptions in `astro.config.js`.

## Path Aliases

TypeScript configured with `@/*` alias mapping to `src/*` - use for all imports.

## Important Notes

- Syntax highlighting is disabled at Astro level (`syntaxHighlight: false`) because custom Shiki implementation is used via rehype plugins
- The posts symlink means content may come from external source - be careful when modifying content structure
- Build process includes type checking (`astro check`) before building - fix type errors to complete build
