import { ok, type Result } from "neverthrow";
import type { IExpression } from "../../../ast";
import type { IFunctionCall } from "../../../ast";
import {
  validateAlignCall,
  validateMovingAvgCall,
  validateResampleCall,
  FunctionError,
} from "../../../functions";

/**
 * Validates function-specific semantic constraints that go beyond
 * simple type checking.
 *
 * Examples:
 * - `moving_avg` and `resample` require strictly positive window durations
 * - `align` and `resample` only accept certain interpolation methods
 *
 * This pass works purely on the AST and does not depend on the
 * runtime chart environment. It assumes that basic type checking
 * has already succeeded.
 */
export function checkExpressionFunctionConstraints(
  expr: IExpression
): Result<void, FunctionError> {
  switch (expr.kind) {
    case "Literal":
    case "Identifier":
      return ok(undefined);
    case "UnaryExpression":
      return checkExpressionFunctionConstraints(expr.operand);
    case "BinaryExpression": {
      const leftR = checkExpressionFunctionConstraints(expr.left);
      if (leftR.isErr()) return leftR;
      return checkExpressionFunctionConstraints(expr.right);
    }
    case "NamedArgument":
      return checkExpressionFunctionConstraints(expr.value);
    case "FunctionCall": {
      const callR = checkFunctionCall(expr);
      if (callR.isErr()) return callR;

      for (const arg of expr.args) {
        const argR = checkExpressionFunctionConstraints(arg);
        if (argR.isErr()) return argR;
      }

      return ok(undefined);
    }
  }
}

function checkFunctionCall(call: IFunctionCall): Result<void, FunctionError> {
  switch (call.name) {
    case "moving_avg":
      return validateMovingAvgCall(call);
    case "resample":
      return validateResampleCall(call);
    case "align":
      return validateAlignCall(call);
    default:
      return ok(undefined);
  }
}
