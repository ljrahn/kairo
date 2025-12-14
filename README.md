# Kairo

A chart-first calculation tool that lets users perform arithmetic, transformations, and aggregations directly on charts to create new derived charts.

## Project Status

This is a **greenfield project** currently in the planning and setup phase. The project structure and configurations are in place, but implementation has not yet begun.

## Project Structure

This is a monorepo built with pnpm workspaces containing:

- **packages/core** - Pure TypeScript semantic engine (DSL parser, validation, evaluation)
- **apps/web** - TanStack Start web application

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Language**: TypeScript (strict mode)
- **Framework**: TanStack Start + React + TanStack Router + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **Editor**: CodeMirror 6
- **Parser**: Chevrotain
- **Database**: SQLite + Prisma ORM
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Set up database
cd apps/web
pnpm prisma generate
pnpm prisma db push
cd ../..
```

### Development

```bash
# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm --filter core dev
pnpm --filter web dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed architecture and folder structure
- [ROADMAP.md](./ROADMAP.md) - Product vision, principles, and roadmap
- [AGENTS.md](./AGENTS.md) - Guidelines for AI agents working on this project

## Architecture Principles

1. **Monorepo structure**: `packages/core/` (pure TS engine) + `apps/web/` (TanStack Start app)
2. **Dependency direction**: `core` → `server` → `client/domains` → `client/routes`
3. **Runtime separation**: Client never imports from server
4. **Core package rules**: No React, no Node APIs, no DB - pure TypeScript only
5. **Domain-driven UI**: Organize by domain, then by components
6. **Thin routes**: Routes contain no business logic

## License

TBD
