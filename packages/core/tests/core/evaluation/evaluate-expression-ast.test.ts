import { describe, it, expect } from "vitest";
import { parseProgram } from "~/dsl";
import {
  evaluateExpressionAst,
  evaluateChartBinaryArithmetic,
  evaluateChartScalarArithmetic,
} from "~/evaluation";
import type { IEvalContext, IRuntimeValue } from "~/evaluation/types";
import type { IChart } from "~/domain";
import { createTimeDomain, createNumericDomain, createChart } from "~/domain";
import { expectErrR, expectOkR } from "~/test";
import {
  makeTimeSeriesChart,
  makeEmptyTimeSeriesChart,
  makeNumericChart,
} from "./evaluation-fixtures";
import { invariant } from "~/utils";

const baseNow = new Date(2020, 0, 1, 0, 0, 0);

function makeEvalContext(overrides?: Partial<IEvalContext>): IEvalContext {
  return {
    inputCharts: new Map<string, IChart>(),
    variables: new Map<string, IRuntimeValue>(),
    derivedCharts: new Map<string, IChart>(),
    now: () => baseNow,
    ...overrides,
  };
}

function evalSource(
  source: string,
  overrides?: Partial<IEvalContext>
): IRuntimeValue {
  const program = expectOkR(parseProgram(source));
  const expr = program.statements[0]?.expression;
  invariant(expr, "Expected an expression statement");
  const result = evaluateExpressionAst(expr, makeEvalContext(overrides));
  return expectOkR(result);
}

describe("evaluateExpressionAst - literals and identifiers", () => {
  it("evaluates basic literals", () => {
    const numberValue = evalSource("42");
    expect(numberValue.kind).toBe("number");
    if (numberValue.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(numberValue.value).toBe(42);

    const booleanValue = evalSource("true");
    expect(booleanValue.kind).toBe("boolean");
    if (booleanValue.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(booleanValue.value).toBe(true);

    const stringValue = evalSource('"hello"');
    expect(stringValue.kind).toBe("string");
    if (stringValue.kind !== "string") {
      throw new Error("Expected string runtime value");
    }
    expect(stringValue.value).toBe("hello");

    const durationValue = evalSource("2h");
    expect(durationValue.kind).toBe("duration");
    if (durationValue.kind !== "duration") {
      throw new Error("Expected duration runtime value");
    }
    expect(durationValue.value).toBe(2 * 60 * 60 * 1000);
  });

  it("resolves identifiers from charts when no variables are provided", () => {
    const chart = makeTimeSeriesChart([1, 2, 3]);
    const charts = new Map<string, IChart>([["A", chart]]);

    const value = evalSource("A", { inputCharts: charts });

    expect(value.kind).toBe("chart");
    if (value.kind !== "chart") {
      throw new Error("Expected chart runtime value");
    }
    expect(value.value).toBe(chart);
  });

  it("prefers variables over charts when resolving identifiers", () => {
    const chart = makeTimeSeriesChart([1, 2, 3]);
    const charts = new Map<string, IChart>([["A", chart]]);

    const variableValue: IRuntimeValue = { kind: "number", value: 42 };
    const variables = new Map<string, IRuntimeValue>([["A", variableValue]]);

    const value = evalSource("A", { inputCharts: charts, variables });

    expect(value.kind).toBe("number");
    if (value.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(value.value).toBe(42);
  });
});

describe("evaluateExpressionAst - unary and arithmetic operators", () => {
  it("evaluates unary ! and - operators", () => {
    const notTrue = evalSource("!true");
    expect(notTrue.kind).toBe("boolean");
    if (notTrue.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(notTrue.value).toBe(false);

    const negative = evalSource("-1");
    expect(negative.kind).toBe("number");
    if (negative.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(negative.value).toBe(-1);
  });

  it("evaluates basic numeric arithmetic", () => {
    const sum = evalSource("1 + 2");
    expect(sum.kind).toBe("number");
    if (sum.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(sum.value).toBe(3);

    const difference = evalSource("5 - 3");
    expect(difference.kind).toBe("number");
    if (difference.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(difference.value).toBe(2);

    const product = evalSource("2 * 4");
    expect(product.kind).toBe("number");
    if (product.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(product.value).toBe(8);

    const quotient = evalSource("8 / 2");
    expect(quotient.kind).toBe("number");
    if (quotient.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(quotient.value).toBe(4);
  });

  it("honors arithmetic precedence and associativity", () => {
    const result = evalSource("1 + 2 * 3");
    expect(result.kind).toBe("number");
    if (result.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(result.value).toBe(7);

    const leftAssociative = evalSource("1 - 2 - 3");
    expect(leftAssociative.kind).toBe("number");
    if (leftAssociative.kind !== "number") {
      throw new Error("Expected number runtime value");
    }
    expect(leftAssociative.value).toBe(-4);
  });

  it("evaluates time and duration arithmetic", () => {
    const fixedNow = new Date(2020, 0, 1, 0, 0, 0);

    const plusDuration = evalSource("now() + 1h", {
      now: () => fixedNow,
    });
    expect(plusDuration.kind).toBe("time");
    if (plusDuration.kind !== "time") {
      throw new Error("Expected time runtime value");
    }
    expect(plusDuration.value.getTime()).toBe(
      fixedNow.getTime() + 60 * 60 * 1000
    );

    const minusDuration = evalSource("now() - 30m", {
      now: () => fixedNow,
    });
    expect(minusDuration.kind).toBe("time");
    if (minusDuration.kind !== "time") {
      throw new Error("Expected time runtime value");
    }
    expect(minusDuration.value.getTime()).toBe(
      fixedNow.getTime() - 30 * 60 * 1000
    );

    const durationOnLeft = evalSource("30m + now()", {
      now: () => fixedNow,
    });
    expect(durationOnLeft.kind).toBe("time");
    if (durationOnLeft.kind !== "time") {
      throw new Error("Expected time runtime value");
    }
    expect(durationOnLeft.value.getTime()).toBe(
      fixedNow.getTime() + 30 * 60 * 1000
    );
  });
});

describe("evaluateExpressionAst - comparison and boolean operators", () => {
  it("evaluates numeric comparisons", () => {
    const less = evalSource("1 < 2");
    expect(less.kind).toBe("boolean");
    if (less.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(less.value).toBe(true);

    const greaterOrEqual = evalSource("2 >= 2");
    expect(greaterOrEqual.kind).toBe("boolean");
    if (greaterOrEqual.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(greaterOrEqual.value).toBe(true);

    const equal = evalSource("3 == 3");
    expect(equal.kind).toBe("boolean");
    if (equal.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(equal.value).toBe(true);
  });

  it("evaluates time comparisons", () => {
    const fixedNow = new Date(2020, 0, 1, 0, 0, 0);

    const greaterThan = evalSource("now() > now() - 1h", {
      now: () => fixedNow,
    });
    expect(greaterThan.kind).toBe("boolean");
    if (greaterThan.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(greaterThan.value).toBe(true);

    const equalTimes = evalSource("now() == now()", {
      now: () => fixedNow,
    });
    expect(equalTimes.kind).toBe("boolean");
    if (equalTimes.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(equalTimes.value).toBe(true);
  });

  it("evaluates boolean and/or operators", () => {
    const andResult = evalSource("true and false");
    expect(andResult.kind).toBe("boolean");
    if (andResult.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(andResult.value).toBe(false);

    const orResult = evalSource("true or false");
    expect(orResult.kind).toBe("boolean");
    if (orResult.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(orResult.value).toBe(true);

    const compound = evalSource("1 < 2 and 3 < 4");
    expect(compound.kind).toBe("boolean");
    if (compound.kind !== "boolean") {
      throw new Error("Expected boolean runtime value");
    }
    expect(compound.value).toBe(true);
  });
});

describe("evaluateExpressionAst - function calls", () => {
  it("returns an error for unknown functions", () => {
    const program = expectOkR(parseProgram("not_a_function(1)"));
    const expr = program.statements[0]?.expression;
    invariant(expr, "Expected an expression statement");
    const result = evaluateExpressionAst(expr, makeEvalContext());

    const error = expectErrR(result);

    expect(String(error instanceof Error ? error.message : "")).toContain(
      "not implemented yet"
    );
  });
});

describe("evaluateChartBinaryArithmetic", () => {
  it("returns an error when charts are not aligned by length", () => {
    const chartA = makeTimeSeriesChart([1, 2, 3]);
    const chartB = makeTimeSeriesChart([10, 20]);

    const result = evaluateChartBinaryArithmetic("+", chartA, chartB);
    const error = expectErrR(result);

    expect(String(error instanceof Error ? error.message : "")).toContain(
      "Chart arithmetic requires aligned charts"
    );
  });

  it("returns an error when domain types are incompatible", () => {
    const timeDomain = createTimeDomain("UTC");
    const numericDomain = createNumericDomain("units");

    const timeChart = createChart(timeDomain, [
      { x: new Date(2020, 0, 1, 0, 0, 0), y: 1 },
    ]);

    const numericChart = createChart(numericDomain, [{ x: 0, y: 2 }]);

    const result = evaluateChartBinaryArithmetic("+", timeChart, numericChart);
    const error = expectErrR(result);

    expect(String(error instanceof Error ? error.message : "")).toContain(
      "Chart arithmetic requires aligned charts"
    );
  });

  it("returns an error when domain values differ", () => {
    const baseChart = makeTimeSeriesChart([1, 2, 3]);

    const domain = createTimeDomain("UTC");
    const misalignedPoints = [
      { x: new Date(2020, 0, 1, 0, 1), y: 10 },
      { x: new Date(2020, 0, 1, 0, 2), y: 20 },
      { x: new Date(2020, 0, 1, 0, 3), y: 30 },
    ];

    const misalignedChart = createChart(domain, misalignedPoints);

    const result = evaluateChartBinaryArithmetic(
      "+",
      baseChart,
      misalignedChart
    );
    const error = expectErrR(result);

    expect(String(error instanceof Error ? error.message : "")).toContain(
      "Chart arithmetic requires aligned charts"
    );
  });

  it("treats two empty charts as aligned", () => {
    const emptyA = makeEmptyTimeSeriesChart();
    const emptyB = makeEmptyTimeSeriesChart();

    const result = evaluateChartBinaryArithmetic("+", emptyA, emptyB);
    const chart = expectOkR(result);

    expect(chart.points.length).toBe(0);
    expect(chart.domain).toBe(emptyA.domain);
  });

  it("performs per-point arithmetic on aligned charts", () => {
    const chartA = makeTimeSeriesChart([1, 2, 3]);
    const chartB = makeTimeSeriesChart([10, 20, 30]);

    const sumResult = evaluateChartBinaryArithmetic("+", chartA, chartB);
    const sumChart = expectOkR(sumResult);
    expect(sumChart.points.map((p) => p.y)).toEqual([11, 22, 33]);

    const diffResult = evaluateChartBinaryArithmetic("-", chartB, chartA);
    const diffChart = expectOkR(diffResult);
    expect(diffChart.points.map((p) => p.y)).toEqual([9, 18, 27]);

    const productResult = evaluateChartBinaryArithmetic("*", chartA, chartB);
    const productChart = expectOkR(productResult);
    expect(productChart.points.map((p) => p.y)).toEqual([10, 40, 90]);

    const quotientResult = evaluateChartBinaryArithmetic("/", chartB, chartA);
    const quotientChart = expectOkR(quotientResult);
    expect(quotientChart.points.map((p) => p.y)).toEqual([10, 10, 10]);
  });
});

describe("evaluateChartScalarArithmetic", () => {
  it("applies the scalar on the right-hand side", () => {
    const chart = makeNumericChart([1, 2, 3], "units");

    const plusChart = evaluateChartScalarArithmetic("+", chart, 10, false);
    expect(plusChart.points.map((p) => p.y)).toEqual([11, 12, 13]);

    const minusChart = evaluateChartScalarArithmetic("-", chart, 1, false);
    expect(minusChart.points.map((p) => p.y)).toEqual([0, 1, 2]);

    const timesChart = evaluateChartScalarArithmetic("*", chart, 2, false);
    expect(timesChart.points.map((p) => p.y)).toEqual([2, 4, 6]);

    const divideChart = evaluateChartScalarArithmetic("/", chart, 2, false);
    expect(divideChart.points.map((p) => p.y)).toEqual([0.5, 1, 1.5]);
  });

  it("applies the scalar on the left-hand side when requested", () => {
    const chart = makeNumericChart([1, 2, 4], "units");

    const minusChart = evaluateChartScalarArithmetic("-", chart, 10, true);
    expect(minusChart.points.map((p) => p.y)).toEqual([9, 8, 6]);

    const divideChart = evaluateChartScalarArithmetic("/", chart, 8, true);
    expect(divideChart.points.map((p) => p.y)).toEqual([8, 4, 2]);
  });
});
