# Project Structure

**Kairo** is a chart-first calculation tool that treats charts as semantic objects, not just visualizations. This document provides a quick overview of how the project is organized.

---

## Architecture Overview

Kairo is built as a **pnpm monorepo** with two main workspaces:

```
kairo/
├── packages/core/          # Pure TypeScript calculation engine
└── apps/web/              # Full-stack web application
```

### Dependency Flow

The architecture enforces strict unidirectional dependencies:

```
core → server → client/domains → routes
```

- **Core**: Pure TypeScript, no React, no Node APIs, no database
- **Server**: Business logic, database access, chart evaluation
- **Client**: React components organized by domain
- **Routes**: Thin routing layer, no business logic

---

## Workspace Structure

### 📦 `packages/core/`

**Pure TypeScript calculation engine** - framework-agnostic DSL parser, validator, and evaluator.

```
core/
├── src/
│   ├── ast/                  # Abstract syntax tree nodes
│   │   ├── expression.ts
│   │   ├── literal.ts
│   │   ├── identifier.ts
│   │   ├── binary-expression.ts
│   │   └── function-call.ts
│   ├── domain/               # Chart domain model
│   │   └── chart.ts
│   ├── dsl/                  # DSL grammar and parser
│   │   ├── grammar.ts
│   │   └── parser.ts
│   ├── errors/               # Structured error types
│   │   ├── domain-error.ts
│   │   ├── parse-error.ts
│   │   ├── type-error.ts
│   │   └── function-error.ts
│   ├── evaluation/           # Expression evaluation engine
│   │   ├── evaluate-expression.ts
│   │   └── evaluate-chart.ts
│   ├── functions/            # Core transformation functions
│   │   ├── registry.ts
│   │   ├── moving-avg.ts
│   │   ├── shift.ts
│   │   ├── normalize.ts
│   │   ├── resample.ts
│   │   └── filter.ts
│   ├── validation/           # Multi-phase validation
│   │   ├── type-check.ts
│   │   ├── domain-check.ts
│   │   └── function-check.ts
│   └── index.ts
└── tests/                    # Core package tests
```

**Key principle**: This package must remain framework-agnostic—no React, no Node APIs, no database. Pure logic only.

---

### 🌐 `apps/web/`

**Full-stack TanStack Start application** with client and server code.

```
web/
├── src/
│   ├── client/               # Client-side code
│   │   ├── domains/          # Feature domains
│   │   │   ├── charts/       # Chart features
│   │   │   │   ├── components/
│   │   │   │   │   └── chart-view.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── use-chart.ts
│   │   │   │   └── layouts/
│   │   │   │       └── chart-workspace-layout.tsx
│   │   │   ├── expressions/  # Expression editor features
│   │   │   │   ├── components/
│   │   │   │   │   └── expression-editor.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── use-expression.ts
│   │   │   │   └── layouts/
│   │   │   │       └── expression-layout.tsx
│   │   │   └── example/      # Example domain structure
│   │   └── shared/           # Shared client utilities
│   │       ├── hooks/        # Reusable hooks
│   │       ├── lib/          # Utility functions
│   │       └── ui/           # shadcn/ui components
│   ├── server/               # Server-side code
│   │   ├── actions/          # Server actions
│   │   │   ├── evaluate-chart.ts
│   │   │   ├── load-chart.ts
│   │   │   └── save-chart.ts
│   │   ├── db/               # Database layer
│   │   │   ├── schema.prisma
│   │   │   ├── prisma.ts
│   │   │   └── prisma.config.ts
│   │   └── repositories/     # Data access layer
│   │       └── chart-repository.ts
│   ├── shared/               # Shared types
│   │   └── types.ts
│   └── routes/               # TanStack Router routes
│       ├── __root.tsx
│       └── index.tsx
└── tests/                    # Web app tests
```

**Client organization**:

- **Domains**: Features grouped by business domain (charts, expressions, etc.)
- **Components**: Domain-specific UI components
- **Hooks**: Domain-specific React hooks
- **Layouts**: Page-level layout components consumed by routes

**Server organization**:

- **Actions**: Server functions called from client
- **Repositories**: Database access patterns
- **DB**: Prisma schema and configuration

---

## Tech Stack

### Core Technologies

| Layer             | Technology               |
| ----------------- | ------------------------ |
| **Monorepo**      | pnpm workspaces          |
| **Language**      | TypeScript (strict mode) |
| **Framework**     | TanStack Start (React)   |
| **Routing**       | TanStack Router          |
| **Data Fetching** | TanStack Query           |
| **UI Framework**  | Tailwind CSS v4          |
| **UI Components** | shadcn/ui                |
| **Charts**        | Recharts                 |
| **Code Editor**   | CodeMirror 6             |
| **Parser**        | Chevrotain               |
| **Database**      | SQLite (via Prisma ORM)  |
| **Testing**       | Vitest                   |

### Key Libraries

- **@kairo/core**: Workspace reference to core package
- **Chevrotain**: Parser combinator library for DSL
- **Prisma**: Type-safe database ORM
- **CodeMirror 6**: Expression editor with syntax highlighting
- **Recharts**: Declarative chart library
- **shadcn/ui**: Accessible component library
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation

---

## Code Organization Patterns

### Import Aliases

**In `@kairo/web`**:

- `@kairo/core` - Core package
- `~/client/*` - Client code
- `~/server/*` - Server code
- `~/shared/*` - Shared types

**In `@kairo/core`**:

- Relative imports only (e.g., `./ast/expression`)

### File Naming

- **Files**: `kebab-case` (e.g., `chart-view.tsx`)
- **Types/Interfaces**: `PascalCase` with `I` prefix (e.g., `IChart`)
- **Variables/Functions**: `camelCase` (e.g., `evaluateChart`)

### Domain Structure

Each client domain follows this pattern:

```
domain-name/
├── components/          # UI components
├── hooks/              # Domain-specific hooks
├── layouts/            # Layout components
└── index.ts            # Public exports
```

Routes import layouts from domains—no business logic in routes.

---

## Build & Development

### Commands

```bash
# Install dependencies
pnpm install

# Development (web app)
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

### Package-Specific Commands

```bash
# Core package
pnpm --filter core build
pnpm --filter core test

# Web app
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web db:generate
pnpm --filter web db:push
```

---

## Architecture Principles

1. **Charts are first-class values** - operate on charts, not rows/cells
2. **Pure core package** - no side effects, deterministic evaluation
3. **Unidirectional dependencies** - core → server → client → routes
4. **Domain-driven client** - features organized by business domain
5. **Thin routes** - routing layer has no business logic
6. **Structured errors** - serializable, user-facing error messages
7. **Explicit over clever** - clear semantics, no magic
