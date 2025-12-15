# Type Checking

## Overview

The type-checking system validates expressions to ensure type safety before evaluation.

## Type System

The DSL supports the following value types:

- `number` - Numeric literals and arithmetic results
- `boolean` - Boolean literals and comparison results
- `duration` - Time durations (e.g., `7d`, `1h`, `30m`)
- `chart<T>` - Chart objects with domain type T (`time` | `numeric` | `category`)

## Usage Example

```typescript
import { parse } from "../dsl/parser";
import { getExpressionType, ITypeCheckContext } from "../validation/type-check";
import { createChart } from "../domain/chart";

// Create some charts for context
const revenueChart = createChart({
  domain: { type: "time" },
  points: [
    /* ... */
  ],
  metadata: { name: "Revenue" },
});

// Set up type checking context
const context: ITypeCheckContext = {
  charts: new Map([["Revenue", revenueChart]]),
};

// Parse an expression
const parseResult = parse("moving_avg(Revenue, 7d)");

if (parseResult.isOk()) {
  const ast = parseResult.value;

  // Type check the expression
  const typeResult = getExpressionType(ast, context);

  if (typeResult.isOk()) {
    const type = typeResult.value;
    console.log(`Expression type:`, type);
    // Output: { kind: 'chart', domainType: 'time' }
  } else {
    const error = typeResult.error;
    console.error(error.userMessage);
  }
}
```

## Supported Operations

### Arithmetic (`+`, `-`, `*`, `/`)

- `number + number → number` ✅
- `chart + chart → chart` ❌ (Not supported in MVP)

### Comparison (`>`, `>=`, `<`, `<=`, `==`)

- `number > number → boolean` ✅
- `boolean == boolean → boolean` ✅

### Boolean (`and`, `or`, `not`)

- `boolean and boolean → boolean` ✅
- `boolean or boolean → boolean` ✅
- `not(boolean) → boolean` ✅

### Functions

#### Time-Series Functions

- `moving_avg(chart<time>, duration) → chart<time>` ✅
- `shift(chart<time>, duration) → chart<time>` ✅
- `normalize(chart<time>) → chart<time>` ✅
- `resample(chart<time>, duration, ...) → chart<time>` ✅

#### Filter Function

- `filter(chart<time>, boolean) → chart<time>` ✅
  - Inside predicates, `time` and `value` are implicit identifiers

#### Utility Functions

- `now() → number` ✅ (Returns current timestamp)

## MVP Limitations

1. **Chart arithmetic not supported**: Operations like `A + B` where A and B are charts will be rejected with a clear error message.

2. **Time-series only**: All chart functions only accept charts with `domain.type = 'time'`.

3. **No implicit conversions**: `A + 5` (chart + number) is rejected. Use functions like `map()` when available in future releases.

## Error Messages

Type errors provide structured information:

- Expected type(s)
- Actual type received
- Context (which operation/function failed)
- User-friendly message

Example error:

```
TypeError: Function 'moving_avg' requires a time-series chart, got numeric chart
```
