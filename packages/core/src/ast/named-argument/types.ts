import type { IExpression } from "../expression";

export interface INamedArgument {
  readonly kind: "NamedArgument";
  readonly name: string;
  readonly value: IExpression;
}
