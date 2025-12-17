import type { IExpression } from "./types";
import type { ILiteral } from "../literal";
import type { IIdentifier } from "../identifier";
import type { IBinaryExpression } from "../binary-expression";
import type { IFunctionCall } from "../function-call";
import type { INamedArgument } from "../named-argument";
import type { IUnaryExpression } from "../unary-expression";

export function isLiteral(expr: IExpression): expr is ILiteral {
  return expr.kind === "Literal";
}

export function isIdentifier(expr: IExpression): expr is IIdentifier {
  return expr.kind === "Identifier";
}

export function isBinaryExpression(
  expr: IExpression
): expr is IBinaryExpression {
  return expr.kind === "BinaryExpression";
}

export function isFunctionCall(expr: IExpression): expr is IFunctionCall {
  return expr.kind === "FunctionCall";
}

export function isNamedArgument(expr: IExpression): expr is INamedArgument {
  return expr.kind === "NamedArgument";
}

export function isUnaryExpression(expr: IExpression): expr is IUnaryExpression {
  return expr.kind === "UnaryExpression";
}
