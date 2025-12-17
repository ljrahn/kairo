import { describe, it, expect } from "vitest";
import { type ITypeCheckContext } from "~/validation";
import {
  createNumericDomain,
  createChart,
  type IValueType,
  IChart,
} from "~/domain";
import {
  expectType,
  expectTypeCheckError,
  makeContextWithCharts,
} from "./type-check-test-helper";

describe("expression type-checker - literals and identifiers", () => {
  const emptyCtx = makeContextWithCharts([]);

  it("infers primitive literal types", () => {
    expectType("1", emptyCtx, { kind: "number" });
    expectType("true", emptyCtx, { kind: "boolean" });
    expectType('"hello"', emptyCtx, { kind: "string" });
    expectType("7d", emptyCtx, { kind: "duration" });
  });

  it("infers now() as time", () => {
    expectType("now()", emptyCtx, { kind: "time" });
  });

  it("resolves known chart identifiers", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("A", ctx, { kind: "chart", domainType: "time" });
  });

  it("errors on unknown identifiers", () => {
    const ctx = makeContextWithCharts([]);
    const error = expectTypeCheckError("MissingChart", ctx);

    expect(error.message).toContain("Unknown identifier");
  });

  it("prefers variables over charts with the same name", () => {
    const baseCtx = makeContextWithCharts(["A"]);
    const variables = new Map<string, IValueType>([["A", { kind: "number" }]]);
    const ctx: ITypeCheckContext = { ...baseCtx, variables };

    expectType("A + 1", ctx, { kind: "number" });
  });
});

describe("type-checker - arithmetic operators", () => {
  const emptyCtx = makeContextWithCharts([]);

  it("supports number + number arithmetic", () => {
    expectType("1 + 2", emptyCtx, { kind: "number" });
  });

  it("supports chart + number arithmetic", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("A + 1", ctx, { kind: "chart", domainType: "time" });
  });

  it("supports number + chart arithmetic", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("1 + A", ctx, { kind: "chart", domainType: "time" });
  });

  it("supports chart + chart arithmetic for same domain", () => {
    const ctx = makeContextWithCharts(["A", "B"]);
    expectType("A + B", ctx, { kind: "chart", domainType: "time" });
  });

  it("rejects chart arithmetic for mismatched domains", () => {
    const timeCtx = makeContextWithCharts(["T"]);
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map(timeCtx.inputCharts);
    inputCharts.set("N", numericChart);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("T + N", ctx);
    expect(error.message).toContain("Operator");
  });

  it("supports time +/- duration", () => {
    expectType("now() + 7d", emptyCtx, { kind: "time" });
    expectType("now() - 7d", emptyCtx, { kind: "time" });
    expectType("7d + now()", emptyCtx, { kind: "time" });
  });

  it("rejects invalid time/duration arithmetic", () => {
    const addError = expectTypeCheckError("now() + 1", emptyCtx);
    expect(addError.message).toContain("Operator");

    const subtractError = expectTypeCheckError("7d - now()", emptyCtx);
    expect(subtractError.message).toContain("Operator");
  });

  it("rejects arithmetic on incompatible types", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("A + true", ctx);

    expect(error.message).toContain("Operator");
  });
});

describe("type-checker - comparison and boolean operators", () => {
  const emptyCtx = makeContextWithCharts([]);

  it("supports numeric comparisons", () => {
    expectType("1 > 2", emptyCtx, { kind: "boolean" });
  });

  it("supports time comparisons", () => {
    expectType("now() > now()", emptyCtx, { kind: "boolean" });
  });

  it("supports boolean equality", () => {
    expectType("true == false", emptyCtx, { kind: "boolean" });
  });

  it("rejects comparisons for incompatible types", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("A > 1", ctx);

    expect(error.message).toContain("Operator");
  });

  it("supports boolean and/or", () => {
    expectType("true and false", emptyCtx, { kind: "boolean" });
    expectType("true or false", emptyCtx, { kind: "boolean" });
  });

  it("rejects boolean operators on non-boolean operands", () => {
    const error = expectTypeCheckError("1 and true", emptyCtx);
    expect(error.message).toContain("Operator 'and'");
  });
});

describe("type-checker - unary operators", () => {
  const emptyCtx = makeContextWithCharts([]);

  it("supports logical not for booleans", () => {
    expectType("!true", emptyCtx, { kind: "boolean" });
  });

  it("rejects logical not for non-boolean operands", () => {
    const error = expectTypeCheckError("!1", emptyCtx);
    expect(error.message.toLowerCase()).toContain("operator");
  });

  it("supports unary minus for numbers", () => {
    expectType("-1", emptyCtx, { kind: "number" });
  });

  it("rejects unary minus for non-number operands", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("-A", ctx);

    expect(error.message.toLowerCase()).toContain("operator");
  });
});

describe("type-checker - core functions", () => {
  it("types moving_avg for a time-series chart", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("moving_avg(A, 7d)", ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("rejects moving_avg with non-chart first argument", () => {
    const ctx = makeContextWithCharts([]);
    const error = expectTypeCheckError("moving_avg(1, 7d)", ctx);

    expect(error.message).toContain("argument 1");
  });

  it("rejects moving_avg with non-duration window", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("moving_avg(A, 1)", ctx);

    expect(error.message).toContain("argument 2");
  });

  it("rejects moving_avg when the chart domain is not time", () => {
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map<string, IChart<"numeric">>([
      ["N", numericChart],
    ]);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("moving_avg(N, 7d)", ctx);
    expect(error.message).toContain("argument 1");
  });

  it("types normalize for a time-series chart", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("normalize(A)", ctx, { kind: "chart", domainType: "time" });
  });

  it("rejects normalize for non-time charts", () => {
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map<string, IChart<"numeric">>([
      ["N", numericChart],
    ]);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("normalize(N)", ctx);
    expect(error.message).toContain("argument 1");
  });

  it("types filter with implicit time and value variables", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("filter(A, time >= now() - 30d)", ctx, {
      kind: "chart",
      domainType: "time",
    });
    expectType("filter(A, value > 0)", ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("requires a boolean predicate for filter", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("filter(A, 1)", ctx);

    expect(error.message).toContain("argument 2");
  });

  it("does not expose implicit filter variables outside predicates", () => {
    const ctx = makeContextWithCharts([]);
    const error = expectTypeCheckError("time >= now()", ctx);

    expect(error.message).toContain("Unknown identifier: time");
  });

  it("supports named arguments for align", () => {
    const ctx = makeContextWithCharts(["A", "B"]);
    expectType('align(B, to=A, method="linear")', ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("supports named arguments for resample", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType('resample(A, window=1h, method="linear")', ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("supports optional method parameter for resample", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("resample(A, window=1h)", ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("rejects unknown named arguments", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("resample(A, foo=1h)", ctx);

    expect(error.message).toContain("does not have a parameter named 'foo'");
  });

  it("rejects positional use of named parameters", () => {
    const ctx = makeContextWithCharts(["A", "B"]);
    const error = expectTypeCheckError("align(A, B)", ctx);

    expect(error.message).toContain(
      "does not accept positional argument 2 for a named parameter"
    );
  });

  it("rejects positional arguments after named arguments", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError('resample(A, window=1h, "linear")', ctx);

    expect(error.message).toContain(
      "cannot have positional arguments after named arguments"
    );
  });

  it("rejects duplicate named arguments", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError(
      "resample(A, window=1h, window=1h)",
      ctx
    );

    expect(error.message).toContain(
      "received multiple values for parameter 'window'"
    );
  });

  it("rejects missing required arguments", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("moving_avg(A)", ctx);

    expect(error.message).toContain("argument 2");
  });

  it("rejects unknown functions", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("unknown_fn(A)", ctx);

    expect(error.message).toContain("Unknown function");
  });

  it("types shift for a time-series chart", () => {
    const ctx = makeContextWithCharts(["A"]);
    expectType("shift(A, 7d)", ctx, {
      kind: "chart",
      domainType: "time",
    });
  });

  it("rejects shift with non-chart first argument", () => {
    const ctx = makeContextWithCharts([]);
    const error = expectTypeCheckError("shift(1, 7d)", ctx);

    expect(error.message).toContain("argument 1");
  });

  it("rejects shift with non-duration offset", () => {
    const ctx = makeContextWithCharts(["A"]);
    const error = expectTypeCheckError("shift(A, 1)", ctx);

    expect(error.message).toContain("argument 2");
  });

  it("rejects filter when chart domain is not time", () => {
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map<string, ReturnType<typeof createChart>>([
      ["N", numericChart],
    ]);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("filter(N, value > 0)", ctx);
    expect(error.message).toContain("argument 1");
  });

  it("rejects align when chart domain is not time", () => {
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map<string, IChart<"numeric">>([
      ["N", numericChart],
    ]);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("align(N, to=N)", ctx);
    expect(error.message).toContain("argument 1");
  });

  it("rejects resample when chart domain is not time", () => {
    const numericDomain = createNumericDomain();
    const numericChart = createChart(numericDomain, []);

    const inputCharts = new Map<string, IChart<"numeric">>([
      ["N", numericChart],
    ]);
    const ctx: ITypeCheckContext = { inputCharts, variables: new Map() };

    const error = expectTypeCheckError("resample(N, window=1h)", ctx);
    expect(error.message).toContain("argument 1");
  });
});
