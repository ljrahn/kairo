import type { IExpression } from "../expression";
import type { IUnaryExpression, IUnaryOperator } from "./types";
import type { IAstLocation } from "../shared";

export function createUnaryExpression(
  operator: IUnaryOperator,
  operand: IExpression,
  location: IAstLocation
): IUnaryExpression {
  return { kind: "UnaryExpression", operator, operand, location };
}
