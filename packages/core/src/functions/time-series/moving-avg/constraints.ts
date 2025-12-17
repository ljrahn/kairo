import { err, ok, type Result } from "neverthrow";
import type { IFunctionCall } from "../../../ast";
import { FunctionError } from "../../errors";
import { asDurationLiteral } from "../../constraints";

export function validateMovingAvgCall(
  call: IFunctionCall
): Result<void, FunctionError> {
  const windowArg = call.args[1];
  if (!windowArg) {
    return err(
      FunctionError.invalidArgument(
        "moving_avg",
        "window",
        "missing duration argument"
      )
    );
  }

  const durationLiteralR = asDurationLiteral(windowArg, "moving_avg", "window");
  if (durationLiteralR.isErr()) {
    return err(durationLiteralR.error);
  }

  const duration = durationLiteralR.value.value;
  if (duration.value <= 0) {
    return err(
      FunctionError.invalidArgument(
        "moving_avg",
        "window",
        "must be greater than zero"
      )
    );
  }

  return ok(undefined);
}
