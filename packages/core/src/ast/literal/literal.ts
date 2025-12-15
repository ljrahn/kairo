import type {
  ILiteral,
  IDuration,
  INumberLiteral,
  IBooleanLiteral,
  IStringLiteral,
  IDurationLiteral,
} from "./types";

/**
 * Creates a number literal AST node.
 */
export function createNumberLiteral(value: number): INumberLiteral {
  return { kind: "Literal", literalType: "number", value };
}

/**
 * Creates a boolean literal AST node.
 */
export function createBooleanLiteral(value: boolean): IBooleanLiteral {
  return { kind: "Literal", literalType: "boolean", value };
}

/**
 * Creates a string literal AST node.
 */
export function createStringLiteral(value: string): IStringLiteral {
  return { kind: "Literal", literalType: "string", value };
}

/**
 * Creates a duration literal AST node.
 */
export function createDurationLiteral(duration: IDuration): IDurationLiteral {
  return { kind: "Literal", literalType: "duration", value: duration };
}

/**
 * Creates a duration value object.
 */
export function createDuration(
  value: number,
  unit: "ms" | "s" | "m" | "h" | "d" | "w"
): IDuration {
  return { value, unit };
}

export function isNumberLiteral(literal: ILiteral): literal is INumberLiteral {
  return literal.literalType === "number";
}

export function isBooleanLiteral(
  literal: ILiteral
): literal is IBooleanLiteral {
  return literal.literalType === "boolean";
}

export function isStringLiteral(literal: ILiteral): literal is IStringLiteral {
  return literal.literalType === "string";
}

export function isDurationLiteral(
  literal: ILiteral
): literal is IDurationLiteral {
  return literal.literalType === "duration";
}

export function durationToMilliseconds(duration: IDuration): number {
  const multipliers: Record<IDuration["unit"], number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return duration.value * multipliers[duration.unit];
}
