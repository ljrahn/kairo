import type { IToken, ILexingError } from "chevrotain";

export interface ILexerResult {
  readonly tokens: IToken[];
  readonly errors: ILexerError[];
}

export interface ILexerError {
  readonly message: string;
  readonly offset: number;
  readonly line: number;
  readonly column: number;
  readonly length: number;
}
