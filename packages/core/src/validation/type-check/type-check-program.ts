import { err, ok, Result } from "neverthrow";
import type { IProgram, IExpressionStatement } from "../../ast";
import type { IValueType } from "../../domain";
import { TypeCheckError } from "./errors";
import { getExpressionType } from "./type-check-expression";
import type { ITypeCheckContext, ITypeCheckInputContext } from "./types";

/**
 * Type-checks a full program, returning the final type-check context when
 * successful, or an array of accumulated type errors when any statement fails.
 *
 * The input context only supplies charts; variable types are derived as the
 * program introduces assignments, and are surfaced via the output context.
 */
export function typeCheckProgram(
  program: IProgram,
  initialContext: ITypeCheckInputContext
): Result<ITypeCheckContext, TypeCheckError[]> {
  const variables = new Map<string, IValueType>();

  const makeContext = (): ITypeCheckContext => ({
    inputCharts: initialContext.charts,
    variables,
  });

  const errors: TypeCheckError[] = [];

  for (const statement of program.statements) {
    if (statement.kind === "AssignmentStatement") {
      const typeR = getExpressionType(statement.expression, makeContext());

      if (typeR.isErr()) {
        errors.push(typeR.error);
        // do not update context on failed assignment; continue to next statement.
        continue;
      }

      const valueType = typeR.value;

      // for now, value-type-only view of variables; charts are
      // distinguished at runtime. program evaluation will map
      // chart bindings into the runtime charts map.
      variables.set(statement.name, valueType);
    } else {
      const exprStmt = statement as IExpressionStatement;
      const typeR = getExpressionType(exprStmt.expression, makeContext());

      if (typeR.isErr()) {
        errors.push(typeR.error);
        continue;
      }

      // non-assignment expressions currently only influence error reporting,
      // not the accumulated type context.
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(makeContext());
}
