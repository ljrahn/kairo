import type { IExpression } from "../expression";

export interface IFunctionCall {
  readonly kind: "FunctionCall";
  readonly name: string;
  readonly args: ReadonlyArray<IExpression>;
}
