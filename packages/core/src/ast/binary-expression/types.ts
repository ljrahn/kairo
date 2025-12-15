import type { IExpression } from "../expression";

export type IArithmeticOperator = "+" | "-" | "*" | "/";
export type IComparisonOperator = ">" | ">=" | "<" | "<=" | "==";
export type IBooleanOperator = "and" | "or";

export type IBinaryOperator =
  | IArithmeticOperator
  | IComparisonOperator
  | IBooleanOperator;

export interface IBinaryExpression {
  readonly kind: "BinaryExpression";
  readonly operator: IBinaryOperator;
  readonly left: IExpression;
  readonly right: IExpression;
}
