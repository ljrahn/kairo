import { err, ok, Result } from "neverthrow";
import { IProgram } from "../../ast";
import { FunctionError } from "../../functions";
import { checkExpressionFunctionConstraints } from "./function-check-expression-constraints";

export function checkProgramFunctionConstraints(
  program: IProgram
): Result<void, FunctionError> {
  for (const statement of program.statements) {
    const result = checkExpressionFunctionConstraints(statement.expression);
    if (result.isErr()) {
      return err(result.error);
    }
  }

  return ok(undefined);
}
