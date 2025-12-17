import type { IAstLocation } from "../shared";
import type { IExpression } from "../expression";
import type { IFunctionCall } from "./types";

/**
 * Creates a function call AST node.
 */
export function createFunctionCall(
  name: string,
  args: ReadonlyArray<IExpression>,
  location: IAstLocation
): IFunctionCall {
  return { kind: "FunctionCall", name, args, location };
}
