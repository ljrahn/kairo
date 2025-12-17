import type { IAstLocation } from "../shared";
import type { IExpression } from "../expression";
import type { INamedArgument } from "./types";

export function createNamedArgument(
  name: string,
  value: IExpression,
  location: IAstLocation
): INamedArgument {
  return { kind: "NamedArgument", name, value, location };
}
