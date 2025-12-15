import type { Result } from "neverthrow";
import type { IExpression } from "../../ast/expression";
import type { ParseError } from "./parse-error";

export type IParseResult = Result<IExpression, ParseError[]>;
