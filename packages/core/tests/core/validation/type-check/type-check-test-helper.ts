import { invariant } from "~/utils";
import { createTimeDomain, createChart, IValueType, IChart } from "~/domain";
import { parseProgram } from "~/dsl";
import { expectErrR, expectOkR } from "~/test";
import {
  getExpressionType,
  TypeCheckError,
  type ITypeCheckContext,
} from "~/validation";

export function makeContextWithCharts(names: string[]): ITypeCheckContext {
  const domain = createTimeDomain();
  const inputCharts = new Map<string, IChart>();

  for (const name of names) {
    const chart = createChart(domain, []);
    inputCharts.set(name, chart);
  }

  return { inputCharts, variables: new Map() };
}

export function expectType(
  expression: string,
  context: ITypeCheckContext,
  expected: IValueType
): void {
  const result = inferType(expression, context);
  const valueType = expectOkR(result);
  expect(valueType).toEqual(expected);
}

export function expectTypeCheckError(
  expression: string,
  context: ITypeCheckContext
): TypeCheckError {
  const result = inferType(expression, context);
  const error = expectErrR(result);

  expect(error).toBeInstanceOf(TypeCheckError);
  return error as TypeCheckError;
}

function inferType(expression: string, context: ITypeCheckContext) {
  const programResult = parseProgram(expression);
  const program = expectOkR(programResult);

  const expr = program.statements[0]?.expression;
  invariant(expr, "Expected an expression statement");
  return getExpressionType(expr, context);
}
