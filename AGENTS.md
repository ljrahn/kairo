# Agent Guidelines for Kairo

## Build/Test Commands (Future)

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm test path/to/test.test.ts` - Run single test file
- `pnpm --filter core build` - Build core package only
- `pnpm --filter web dev` - Run web app in dev mode

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Language**: TypeScript (strict mode)
- **Framework**: TanStack Start + React + TanStack Router + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **Editor**: CodeMirror 6
- **Parser**: Chevrotain
- **Database**: SQLite + Prisma ORM
- **Testing**: Vitest (when implemented)

## Architecture Rules (Critical)

1. **Monorepo structure**: `packages/core/` (pure TS engine) + `apps/web/` (TanStack Start app)
2. **Dependency direction**: `core` → `server` → `client/domains/*/components` → `client/domains/*/layouts` → `client/routes`
3. **Core package rules**: No React, no Node APIs, no DB, no framework imports - pure TypeScript only
4. **Thin routes**: `routes/` contains no business logic, only imports layouts from domains

## Code Style

- **Imports**: in `@kario/web` use workspace alias for core: `@kairo/core`, and use path aliases inside the web app: `~/client/charts/*`,
  `~/client/hooks`, `~/client/lib`, `~/client/ui`. in `@kairo/core` use relative imports in all packages.
- **Formatting**: Prettier + ESLint (to be configured)
- **Types**: Strict TypeScript, no `any`, explicit return types for public APIs. All interfaces/types should be prepended with `I`
- **Naming**: camelCase for variables/functions, PascalCase for types/classes, kebab-case for files
- **Error handling**: Use structured error classes in `core/errors/`, serializable and user-facing
- **Functions**: Pure functions in core, no side effects, deterministic evaluation
- **Comments**: Don't overrwrite comments. It makes source code less readable. Just write comments around neccessary complex parts that need explanation.
  also small docstrings for functions and classes.

## Project Vision

Chart-first calculation tool with custom DSL. Charts are semantic objects, not just visualizations. MVP: time-series only, 5 core functions (moving_avg, shift, normalize, resample, filter).
