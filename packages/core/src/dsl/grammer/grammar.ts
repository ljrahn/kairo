import { createToken, Lexer, TokenType } from "chevrotain";
import type { ILexerResult, ILexerError } from "./types";

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /\d+(\.\d+)?/,
});

export const BooleanLiteral = createToken({
  name: "BooleanLiteral",
  pattern: /(?:true|false)\b/,
  longer_alt: Identifier,
});

export const DurationLiteral = createToken({
  name: "DurationLiteral",
  pattern: /\d+(?:ms|[smhdw])/,
});

export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^"\\]|\\.)*"/,
});

export const And = createToken({
  name: "And",
  pattern: /and\b/,
  longer_alt: Identifier,
});

export const Or = createToken({
  name: "Or",
  pattern: /or\b/,
  longer_alt: Identifier,
});

export const Not = createToken({
  name: "Not",
  pattern: /not\b/,
  longer_alt: Identifier,
});

export const Plus = createToken({ name: "Plus", pattern: /\+/ });
export const Minus = createToken({ name: "Minus", pattern: /-/ });
export const Multiply = createToken({ name: "Multiply", pattern: /\*/ });
export const Divide = createToken({ name: "Divide", pattern: /\// });

export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
export const GreaterThanEqual = createToken({
  name: "GreaterThanEqual",
  pattern: />=/,
});
export const LessThan = createToken({ name: "LessThan", pattern: /</ });
export const LessThanEqual = createToken({
  name: "LessThanEqual",
  pattern: /<=/,
});
export const Equal = createToken({ name: "Equal", pattern: /==/ });
export const Assign = createToken({ name: "Assign", pattern: /=/ });

export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });

const allTokens: TokenType[] = [
  WhiteSpace,
  DurationLiteral,
  NumberLiteral,
  BooleanLiteral,
  StringLiteral,
  And,
  Or,
  Not,
  GreaterThanEqual,
  LessThanEqual,
  Equal,
  Assign,
  GreaterThan,
  LessThan,
  Plus,
  Minus,
  Multiply,
  Divide,
  LParen,
  RParen,
  Comma,
  Identifier,
];

const lexerInstance = new Lexer(allTokens);

/**
 * Tokenizes an input string into tokens for parsing.
 */
export function tokenize(input: string): ILexerResult {
  const result = lexerInstance.tokenize(input);

  const errors: ILexerError[] = result.errors.map((err) => ({
    message: err.message,
    offset: err.offset,
    line: err.line ?? 1,
    column: err.column ?? 1,
    length: err.length,
  }));

  return { tokens: result.tokens, errors };
}

export { allTokens };
