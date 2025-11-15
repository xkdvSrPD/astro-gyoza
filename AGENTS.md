# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src/`, with React UI under `src/components`, routes in `src/pages`, and shared layouts/styles inside `src/layouts` and `src/styles`. Content collections are stored in `src/content`, while SEO/config data resides in `src/config.json`. Static assets go in `public/`, and build tooling stays at the repo root (`astro.config.js`, `tailwind.config.ts`, `tsconfig.json`). Automation scripts such as `scripts/new-post.js` and `scripts/new-friend.js` scaffold new content.

## Build, Test, and Development Commands

Run `pnpm install` once to sync dependencies. Use `pnpm dev` for the Astro dev server on `http://localhost:4321`, and `pnpm build` to run `astro check`, compile the site into `dist/`, and build the Pagefind index. Validate the production bundle with `pnpm preview`. Format code via `pnpm lint` (Prettier) before pushing. If you need a quick sanity check, `pnpm astro check` runs Astro’s type and integration diagnostics without emitting output files.

## Coding Style & Naming Conventions

The repo targets TypeScript 5.x with module resolution defined in `tsconfig.json`. Follow Prettier defaults (2-space indent, semicolons, single quotes per config) and keep `.astro` files formatted with `prettier-plugin-astro`. React components and stores use PascalCase filenames (`PostCard.tsx`, `ThemeStore.ts`). Utility modules, hooks, and content collections use kebab-case or camelCase (`scroll-lock.ts`, `useReadingTime.ts`). Tailwind classes should remain in semantic groups (layout → spacing → color) to aid diff reviews.

## Testing Guidelines

There is no bespoke unit-test suite; rely on Astro’s diagnostics plus manual verification. Every feature PR should, at minimum, run `pnpm astro check` and `pnpm build` to ensure the Markdown content compiles, React islands hydrate, and Pagefind succeeds. When adding scripts or data migrations, include sample content under `src/content` that exercises the new logic, and describe any manual QA steps in the PR body.

## Commit & Pull Request Guidelines

Commits must follow Conventional Commits (`feat:`, `fix:`, `chore:`) because `@commitlint/config-conventional` enforces them via `simple-git-hooks`. Prefer small, focused commits referencing the affected directory (`feat(content): add math blocks`). Pull requests should include: a clear summary, linked issues (if any), screenshots or GIFs for UI changes, and a checklist of commands run (e.g., `pnpm build`). Keep the PR description updated as reviewers request changes.

## Configuration Tips

Site-wide metadata, menus, and social links live in `src/config.json`; edit this file instead of hardcoding values in components. Environment-sensitive secrets belong in `.env` files consumed by Astro—never commit API keys.
