import type { IExpression } from "../expression";
import type { IAstNodeBase } from "../shared";

export type IUnaryOperator = "!" | "-";

export interface IUnaryExpression extends IAstNodeBase {
  readonly kind: "UnaryExpression";
  readonly operator: IUnaryOperator;
  readonly operand: IExpression;
}
