import type { IExpression } from "../expression";
import type { INamedArgument } from "./types";

export function createNamedArgument(
  name: string,
  value: IExpression
): INamedArgument {
  return { kind: "NamedArgument", name, value };
}
