import type { IExpression } from "../expression";
import type { IAstNodeBase } from "../shared";

export type IArithmeticOperator = "+" | "-" | "*" | "/";
export type IComparisonOperator = ">" | ">=" | "<" | "<=" | "==";
export type IBooleanOperator = "and" | "or";

export type IBinaryOperator =
  | IArithmeticOperator
  | IComparisonOperator
  | IBooleanOperator;

export interface IBinaryExpression extends IAstNodeBase {
  readonly kind: "BinaryExpression";
  readonly operator: IBinaryOperator;
  readonly left: IExpression;
  readonly right: IExpression;
}
