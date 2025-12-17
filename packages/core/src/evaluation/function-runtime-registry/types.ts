import { Result } from "neverthrow";
import { IExpression, IFunctionCall } from "../../ast";
import { IEvalContext, IRuntimeValue } from "../types";
import { EvaluationError } from "../errors/evaluation-error";

export type ISubexpressionEvaluator = (
  expr: IExpression,
  evalCtx: IEvalContext
) => Result<IRuntimeValue, EvaluationError>;

export type IRuntimeFunction = (
  call: IFunctionCall,
  args: readonly IRuntimeValue[],
  evalCtx: IEvalContext,
  evalExpr: ISubexpressionEvaluator
) => Result<IRuntimeValue, EvaluationError>;

export interface IRuntimeFunctionEntry {
  readonly impl: IRuntimeFunction;
  readonly evaluateArgs?: (
    call: IFunctionCall,
    evalCtx: IEvalContext,
    evalExpr: ISubexpressionEvaluator
  ) => Result<IRuntimeValue[], EvaluationError>;
}
