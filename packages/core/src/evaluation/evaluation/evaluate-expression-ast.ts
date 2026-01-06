import { err, ok, type Result } from "neverthrow";
import type {
  IBinaryExpression,
  IBinaryOperator,
  IExpression,
  IIdentifier,
  ILiteral,
  IUnaryExpression,
  IFunctionCall,
} from "../../ast";
import { durationToMilliseconds } from "../../ast";
import { invariant } from "../../utils";
import { EvaluationError } from "../errors";
import type { IFunctionName } from "../../functions";
import type { IEvalContext, IRuntimeValue } from "../types";
import {
  FunctionRuntimeRegistry,
  ISubexpressionEvaluator,
} from "../function-runtime-registry";
import {
  evaluateChartBinaryArithmetic,
  evaluateChartScalarArithmetic,
} from "./evaluate-chart";

export function evaluateExpressionAst(
  expr: IExpression,
  context: IEvalContext
): Result<IRuntimeValue, EvaluationError> {
  switch (expr.kind) {
    case "Literal":
      return ok(evaluateLiteral(expr));
    case "Identifier":
      return evaluateIdentifier(expr, context);
    case "UnaryExpression":
      return evaluateUnaryExpression(expr, context);
    case "BinaryExpression":
      return evaluateBinaryExpression(expr, context);
    case "FunctionCall":
      return evaluateFunctionCall(expr, context);
    case "NamedArgument":
      invariant(
        false,
        "NamedArgument should not appear at top-level in evaluation"
      );
    default:
      invariant(false, "Unknown expression kind in evaluation", {
        kind: (expr as IExpression).kind,
      });
  }
}

function evaluateFunctionCall(
  expr: IFunctionCall,
  context: IEvalContext
): Result<IRuntimeValue, EvaluationError> {
  const entry = FunctionRuntimeRegistry.get(expr.name as IFunctionName);

  if (!entry) {
    return err(EvaluationError.functionNotImplemented(expr.name));
  }

  const evalExpr: ISubexpressionEvaluator = (subExpr, subContext) =>
    evaluateExpressionAst(subExpr, subContext);

  const { impl, evaluateArgs } = entry;

  const argValuesR = evaluateArgs
    ? evaluateArgs(expr, context, evalExpr)
    : defaultEvaluateArgs(expr, context, evalExpr);

  if (argValuesR.isErr()) {
    return err(argValuesR.error);
  }

  return impl(expr, argValuesR.value, context, evalExpr);
}

function defaultEvaluateArgs(
  expr: IFunctionCall,
  context: IEvalContext,
  evalExpr: ISubexpressionEvaluator
): Result<IRuntimeValue[], EvaluationError> {
  const argValues: IRuntimeValue[] = [];

  for (const argExpr of expr.args) {
    const valueExpr =
      argExpr.kind === "NamedArgument" ? argExpr.value : argExpr;

    const argValueR = evalExpr(valueExpr, context);
    if (argValueR.isErr()) {
      return err<IRuntimeValue[], EvaluationError>(argValueR.error);
    }

    argValues.push(argValueR.value);
  }

  return ok(argValues);
}

function evaluateLiteral(expr: ILiteral): IRuntimeValue {
  switch (expr.literalType) {
    case "number":
      return { kind: "number", value: expr.value };
    case "boolean":
      return { kind: "boolean", value: expr.value };
    case "duration":
      // duration literal value is expected to be normalized
      // into a numeric representation (e.g. milliseconds)
      return {
        kind: "duration",
        value: durationToMilliseconds(expr.value),
      };
    case "string":
      return { kind: "string", value: expr.value };
    default:
      invariant(false, "Unknown literal type in evaluation", {
        literalType: (expr as ILiteral).literalType,
      });
  }
}

function evaluateIdentifier(
  expr: IIdentifier,
  context: IEvalContext
): Result<IRuntimeValue, EvaluationError> {
  const variable = context.variables?.get(expr.name);
  if (variable) {
    return ok(variable);
  }

  const chart = context.inputCharts.get(expr.name);
  if (!chart) {
    invariant(
      false,
      "Unknown identifier during evaluation; type-checker must ensure charts exist",
      { name: expr.name }
    );
  }

  return ok({ kind: "chart", value: chart! });
}

function evaluateUnaryExpression(
  expr: IUnaryExpression,
  context: IEvalContext
): Result<IRuntimeValue, EvaluationError> {
  const operandR = evaluateExpressionAst(expr.operand, context);
  if (operandR.isErr()) return operandR;
  const operand = operandR.value;

  if (expr.operator === "!") {
    invariant(
      operand.kind === "boolean",
      "Type checker should ensure '!' is only applied to booleans",
      { operandKind: operand.kind }
    );

    return ok({ kind: "boolean", value: !operand.value });
  }

  if (expr.operator === "-") {
    invariant(
      operand.kind === "number",
      "Type checker should ensure unary '-' is only applied to numbers",
      { operandKind: operand.kind }
    );

    return ok({ kind: "number", value: -operand.value });
  }

  invariant(false, "Unknown unary operator in evaluation", {
    operator: expr.operator,
  });
}

function evaluateBinaryExpression(
  expr: IBinaryExpression,
  context: IEvalContext
): Result<IRuntimeValue, EvaluationError> {
  const leftR = evaluateExpressionAst(expr.left, context);
  if (leftR.isErr()) return leftR;
  const rightR = evaluateExpressionAst(expr.right, context);
  if (rightR.isErr()) return rightR;

  const left = leftR.value;
  const right = rightR.value;

  if (isArithmeticOperator(expr.operator)) {
    return evaluateArithmetic(expr.operator, left, right);
  }

  if (isComparisonOperator(expr.operator)) {
    return evaluateComparison(expr.operator, left, right);
  }

  if (isBooleanOperator(expr.operator)) {
    return evaluateBoolean(expr.operator, left, right);
  }

  invariant(false, "Unknown binary operator in evaluation", {
    operator: expr.operator,
  });
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

function evaluateArithmetic(
  op: "+" | "-" | "*" | "/",
  left: IRuntimeValue,
  right: IRuntimeValue
): Result<IRuntimeValue, EvaluationError> {
  // number +/-*/ number -> number
  if (left.kind === "number" && right.kind === "number") {
    const leftValue = left.value;
    const rightValue = right.value;
    switch (op) {
      case "+":
        return ok({ kind: "number", value: leftValue + rightValue });
      case "-":
        return ok({ kind: "number", value: leftValue - rightValue });
      case "*":
        return ok({ kind: "number", value: leftValue * rightValue });
      case "/":
        return ok({ kind: "number", value: leftValue / rightValue });
    }
  }

  // time +/- duration -> time
  if (
    left.kind === "time" &&
    right.kind === "duration" &&
    (op === "+" || op === "-")
  ) {
    const sign = op === "+" ? 1 : -1;
    return ok({
      kind: "time",
      value: new Date(left.value.getTime() + sign * right.value),
    });
  }

  // duration + time -> time
  if (left.kind === "duration" && right.kind === "time" && op === "+") {
    return ok({
      kind: "time",
      value: new Date(right.value.getTime() + left.value),
    });
  }

  // chart arithmetic and chart-scalar arithmetic are delegated to
  // chart-specific helpers that will be implemented later.
  // chart +/-*/ chart -> chart (when aligned)
  if (left.kind === "chart" && right.kind === "chart") {
    const chartR = evaluateChartBinaryArithmetic(op, left.value, right.value);

    if (chartR.isErr()) {
      return err(chartR.error);
    }

    return ok({ kind: "chart", value: chartR.value });
  }

  // chart +/-*/ number -> chart
  if (left.kind === "chart" && right.kind === "number") {
    const chart = evaluateChartScalarArithmetic(
      op,
      left.value,
      right.value,
      false
    );
    return ok({ kind: "chart", value: chart });
  }

  // number +/-*/ chart -> chart
  if (left.kind === "number" && right.kind === "chart") {
    const chart = evaluateChartScalarArithmetic(
      op,
      right.value,
      left.value,
      true
    );
    return ok({ kind: "chart", value: chart });
  }

  invariant(
    false,
    "Type checker failed to reject invalid arithmetic operand kinds",
    { operator: op, leftKind: left.kind, rightKind: right.kind }
  );
}

function evaluateComparison(
  op: ">" | ">=" | "<" | "<=" | "==",
  left: IRuntimeValue,
  right: IRuntimeValue
): Result<IRuntimeValue, EvaluationError> {
  // number vs number
  if (left.kind === "number" && right.kind === "number") {
    return ok({
      kind: "boolean",
      value: comparePrimitive(op, left.value, right.value),
    });
  }

  // time vs time
  if (left.kind === "time" && right.kind === "time") {
    return ok({
      kind: "boolean",
      value: comparePrimitive(op, left.value.getTime(), right.value.getTime()),
    });
  }

  // boolean == boolean
  if (op === "==" && left.kind === "boolean" && right.kind === "boolean") {
    return ok({ kind: "boolean", value: left.value === right.value });
  }

  invariant(
    false,
    "Type checker failed to reject invalid comparison operand kinds",
    { operator: op, leftKind: left.kind, rightKind: right.kind }
  );
}

function comparePrimitive(
  op: ">" | ">=" | "<" | "<=" | "==",
  left: number,
  right: number
): boolean {
  switch (op) {
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case "==":
      return left === right;
  }
}

function evaluateBoolean(
  op: "and" | "or",
  left: IRuntimeValue,
  right: IRuntimeValue
): Result<IRuntimeValue, EvaluationError> {
  const leftBoolR = expectBoolean(left, `Operator '${op}' left operand`);
  if (leftBoolR.isErr()) {
    return err(leftBoolR.error);
  }

  const rightBoolR = expectBoolean(right, `Operator '${op}' right operand`);
  if (rightBoolR.isErr()) {
    return err(rightBoolR.error);
  }

  const leftBool = leftBoolR.value;
  const rightBool = rightBoolR.value;

  if (op === "and") {
    return ok({ kind: "boolean", value: leftBool && rightBool });
  }

  return ok({ kind: "boolean", value: leftBool || rightBool });
}

function expectBoolean(
  value: IRuntimeValue,
  context: string
): Result<boolean, EvaluationError> {
  if (value.kind !== "boolean") {
    invariant(
      false,
      "Type checker should ensure boolean operands for logical operators",
      {
        context,
        actualKind: value.kind,
      }
    );
  }

  return ok(value.value);
}
