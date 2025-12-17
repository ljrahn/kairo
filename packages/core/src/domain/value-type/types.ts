import type { IDomainType } from "../chart";

/**
 * Represents the value types in the DSL type system.
 * This is the semantic layer - what types of values can exist in expressions.
 */
export type IValueType =
  | { readonly kind: "number" }
  | { readonly kind: "boolean" }
  | { readonly kind: "string" }
  | { readonly kind: "duration" }
  | { readonly kind: "time" }
  | { readonly kind: "chart"; readonly domainType: IDomainType }
  | { readonly kind: "unknown" };
