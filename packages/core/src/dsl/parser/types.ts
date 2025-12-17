import type { Result } from "neverthrow";
import type { IProgram } from "../../ast/program";
import type { ParseError } from "./parse-error";

export type IProgramParseResult = Result<IProgram, ParseError[]>;
