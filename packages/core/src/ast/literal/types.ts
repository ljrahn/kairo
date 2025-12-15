export type ILiteralType = "number" | "boolean" | "string" | "duration";

export interface IDuration {
  readonly value: number;
  readonly unit: "ms" | "s" | "m" | "h" | "d" | "w";
}

export interface INumberLiteralValue {
  readonly type: "number";
  readonly value: number;
}

export interface IBooleanLiteralValue {
  readonly type: "boolean";
  readonly value: boolean;
}

export interface IStringLiteralValue {
  readonly type: "string";
  readonly value: string;
}

export interface IDurationLiteralValue {
  readonly type: "duration";
  readonly value: IDuration;
}

export type ILiteralValue =
  | INumberLiteralValue
  | IBooleanLiteralValue
  | IStringLiteralValue
  | IDurationLiteralValue;

export interface INumberLiteral {
  readonly kind: "Literal";
  readonly literalType: "number";
  readonly value: number;
}

export interface IBooleanLiteral {
  readonly kind: "Literal";
  readonly literalType: "boolean";
  readonly value: boolean;
}

export interface IStringLiteral {
  readonly kind: "Literal";
  readonly literalType: "string";
  readonly value: string;
}

export interface IDurationLiteral {
  readonly kind: "Literal";
  readonly literalType: "duration";
  readonly value: IDuration;
}

export type ILiteral =
  | INumberLiteral
  | IBooleanLiteral
  | IStringLiteral
  | IDurationLiteral;
