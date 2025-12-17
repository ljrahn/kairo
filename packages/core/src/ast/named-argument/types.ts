import type { IExpression } from "../expression";
import type { IAstNodeBase } from "../shared";

export interface INamedArgument extends IAstNodeBase {
  readonly kind: "NamedArgument";
  readonly name: string;
  readonly value: IExpression;
}
