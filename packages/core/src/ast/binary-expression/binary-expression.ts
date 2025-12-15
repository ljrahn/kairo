import type { IExpression } from "../expression";
import type {
  IBinaryExpression,
  IBinaryOperator,
  IArithmeticOperator,
  IComparisonOperator,
  IBooleanOperator,
} from "./types";

/**
 * Creates a binary expression AST node.
 */
export function createBinaryExpression(
  operator: IBinaryOperator,
  left: IExpression,
  right: IExpression
): IBinaryExpression {
  return {
    kind: "BinaryExpression",
    operator,
    left,
    right,
  };
}

export function isArithmeticOperator(
  operator: IBinaryOperator
): operator is IArithmeticOperator {
  return ["+", "-", "*", "/"].includes(operator);
}

export function isComparisonOperator(
  operator: IBinaryOperator
): operator is IComparisonOperator {
  return [">", ">=", "<", "<=", "=="].includes(operator);
}

export function isBooleanOperator(
  operator: IBinaryOperator
): operator is IBooleanOperator {
  return operator === "and" || operator === "or";
}

export function getOperatorPrecedence(operator: IBinaryOperator): number {
  const precedence: Record<IBinaryOperator, number> = {
    or: 1,
    and: 2,
    "==": 3,
    ">": 4,
    ">=": 4,
    "<": 4,
    "<=": 4,
    "+": 5,
    "-": 5,
    "*": 6,
    "/": 6,
  };
  return precedence[operator];
}
