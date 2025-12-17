import type { IExpression } from "../expression";
import { IAstNodeBase } from "../shared";

export interface IFunctionCall extends IAstNodeBase {
  readonly kind: "FunctionCall";
  readonly name: string;
  readonly args: ReadonlyArray<IExpression>;
}
