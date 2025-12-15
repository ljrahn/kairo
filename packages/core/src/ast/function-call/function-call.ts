import type { IExpression } from "../expression";
import type { IFunctionCall } from "./types";

/**
 * Creates a function call AST node.
 */
export function createFunctionCall(
  name: string,
  args: ReadonlyArray<IExpression>
): IFunctionCall {
  return { kind: "FunctionCall", name, args };
}
