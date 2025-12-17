import { Result } from "neverthrow";
import { IChart } from "../domain";
import { IProgram } from "../ast";
import { ParseError } from "../dsl";
import { TypeCheckError } from "../validation";
import { FunctionError } from "../functions";
import { EvaluationError } from "./errors";

/**
 * Input context for program execution. Only charts and time provider are
 * supplied; variables are introduced during evaluation.
 */
export interface IProgramInputContext {
  readonly charts: ReadonlyMap<string, IChart>;
  readonly now: () => Date;
}

export type IProgramExecutionResult = Result<
  IProgramExecutionSuccess,
  IProgramExecutionError
>;

export interface IProgramExecutionSuccess {
  readonly phase: "success";
  readonly ast: IProgram;
  readonly context: IEvalContext;
}

export type IProgramExecutionError =
  | { readonly phase: "parse"; readonly errors: readonly ParseError[] }
  | { readonly phase: "type-check"; readonly errors: readonly TypeCheckError[] }
  | { readonly phase: "function-constraints"; readonly error: FunctionError }
  | { readonly phase: "evaluation"; readonly error: EvaluationError };

export interface IEvalContext {
  readonly inputCharts: ReadonlyMap<string, IChart>;
  readonly now: () => Date;

  readonly variables: ReadonlyMap<string, IRuntimeValue>;
  readonly derivedCharts: ReadonlyMap<string, IChart>;
}

export type IRuntimeValue =
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "duration"; readonly value: number }
  | { readonly kind: "time"; readonly value: Date }
  | { readonly kind: "chart"; readonly value: IChart };
