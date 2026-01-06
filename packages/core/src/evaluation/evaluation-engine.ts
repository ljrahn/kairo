import { err, ok } from "neverthrow";
import { parseProgram } from "../dsl";
import {
  typeCheckProgram,
  checkProgramFunctionConstraints,
} from "../validation";
import { IChart } from "../domain";
import type {
  IEvalContext,
  IProgramExecutionResult,
  IRuntimeValue,
  IProgramInputContext,
} from "./types";
import { evaluateExpressionAst } from "./evaluation";

export function runProgram(
  source: string,
  context: IProgramInputContext
): IProgramExecutionResult {
  const parseR = parseProgram(source);

  if (parseR.isErr()) {
    return err({ phase: "parse", errors: parseR.error });
  }

  const program = parseR.value;

  // program-level type checking operates only on chart bindings; variable
  // types are inferred from assignments within the program itself.
  const typeR = typeCheckProgram(program, { charts: context.charts });

  if (typeR.isErr()) {
    return err({ phase: "type-check", errors: typeR.error });
  }

  const constraintsR = checkProgramFunctionConstraints(program);

  if (constraintsR.isErr()) {
    return err({ phase: "function-constraints", error: constraintsR.error });
  }

  const variables = new Map<string, IRuntimeValue>();
  const derivedCharts = new Map<string, IChart>();

  const runtimeContext: IEvalContext = {
    inputCharts: context.charts,
    now: context.now,
    variables,
    derivedCharts,
  };

  for (const statement of program.statements) {
    const expression = statement.expression;

    const evalR = evaluateExpressionAst(expression, runtimeContext);

    if (evalR.isErr()) {
      return err({ phase: "evaluation", error: evalR.error });
    }

    const value = evalR.value;

    if (statement.kind === "AssignmentStatement") {
      if (value.kind === "chart") {
        derivedCharts.set(statement.name, value.value);
      }

      variables.set(statement.name, value);
    }
  }

  return ok({
    phase: "success",
    ast: program,
    context: runtimeContext,
  });
}
