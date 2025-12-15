import { IValueType } from "./types";

/**
 * Converts a value type to a human-readable string.
 */
export function valueTypeToString(type: IValueType): string {
  if (type.kind === "chart") {
    return `chart<${type.domainType}>`;
  }
  return type.kind;
}
