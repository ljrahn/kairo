import { ok, err, Result } from "neverthrow";
import type { IExpression } from "../../ast/expression";
import type { ILiteral } from "../../ast/literal";
import type { IIdentifier } from "../../ast/identifier";
import type {
  IBinaryExpression,
  IBinaryOperator,
} from "../../ast/binary-expression";
import type { IFunctionCall } from "../../ast/function-call";
import type { IValueType, IChart } from "../../domain";
import { TypeError } from "./type-error";

/**
 * Context for type checking - maps identifier names to their chart values
 */
export interface ITypeCheckContext {
  readonly charts: ReadonlyMap<string, IChart>;
}

/**
 * Infers the type of an expression given a context of available charts.
 * Returns a Result containing either the inferred type or a TypeError.
 */
export function getExpressionType(
  expr: IExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeError> {
  switch (expr.kind) {
    case "Literal":
      return getLiteralType(expr);
    case "Identifier":
      return getIdentifierType(expr, context);
    case "BinaryExpression":
      return getBinaryExpressionType(expr, context);
    case "FunctionCall":
      return getFunctionCallType(expr, context);
    default:
      return err(
        TypeError.mismatch(
          { kind: "unknown" },
          { kind: "unknown" },
          "unknown expression kind"
        )
      );
  }
}

function getLiteralType(expr: ILiteral): Result<IValueType, TypeError> {
  switch (expr.literalType) {
    case "number":
      return ok({ kind: "number" });
    case "boolean":
      return ok({ kind: "boolean" });
    case "duration":
      return ok({ kind: "duration" });
    default:
      return err(
        TypeError.mismatch(
          { kind: "unknown" },
          { kind: "unknown" },
          "unknown literal type"
        )
      );
  }
}

function getIdentifierType(
  expr: IIdentifier,
  context: ITypeCheckContext
): Result<IValueType, TypeError> {
  const chart = context.charts.get(expr.name);

  if (!chart) {
    return err(
      new TypeError(
        `Unknown identifier: ${expr.name}`,
        `Chart or variable '${expr.name}' not found`,
        { kind: "unknown" },
        { kind: "unknown" },
        `identifier '${expr.name}'`
      )
    );
  }

  return ok({ kind: "chart", domainType: chart.domain.type });
}

function isArithmeticOperator(
  op: IBinaryOperator
): op is "+" | "-" | "*" | "/" {
  return op === "+" || op === "-" || op === "*" || op === "/";
}

function isComparisonOperator(
  op: IBinaryOperator
): op is ">" | ">=" | "<" | "<=" | "==" {
  return op === ">" || op === ">=" || op === "<" || op === "<=" || op === "==";
}

function isBooleanOperator(op: IBinaryOperator): op is "and" | "or" {
  return op === "and" || op === "or";
}

function getBinaryExpressionType(
  expr: IBinaryExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeError> {
  const leftResult = getExpressionType(expr.left, context);
  const rightResult = getExpressionType(expr.right, context);

  if (leftResult.isErr()) return leftResult;
  if (rightResult.isErr()) return rightResult;

  const leftType = leftResult.value;
  const rightType = rightResult.value;

  // Arithmetic operators: +, -, *, /
  if (isArithmeticOperator(expr.operator)) {
    // For MVP: Only allow numeric arithmetic, reject chart arithmetic
    if (leftType.kind === "number" && rightType.kind === "number") {
      return ok({ kind: "number" });
    }

    // Chart arithmetic not supported in MVP
    if (leftType.kind === "chart" || rightType.kind === "chart") {
      return err(
        new TypeError(
          `Chart arithmetic not yet supported: ${expr.operator}`,
          `Operator '${expr.operator}' does not support chart operands yet. This feature is coming in a future release.`,
          { kind: "number" },
          leftType,
          `operator '${expr.operator}'`
        )
      );
    }

    return err(TypeError.operator(expr.operator, leftType, rightType));
  }

  // Comparison operators: >, >=, <, <=, ==
  if (isComparisonOperator(expr.operator)) {
    // Can compare numbers
    if (leftType.kind === "number" && rightType.kind === "number") {
      return ok({ kind: "boolean" });
    }

    // Can compare booleans for equality
    if (
      expr.operator === "==" &&
      leftType.kind === "boolean" &&
      rightType.kind === "boolean"
    ) {
      return ok({ kind: "boolean" });
    }

    return err(TypeError.operator(expr.operator, leftType, rightType));
  }

  // Boolean operators: and, or
  if (isBooleanOperator(expr.operator)) {
    if (leftType.kind === "boolean" && rightType.kind === "boolean") {
      return ok({ kind: "boolean" });
    }

    return err(TypeError.operator(expr.operator, leftType, rightType));
  }

  return err(TypeError.operator(expr.operator, leftType, rightType));
}

function getFunctionCallType(
  expr: IFunctionCall,
  context: ITypeCheckContext
): Result<IValueType, TypeError> {
  // Special handling for 'not' (unary boolean operator represented as function)
  if (expr.name === "not") {
    if (expr.args.length !== 1) {
      return err(
        new TypeError(
          `Function 'not' expects 1 argument, got ${expr.args.length}`,
          `Function 'not' requires exactly 1 argument`,
          { kind: "boolean" },
          { kind: "unknown" },
          "not function"
        )
      );
    }

    const arg = expr.args[0];
    if (!arg) {
      return err(
        new TypeError(
          `Function 'not' expects 1 argument`,
          `Function 'not' requires exactly 1 argument`,
          { kind: "boolean" },
          { kind: "unknown" },
          "not function"
        )
      );
    }

    const argResult = getExpressionType(arg, context);
    if (argResult.isErr()) return argResult;

    const argType = argResult.value;
    if (argType.kind !== "boolean") {
      return err(
        TypeError.argument(expr.name, 0, { kind: "boolean" }, argType)
      );
    }

    return ok({ kind: "boolean" });
  }

  // Time-series functions: moving_avg, shift, normalize, resample
  if (
    expr.name === "moving_avg" ||
    expr.name === "shift" ||
    expr.name === "normalize" ||
    expr.name === "resample"
  ) {
    // These functions take a chart as first argument and return a chart
    if (expr.args.length === 0) {
      return err(
        new TypeError(
          `Function '${expr.name}' requires at least 1 argument`,
          `Function '${expr.name}' requires a chart as first argument`,
          { kind: "chart", domainType: "time" },
          { kind: "unknown" },
          `${expr.name} function`
        )
      );
    }

    const firstArg = expr.args[0];
    if (!firstArg) {
      return err(
        new TypeError(
          `Function '${expr.name}' requires at least 1 argument`,
          `Function '${expr.name}' requires a chart as first argument`,
          { kind: "chart", domainType: "time" },
          { kind: "unknown" },
          `${expr.name} function`
        )
      );
    }

    const firstArgResult = getExpressionType(firstArg, context);
    if (firstArgResult.isErr()) return firstArgResult;

    const firstArgType = firstArgResult.value;
    if (firstArgType.kind !== "chart") {
      return err(
        TypeError.argument(
          expr.name,
          0,
          { kind: "chart", domainType: "time" },
          firstArgType
        )
      );
    }

    // For MVP: Only support time-series charts
    if (firstArgType.domainType !== "time") {
      return err(
        new TypeError(
          `Function '${expr.name}' only supports time-series charts`,
          `Function '${expr.name}' requires a time-series chart, got ${firstArgType.domainType} chart`,
          { kind: "chart", domainType: "time" },
          firstArgType,
          `${expr.name} function`
        )
      );
    }

    // Return same chart type (time-series)
    return ok({ kind: "chart", domainType: "time" });
  }

  // Filter function
  if (expr.name === "filter") {
    if (expr.args.length !== 2) {
      return err(
        new TypeError(
          `Function 'filter' expects 2 arguments, got ${expr.args.length}`,
          `Function 'filter' requires exactly 2 arguments: chart and predicate`,
          { kind: "chart", domainType: "time" },
          { kind: "unknown" },
          "filter function"
        )
      );
    }

    const firstArg = expr.args[0];
    const secondArg = expr.args[1];

    if (!firstArg || !secondArg) {
      return err(
        new TypeError(
          `Function 'filter' expects 2 arguments`,
          `Function 'filter' requires exactly 2 arguments: chart and predicate`,
          { kind: "chart", domainType: "time" },
          { kind: "unknown" },
          "filter function"
        )
      );
    }

    // First argument should be a chart
    const firstArgResult = getExpressionType(firstArg, context);
    if (firstArgResult.isErr()) return firstArgResult;

    const firstArgType = firstArgResult.value;
    if (firstArgType.kind !== "chart") {
      return err(
        TypeError.argument(
          expr.name,
          0,
          { kind: "chart", domainType: "time" },
          firstArgType
        )
      );
    }

    // For MVP: Only support time-series charts
    if (firstArgType.domainType !== "time") {
      return err(
        new TypeError(
          `Function 'filter' only supports time-series charts`,
          `Function 'filter' requires a time-series chart, got ${firstArgType.domainType} chart`,
          { kind: "chart", domainType: "time" },
          firstArgType,
          "filter function"
        )
      );
    }

    // Second argument (predicate) should evaluate to boolean
    // Note: The predicate will have access to implicit 'time' and 'value' identifiers
    // We'll need to handle this specially during evaluation
    const secondArgResult = getExpressionType(secondArg, context);
    if (secondArgResult.isErr()) return secondArgResult;

    const secondArgType = secondArgResult.value;
    if (secondArgType.kind !== "boolean") {
      return err(
        TypeError.argument(expr.name, 1, { kind: "boolean" }, secondArgType)
      );
    }

    // Returns same chart type
    return ok({ kind: "chart", domainType: "time" });
  }

  // now() function - returns a number (timestamp)
  if (expr.name === "now") {
    if (expr.args.length !== 0) {
      return err(
        new TypeError(
          `Function 'now' expects 0 arguments, got ${expr.args.length}`,
          `Function 'now' does not take any arguments`,
          { kind: "number" },
          { kind: "unknown" },
          "now function"
        )
      );
    }

    return ok({ kind: "number" });
  }

  // Unknown function
  return err(
    new TypeError(
      `Unknown function: ${expr.name}`,
      `Function '${expr.name}' is not defined`,
      { kind: "unknown" },
      { kind: "unknown" },
      `function '${expr.name}'`
    )
  );
}

/**
 * Type checks an expression and returns a Result indicating success or failure.
 * This is a convenience wrapper around getExpressionType.
 */
export function typeCheck(
  expr: IExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeError> {
  return getExpressionType(expr, context);
}
