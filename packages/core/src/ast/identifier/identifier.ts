import type { IAstLocation } from "../shared";
import type { IIdentifier } from "./types";

/**
 * Creates an identifier AST node for chart references or implicit variables.
 */
export function createIdentifier(
  name: string,
  location: IAstLocation
): IIdentifier {
  return { kind: "Identifier", name, location };
}

export function isValidIdentifierName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
