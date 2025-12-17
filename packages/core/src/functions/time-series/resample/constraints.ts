import { err, ok, type Result } from "neverthrow";
import type { IFunctionCall } from "../../../ast";
import { FunctionError } from "../../errors";
import {
  asDurationLiteral,
  asStringLiteral,
  findArgument,
} from "../../constraints";

export const RESAMPLE_METHODS = ["mean", "sum", "last"] as const;
export type IResampleMethod = (typeof RESAMPLE_METHODS)[number];

export function validateResampleCall(
  call: IFunctionCall
): Result<void, FunctionError> {
  const windowExpr = findArgument(call, "window", 1);

  if (!windowExpr) {
    return err(
      FunctionError.invalidArgument(
        "resample",
        "window",
        "missing window duration"
      )
    );
  }

  const windowLiteralR = asDurationLiteral(windowExpr, "resample", "window");
  if (windowLiteralR.isErr()) {
    return err(windowLiteralR.error);
  }

  const duration = windowLiteralR.value.value;
  if (duration.value <= 0) {
    return err(
      FunctionError.invalidArgument(
        "resample",
        "window",
        "must be greater than zero"
      )
    );
  }

  const methodExpr = findArgument(call, "method", 2);
  if (!methodExpr) {
    return ok(undefined);
  }

  const methodLiteralR = asStringLiteral(methodExpr, "resample", "method");
  if (methodLiteralR.isErr()) {
    return err(methodLiteralR.error);
  }

  const method = methodLiteralR.value.value as string;
  if (!RESAMPLE_METHODS.includes(method as IResampleMethod)) {
    const allowed = RESAMPLE_METHODS.join(", ");
    return err(
      FunctionError.invalidArgument(
        "resample",
        "method",
        `must be one of: ${allowed}`
      )
    );
  }

  return ok(undefined);
}
