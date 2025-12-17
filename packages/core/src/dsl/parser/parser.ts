import { ok, err } from "neverthrow";
import { tokenize } from "../grammer/grammar";
import { ParseError } from "./parse-error";
import { ExpressionParser } from "./expression-parser";
import { createAstVisitor } from "./ast-visitor";
import type { IProgramParseResult } from "./types";
import { InvariantError } from "../../utils";

const parserInstance = new ExpressionParser();
const astBuilder = createAstVisitor(
  parserInstance.getBaseCstVisitorConstructor()
);

/**
 * Parses a program string into a Program AST.
 * Returns a Result containing either the AST or an array of ParseErrors.
 */
export function parseProgram(input: string): IProgramParseResult {
  const lexResult = tokenize(input);

  if (lexResult.errors.length > 0) {
    const errors = lexResult.errors.map((lexError) =>
      ParseError.atLocation(
        `Lexer error: ${lexError.message}`,
        `Unexpected character at line ${lexError.line}, column ${lexError.column}`,
        {
          line: lexError.line,
          column: lexError.column,
          offset: lexError.offset,
          length: lexError.length,
        }
      )
    );
    return err(errors);
  }

  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.program();

  if (parserInstance.errors.length > 0) {
    const errors = parserInstance.errors.map((parserError) => {
      const token = parserError.token;
      return ParseError.atLocation(
        `Parser error: ${parserError.message}`,
        `Syntax error: ${parserError.message}`,
        {
          line: token.startLine ?? 1,
          column: token.startColumn ?? 1,
          offset: token.startOffset,
          length: token.image.length,
        }
      );
    });
    return err(errors);
  }

  try {
    const ast = astBuilder.visit(cst);
    return ok(ast);
  } catch (error) {
    if (error instanceof InvariantError) {
      const parseError = ParseError.general(
        `Parser invariant error: ${error.message}`,
        "Internal parser error"
      );
      return err([parseError]);
    }

    const message = error instanceof Error ? error.message : String(error);
    const parseError = ParseError.general(
      `AST building error: ${message}`,
      "Failed to build abstract syntax tree"
    );
    return err([parseError]);
  }
}
