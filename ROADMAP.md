# ROADMAP.md

## Vision

Build a **chart‑first calculation tool** that lets users perform arithmetic,
transformations, and aggregations directly on charts to create new derived
charts.

This is **not** a BI tool, spreadsheet replacement, or reporting system.  
It is a _thinking and exploration tool_ where charts are first‑class inputs and
functions are composable, predictable, and fast.

The core differentiator is:

> Charts are treated as semantic objects, not just visualizations of tables.

---

## Product Principles

These principles guide all decisions:

1. **Charts are first‑class values**
   - Users operate on charts, not rows or cells.
2. **Explicit over clever**
   - If an operation’s meaning is unclear, it should be illegal.
3. **Constrained expressiveness**
   - The language is intentionally small to reduce errors and cognitive load.
4. **Correctness > completeness**
   - The system should refuse invalid operations loudly and clearly.
5. **Fast feedback loops**
   - Transformations should feel instant and exploratory.

---

## Scope Definition

### MVP / PoC Scope (Hard Boundary)

The PoC must:

- Support **time‑series charts only**
- Allow users to:
  - Define charts from imported data
  - Create derived charts using expressions
  - Apply a small set of core transformations
- Have a minimal DSL for expressions
- Run deterministically and reproducibly
- Be usable by a single user, locally or with minimal backend state

The PoC must **not**:

- Support non–time-series domains
- Do data ingestion from external APIs
- Do collaboration, sharing, or permissions
- Try to replace spreadsheets or BI tools
- Auto-infer ambiguous semantics

This boundary is critical to keep the system coherent.

---

## Core Data Model (Designed for Future Expansion)

Although the MVP only supports time series, the internal model must already
support other domain types.

### Chart (Core Abstraction)

A chart is defined as:

- **Domain**
  - `type`: `time | numeric | category`
- **Points**
  - An ordered collection of `(x, y)` pairs
- **Metadata**
  - Name, description, source, units, etc.

Conceptually:

```
Chart {
  domain: Domain
  points: Point[]
  metadata: ChartMetadata
}

Point {
  x: DomainValue
  y: number
}
```

### Why this matters now

- Time series → `domain.type = time`
- Future numeric charts → `domain.type = numeric`
- Future categorical charts → `domain.type = category`

Even though only `time` is implemented in MVP, **no code should assume time is
special** beyond domain‑specific functions.

---

## Expression Language (DSL)

### Purpose

The DSL exists to:

- Express transformations concisely
- Be safe, predictable, and domain-aware
- Avoid general-purpose programming complexity

### What the DSL Is

- A **pure, functional expression language**
- No side effects
- No mutation
- No loops
- No user-defined functions (initially)

### Supported Concepts (MVP)

#### Types

- `number`
- `boolean`
- `chart`

#### Operators

- Arithmetic: `+ - * /`
- Comparison: `> >= < <= ==`
- Boolean: `and`, `or`, `not`

#### Literals

- Numbers
- Durations (e.g. `7d`, `1h`, `30m`)

#### Identifiers

- Named charts (e.g. `A`, `Revenue`, `Users`)

---

### Core Functions (MVP)

Time‑series only:

- `moving_avg(chart, duration)`
- `shift(chart, duration)`
- `normalize(chart)`
- `resample(chart, duration, method)`
- `filter(chart, predicate)`

#### Filter Semantics

`filter` uses **implicit variables**, not lambdas:

Available identifiers inside `predicate`:

- `time`
- `value`

Examples:

```
filter(A, time >= now() - 30d)
filter(A, value > 0)
```

This avoids general lambda support while remaining expressive.

---

### Domain Awareness (Critical)

Each function explicitly declares:

- Supported domain types
- Output domain type

If a function is applied to an unsupported domain, it must fail with a clear
error.

---

## MVP Feature Set

### 1. Chart Creation

- Import time‑series data (CSV or JSON)
- Explicitly define:
  - Time field
  - Value field
  - Time zone
- No inference beyond basic validation

### 2. Expression Editor

- Text-based expression input
- Syntax highlighting and validation
- Clear, actionable error messages

### 3. Derived Charts

- Create charts from expressions
- Derived charts are immutable
- Expressions are stored and re-evaluated deterministically

### 4. Visualization

- Simple time‑series visualization
- Visualize original and derived charts
- Focus on clarity, not aesthetics

### 5. Execution Engine

- Deterministic evaluation
- Stable results given the same inputs
- No hidden state

---

## Client vs Server Responsibilities

### Client Responsibilities

- Expression editing and validation feedback
- Visualization of charts
- Managing local workspace state
- Optimistic evaluation for fast feedback (where possible)

The client should be capable of:

- Parsing expressions
- Building an AST
- Performing lightweight validation

---

### Server Responsibilities

- Canonical expression evaluation
- Source of truth for:
  - Chart data
  - Derived chart definitions
- Deterministic execution
- Validation and error reporting

The server ensures:

- Correctness
- Reproducibility
- Trust in results

---

### Shared Code (Strongly Recommended)

There should be a **shared core package** used by both client and server that
contains:

- DSL grammar / parser
- AST definitions
- Type system
- Domain rules
- Function registry
- Validation logic

This ensures:

- No divergence between client preview and server results
- Single source of truth for semantics
- Easier evolution of the language

Implementation-wise, this is a pure logic module with no I/O concerns.

---

## Parsing & Validation (High Level)

The DSL implementation should be:

- Grammar-driven
- Producing a typed AST
- Validated in multiple phases:
  1. Syntax validation
  2. Type checking
  3. Domain compatibility
  4. Function constraints

Validation should produce **structured, user-facing errors**, not generic
exceptions.

---

## Longer-Term Roadmap (Post-MVP)

### Phase 2: Domain Expansion

- Numeric-domain charts
- Categorical charts
- Domain-specific function extensions

### Phase 3: Chart Alignment

- Explicit alignment functions
- Safe cross-chart arithmetic
- Visual alignment previews

### Phase 4: UX Improvements

- Visual expression builder
- Function suggestions
- Inline previews of intermediate results

### Phase 5: Collaboration & Sharing

- Save and share workspaces
- Versioned expressions
- Auditability of derived charts

---

## Success Criteria for the PoC

The PoC is successful if:

- A technical user can import data and derive new insights in minutes
- Invalid operations are clearly rejected
- Users trust the math
- Iteration feels faster than spreadsheets
- The system feels _purpose-built_, not generic

---

## Final Notes

This project succeeds by **saying no** more often than yes.

The DSL is not a programming language.
The tool is not a BI platform.
The chart is not just a picture.

If those boundaries are respected, this has a real chance of becoming a
meaningful, marketable product.
