import { err, ok, Result } from "neverthrow";
import { IFunctionCall } from "../../../ast";
import { FunctionError } from "../../errors";
import { findArgument, asStringLiteral } from "../../constraints";

export const ALIGN_METHODS = ["exact", "step", "linear"] as const;
export type IAlignMethod = (typeof ALIGN_METHODS)[number];

export function validateAlignCall(
  call: IFunctionCall
): Result<void, FunctionError> {
  const methodExpr = findArgument(call, "method", 2);
  if (!methodExpr) {
    return ok(undefined);
  }

  const methodLiteralR = asStringLiteral(methodExpr, "align", "method");
  if (methodLiteralR.isErr()) {
    return err(methodLiteralR.error);
  }

  const method = methodLiteralR.value.value as string;
  if (!ALIGN_METHODS.includes(method as (typeof ALIGN_METHODS)[number])) {
    const allowed = ALIGN_METHODS.join(", ");
    return err(
      FunctionError.invalidArgument(
        "align",
        "method",
        `must be one of: ${allowed}`
      )
    );
  }

  return ok(undefined);
}
