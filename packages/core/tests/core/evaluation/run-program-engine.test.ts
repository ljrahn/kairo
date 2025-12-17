import { describe, it, expect } from "vitest";
import { IProgramInputContext, runProgram } from "~/evaluation";
import type { IChart } from "~/domain";
import { expectErrR, expectOkR } from "~/test";
import { makeTimeSeriesChart } from "./evaluation-fixtures";

function makeProgramInputContext(
  overrides?: Partial<IProgramInputContext>
): IProgramInputContext {
  const charts = overrides?.charts ?? new Map<string, IChart>();
  const now = overrides?.now ?? (() => new Date(2020, 0, 1, 0, 0, 0));

  return { charts, now };
}

describe("runProgram - success paths", () => {
  it("evaluates a simple numeric program end-to-end", () => {
    const context = makeProgramInputContext();
    const result = runProgram("A = 1 + 2 * 3;", context);

    const success = expectOkR(result);

    expect(success.phase).toBe("success");

    const vars = success.context.variables;
    const aValue = vars.get("A");
    expect(aValue).toBeDefined();
    if (!aValue || aValue.kind !== "number") {
      throw new Error("Expected number runtime value for A");
    }
    expect(aValue.value).toBe(7);
  });

  it("evaluates a chart program with assignments and expressions", () => {
    const baseChart = makeTimeSeriesChart([1, 2, 3, 4]);
    const charts = new Map<string, IChart>([["Revenue", baseChart]]);
    const context = makeProgramInputContext({ charts });

    const source = "A = Revenue; B = moving_avg(A, 2m);";
    const result = runProgram(source, context);

    const success = expectOkR(result);
    expect(success.phase).toBe("success");

    const runtimeCharts = success.context.derivedCharts;
    const chartA = runtimeCharts.get("A");
    const chartB = runtimeCharts.get("B");

    expect(chartA).toBe(baseChart);
    expect(chartA).toBeDefined();
    expect(chartB).toBeDefined();

    // B should be the moving average of A with window 2
    if (!chartB) {
      throw new Error("Expected chart B to be defined");
    }
    const values = chartB.points.map((p) => p.y);
    expect(values).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it("does not mutate the input evaluation context", () => {
    const baseChart = makeTimeSeriesChart([1, 2, 3]);
    const charts = new Map<string, IChart>([["A", baseChart]]);
    const context: IProgramInputContext = {
      charts,
      now: () => new Date(2020, 0, 1, 0, 0, 0),
    };

    const result = runProgram("B = A + 1;", context);
    const success = expectOkR(result);

    expect(success.context.derivedCharts).not.toBe(context.charts);
    expect(success.context.derivedCharts.size).toBe(1);

    expect(context.charts.size).toBe(1);
    expect(context.charts.has("B")).toBe(false);
  });
});

describe("runProgram - error paths", () => {
  it("returns parse errors when the program is invalid", () => {
    const context = makeProgramInputContext();
    const result = runProgram("A =", context);

    const error = expectErrR(result);

    if (error.phase !== "parse") {
      throw new Error(`Expected parse phase, got ${error.phase}`);
    }

    expect(error.errors.length).toBeGreaterThan(0);
  });

  it("returns type-check errors aggregated from the program", () => {
    const context = makeProgramInputContext();
    const result = runProgram("A = true; B = A + 1; C = B + 1;", context);

    const error = expectErrR(result);

    if (error.phase !== "type-check") {
      throw new Error(`Expected type-check phase, got ${error.phase}`);
    }

    expect(Array.isArray(error.errors)).toBe(true);
    expect(error.errors.length).toBe(2);
  });

  it("returns function-constraint errors from assignments and expressions", () => {
    const chart = makeTimeSeriesChart([1, 2, 3]);
    const charts = new Map<string, IChart>([["A", chart]]);
    const context = makeProgramInputContext({ charts });

    const result = runProgram("B = moving_avg(A, 0m);", context);

    const error = expectErrR(result);

    if (error.phase !== "function-constraints") {
      throw new Error(
        `Expected function-constraints phase, got ${error.phase}`
      );
    }

    expect(
      String(error.error instanceof Error ? error.error.message : "")
    ).toContain("must be greater than zero");
  });

  it("returns evaluation errors when chart arithmetic fails at runtime", () => {
    const baseChart = makeTimeSeriesChart([1, 2, 3]);

    const misalignedChart = makeTimeSeriesChart([10, 20, 30]);
    const shiftedPoints = misalignedChart.points.map((point) => ({
      x: new Date(point.x.getTime() + 60_000),
      y: point.y,
    }));

    const shiftedChart: IChart = {
      domain: misalignedChart.domain,
      points: shiftedPoints,
    };

    const charts = new Map<string, IChart>([
      ["A", baseChart],
      ["B", shiftedChart],
    ]);

    const context = makeProgramInputContext({ charts });
    const result = runProgram("A + B", context);

    const error = expectErrR(result);

    if (error.phase !== "evaluation") {
      throw new Error(`Expected evaluation phase, got ${error.phase}`);
    }

    expect(
      String(error.error instanceof Error ? error.error.message : "")
    ).toContain("aligned charts");
  });
});
