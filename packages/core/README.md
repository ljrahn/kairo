# @kairo/core

Core semantic engine for Kairo: a small, chart‑first DSL with parsing, static validation, and deterministic evaluation.

This package is **pure TypeScript** with **no I/O or framework dependencies**. It can run in both browser and server environments and is designed to be shared between client and server to keep semantics in sync.

---

## What This Package Provides

- A **DSL** for writing expressions and simple programs over charts.
- A **typed AST** and multi‑phase validation:
  - Syntax (parse errors)
  - Type checking
  - Function‑level constraints
- A **program evaluator**:
  - Deterministic execution of assignment + expression statements
  - First‑class support for **time‑series charts**
  - Built‑in time‑series functions: `moving_avg`, `shift`, `normalize`, `align`, `resample`, `filter`, `now`
- A **chart domain model**:
  - `time | numeric | category` domains
  - Charts as **semantic series**: domain + points (no metadata)

The core engine knows nothing about data ingestion, storage, or visualization. It operates purely on charts you supply.

---

## Installation

In a workspace that depends on this package:

```bash
pnpm add @kairo/core
```

---

## Core Concepts

### Charts

A chart is a series of `(x, y)` points over a domain:

```ts
import {
  type IChart,
  type ITimeSeriesChart,
  createTimeDomain,
  createChart,
} from "@kairo/core";

const domain = createTimeDomain("UTC");

const points = [
  { x: new Date("2020-01-01T00:00:00Z"), y: 1 },
  { x: new Date("2020-01-01T00:01:00Z"), y: 2 },
  { x: new Date("2020-01-01T00:02:00Z"), y: 3 },
];

const chart: ITimeSeriesChart = createChart(domain, points);
```

The engine does **not** track names, descriptions, or units on charts. Those live in your application layer; the engine only cares about domain and points.

### DSL Programs

Programs are sequences of statements terminated by `;`:

- Assignment: `A = Revenue;`
- Expression: `Revenue + Expenses;`

Supported value kinds in the DSL:

- `number`
- `boolean`
- `string`
- `duration` (e.g. `2m`, `7d`, `1h`)
- `time`
- `chart<domain>`

Supported operators:

- Arithmetic: `+ - * /`
- Comparison: `> >= < <= ==`
- Boolean: `and`, `or`
- Unary: `!`, `-`

Assignments introduce **variables** whose types are inferred by the type checker, and whose runtime values are tracked by the evaluator.

---

## Running a Program

The main entry point is `runProgram`:

```ts
import {
  runProgram,
  type IProgramInputContext,
  type IProgramExecutionResult,
} from "@kairo/core";

const charts = new Map<string, IChart>();

// Provide a stable "now" function for reproducible results
const context: IProgramInputContext = {
  charts,
  now: () => new Date("2020-01-01T00:00:00Z"),
};

const source = "A = 1 + 2 * 3;";

const result: IProgramExecutionResult = runProgram(source, context);
```

### Input: `IProgramInputContext`

```ts
interface IProgramInputContext {
  readonly charts: ReadonlyMap<string, IChart>;
  readonly now: () => Date;
}
```

- `charts`: mapping from identifier name (e.g. `"Revenue"`) to an `IChart`. These are **input charts** supplied by your app.
- `now`: function returning the current time, used by time‑based constructs like `now()` and duration comparisons.

### Output: `IProgramExecutionResult`

`runProgram` returns a `neverthrow` `Result` with either success or a phase‑specific error:

```ts
import { ok, err, isOk, isErr } from "neverthrow"; // helpers, not required

if (result.isOk()) {
  const success = result.value; // IProgramExecutionSuccess
  // success.phase === "success"
  // success.ast is the parsed IProgram
  // success.context contains runtime values
} else {
  const error = result.error; // IProgramExecutionError
  // error.phase is one of:
  //   "parse" | "type-check" | "function-constraints" | "evaluation"
}
```

On success:

```ts
interface IProgramExecutionSuccess {
  readonly phase: "success";
  readonly ast: IProgram;
  readonly context: IEvalContext;
}

interface IEvalContext {
  readonly inputCharts: ReadonlyMap<string, IChart>; // same charts you passed in
  readonly now: () => Date; // same time provider
  readonly variables: ReadonlyMap<string, IRuntimeValue>;
  readonly derivedCharts: ReadonlyMap<string, IChart>; // charts created by the program
}
```

`derivedCharts` hold all chart values assigned during the program (e.g. `A = Revenue + 1;`).

---

## Examples

### 1. Simple Numeric Program

```ts
const source = "A = 1 + 2 * 3;"; // 1 + 6 = 7
const result = runProgram(source, context);

if (result.isOk()) {
  const { context: evalCtx } = result.value;
  const a = evalCtx.variables.get("A");
  // a?.kind === "number", a?.value === 7
}
```

### 2. Basic Chart Program

Given a time‑series chart named `Revenue` in the input context:

```ts
const revenueChart = createChart(domain, [
  { x: new Date("2020-01-01T00:00:00Z"), y: 1 },
  { x: new Date("2020-01-01T00:01:00Z"), y: 2 },
  { x: new Date("2020-01-01T00:02:00Z"), y: 3 },
  { x: new Date("2020-01-01T00:03:00Z"), y: 4 },
]);

const charts = new Map<string, IChart>([["Revenue", revenueChart]]);
const context: IProgramInputContext = {
  charts,
  now: () => new Date("2020-01-01T00:00:00Z"),
};

const source = "A = Revenue; B = moving_avg(A, 2m);";
const result = runProgram(source, context);

if (result.isOk()) {
  const derived = result.value.context.derivedCharts;

  const A = derived.get("A"); // same chart instance as Revenue
  const B = derived.get("B"); // smoothed chart

  // Example of expected values for B:
  // [1, 1.5, 2.5, 3.5]
  const values = B?.points.map((p) => p.y);
}
```

### 3. Chart Arithmetic

The engine supports arithmetic on aligned charts and chart‑scalar combinations:

```ts
// Assume charts map has charts A and B with the same time domain and timestamps
const context = { charts, now: () => new Date("2020-01-01T00:00:00Z") };

const source = "C = A + B; D = C * 2;";
const result = runProgram(source, context);

if (result.isOk()) {
  const derived = result.value.context.derivedCharts;
  const C = derived.get("C"); // chart, pointwise A + B
  const D = derived.get("D"); // chart, each y multiplied by 2
}
```

If the charts are **not aligned** (different domain type, time zone, or timestamp sequence), evaluation fails with an **evaluation error** in the `"evaluation"` phase, explaining that charts must be aligned first.

### 4. Time‑Series Functions

Supported built‑in time‑series functions are exposed via the DSL:

```ts
// align and resample
const source = `
  A = Revenue;
  B = align(A, to=Costs);
  C = resample(B, window=1h, method="mean");
`;

// moving average, shift, normalize
const source2 = `
  A = moving_avg(Revenue, 30m);
  B = shift(A, 1d);
  C = normalize(B);
`;

// filter with implicit time/value in the predicate
const source3 = `
  A = filter(Revenue, time >= now() - 30d);
  B = filter(A, value > 0);
`;
```

All of these functions are:

- Restricted to **time‑series charts** at the type level
- Validated by function‑specific constraints (e.g. duration > 0 where required)

### 5. Error Handling by Phase

You can branch on `error.phase` to decide how to surface issues:

- `"parse"`: syntax errors in the DSL (invalid tokens, missing `;`, etc.).
- `"type-check"`: type mismatches (e.g. `true + 1`, comparing incompatible types).
- `"function-constraints"`: semantic constraints on functions (e.g. invalid duration window for `moving_avg`).
- `"evaluation"`: runtime issues such as misaligned chart arithmetic.

Each error type carries structured information suitable for user‑facing diagnostics.

---

## What Is Not Supported (Today)

The core engine intentionally **does not** support:

- Non–time‑series chart functions (numeric and category domains are modeled but do not yet have domain‑specific functions).
- User‑defined functions or higher‑order functions.
- Lambdas / general closures (only implicit `time` and `value` inside `filter` predicates).
- Loops or mutation.
- Data ingestion (CSV, APIs, databases) or persistence.
- Visualization concerns (axis formatting, labels, color schemes, etc.).

These constraints keep the language small, predictable, and safe. The package focuses purely on **semantics**: given charts and a program, compute the result or explain why it is invalid.

---

## Testing & Guarantees

The core engine is covered by unit tests for:

- Parsing and AST construction
- Expression type checking and program type checking
- Function‑specific constraints
- Program‑level evaluation, including chart arithmetic and errors

Within these boundaries, you can treat `runProgram(source, context)` as a **pure, deterministic function** of `source`, `charts`, and `now()`. The same inputs always produce the same outputs (or the same errors).
