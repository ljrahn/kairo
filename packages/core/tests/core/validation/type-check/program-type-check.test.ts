import { describe, it, expect } from "vitest";
import { parseProgram } from "~/dsl";
import {
  typeCheckProgram,
  type ITypeCheckContext,
  type ITypeCheckInputContext,
  TypeCheckError,
} from "~/validation";
import { type IValueType } from "~/domain";
import { expectOkR, expectErrR } from "~/test";
import { makeContextWithCharts } from "./type-check-test-helper";

function typeCheckProgramOk(
  source: string,
  context: ITypeCheckInputContext
): ITypeCheckContext {
  const parseResult = parseProgram(source);
  const program = expectOkR(parseResult);

  const typeResult = typeCheckProgram(program, context);
  const okResult = expectOkR(typeResult);
  return okResult;
}

function typeCheckProgramErrors(
  source: string,
  context: ITypeCheckInputContext
): readonly TypeCheckError[] {
  const parseResult = parseProgram(source);
  const program = expectOkR(parseResult);

  const typeResult = typeCheckProgram(program, context);
  const errors = expectErrR(typeResult);
  return errors;
}

describe("program type-checker - variable introduction", () => {
  it("introduces variables across assignment statements", () => {
    const ctx = makeContextWithCharts([]);
    const finalContext = typeCheckProgramOk("A = 1; B = A + 2", {
      charts: ctx.inputCharts,
    });

    const vars = finalContext.variables;
    expect(vars.get("A")).toEqual({ kind: "number" });
    expect(vars.get("B")).toEqual({ kind: "number" });
  });

  it("allows using initial chart bindings in assignments", () => {
    const ctx = makeContextWithCharts(["Revenue"]);
    const finalContext = typeCheckProgramOk(
      "A = Revenue; B = moving_avg(A, 7d)",
      { charts: ctx.inputCharts }
    );

    const vars = finalContext.variables;
    const aType = vars.get("A") as IValueType | undefined;
    const bType = vars.get("B") as IValueType | undefined;

    expect(aType).toEqual({ kind: "chart", domainType: "time" });
    expect(bType).toEqual({ kind: "chart", domainType: "time" });
  });
});

describe("program type-checker - error accumulation", () => {
  it("collects type errors from multiple statements", () => {
    const ctx = makeContextWithCharts([]);
    const errors = typeCheckProgramErrors(
      "A = 1 + true; B = unknown_chart + 2",
      { charts: ctx.inputCharts }
    );

    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThanOrEqual(2);

    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes("Operator"))).toBe(true);
    expect(messages.some((m) => m.includes("Unknown identifier"))).toBe(true);
  });
});
