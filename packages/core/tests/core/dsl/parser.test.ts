import { describe, it, expect } from "vitest";
import { parse } from "~/dsl";
import { expectErrR, expectOkR, TestError } from "~/test";
import {
  expectExpression,
  expectLiteral,
  expectIdentifier,
  expectFunctionCall,
  expectBinaryExpression,
  expectNamedArgument,
} from "./parser-test-helper";

/**
 * Parser tests focus purely on syntax -> AST shape.
 * No type/domain validation or evaluation is tested here.
 */

describe("dsl parser - literals", () => {
  it("parses number literals", () => {
    const result = parse("42");
    const expr = expectOkR(result);

    const literal = expectLiteral(expr);
    expect(literal.literalType).toBe("number");
    expect(literal.value).toBe(42);
  });

  it("parses boolean literals", () => {
    const resultTrue = parse("true");
    const exprTrue = expectOkR(resultTrue);

    const literalTrue = expectLiteral(exprTrue);
    expect(literalTrue.literalType).toBe("boolean");
    expect(literalTrue.value).toBe(true);

    const resultFalse = parse("false");
    const exprFalse = expectOkR(resultFalse);

    const literalFalse = expectLiteral(exprFalse);
    expect(literalFalse.literalType).toBe("boolean");
    expect(literalFalse.value).toBe(false);
  });

  it("parses string literals", () => {
    const result = parse('"hello"');
    const expr = expectOkR(result);

    const literal = expectLiteral(expr);
    expect(literal.literalType).toBe("string");
    expect(literal.value).toBe("hello");
  });

  it("parses duration literals", () => {
    const result = parse("7d");
    const expr = expectOkR(result);

    const literal = expectLiteral(expr);
    expect(literal.literalType).toBe("duration");
    expect(typeof literal.value).toBe("object");

    if (!literal.value || typeof literal.value !== "object") {
      throw new Error("Expected duration literal value to be an object");
    }

    const duration = literal.value as { value: number; unit: string };
    expect(duration.value).toBe(7);
    expect(duration.unit).toBe("d");
  });

  it("parses various duration literal units", () => {
    const cases = [
      { input: "1h", value: 1, unit: "h" },
      { input: "30m", value: 30, unit: "m" },
      { input: "500ms", value: 500, unit: "ms" },
      { input: "2w", value: 2, unit: "w" },
    ];

    for (const { input, value, unit } of cases) {
      const result = parse(input);
      const expr = expectOkR(result);
      const literal = expectLiteral(expr);

      expect(literal.literalType).toBe("duration");
      const duration = literal.value as { value: number; unit: string };
      expect(duration.value).toBe(value);
      expect(duration.unit).toBe(unit);
    }
  });
});

describe("dsl parser - identifiers and function calls", () => {
  it("parses bare identifiers", () => {
    const result = parse("Revenue_2024");
    const expr = expectOkR(result);

    const identifier = expectIdentifier(expr);
    expect(identifier.name).toBe("Revenue_2024");
  });

  it("parses function calls with no args", () => {
    const result = parse("now()");
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("now");
    expect(call.args).toHaveLength(0);
  });

  it("parses function calls with positional args", () => {
    const result = parse("moving_avg(A, 7d)");
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("moving_avg");
    expect(call.args).toHaveLength(2);

    const [chartArgRaw, durationArgRaw] = call.args;
    const chartArg = expectIdentifier(expectExpression(chartArgRaw));
    const durationArg = expectLiteral(expectExpression(durationArgRaw));

    expect(durationArg.literalType).toBe("duration");
    expect(chartArg.name).toBe("A");
  });

  it("parses function calls with named args", () => {
    const result = parse('align(B, to=A, method="linear")');
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("align");
    expect(call.args).toHaveLength(3);

    const [arg0Raw, arg1Raw, arg2Raw] = call.args;

    const arg0 = expectIdentifier(expectExpression(arg0Raw));
    expect(arg0.name).toBe("B");

    const arg1 = expectNamedArgument(expectExpression(arg1Raw));
    expect(arg1.name).toBe("to");
    const arg1Value = expectIdentifier(expectExpression(arg1.value));
    expect(arg1Value.name).toBe("A");

    const arg2 = expectNamedArgument(expectExpression(arg2Raw));
    expect(arg2.name).toBe("method");
    const arg2Value = expectLiteral(expectExpression(arg2.value));
    expect(arg2Value.literalType).toBe("string");
    expect(arg2Value.value).toBe("linear");
  });

  it("parses nested expressions as function arguments", () => {
    const result = parse("filter(A, value > 0 and value < 10)");
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("filter");
    expect(call.args).toHaveLength(2);

    const [, predicateRaw] = call.args;
    const predicateExpr = expectExpression(predicateRaw);
    const predicate = expectBinaryExpression(predicateExpr);

    expect(predicate.operator).toBe("and");
    const left = expectBinaryExpression(expectExpression(predicate.left));
    const right = expectBinaryExpression(expectExpression(predicate.right));

    expect(left.operator).toBe(">");
    expect(right.operator).toBe("<");
  });

  it("parses filter predicates with time and now", () => {
    const result = parse("filter(A, time >= now() - 30d)");
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("filter");
    expect(call.args).toHaveLength(2);

    const [chartArgRaw, predicateRaw] = call.args;
    const chartIdentifier = expectIdentifier(expectExpression(chartArgRaw));
    expect(chartIdentifier.name).toBe("A");

    const predicateExpr = expectExpression(predicateRaw);
    const predicate = expectBinaryExpression(predicateExpr);
    expect(predicate.operator).toBe(">=");

    const leftIdentifier = expectIdentifier(expectExpression(predicate.left));
    expect(leftIdentifier.name).toBe("time");

    const rightExpr = expectExpression(predicate.right);
    const rightBinary = expectBinaryExpression(rightExpr);
    expect(rightBinary.operator).toBe("-");

    const leftCall = expectFunctionCall(expectExpression(rightBinary.left));
    expect(leftCall.name).toBe("now");

    const rightDuration = expectLiteral(expectExpression(rightBinary.right));
    expect(rightDuration.literalType).toBe("duration");
  });
});

describe("dsl parser - operator precedence and associativity", () => {
  it("respects multiplication over addition", () => {
    const result = parse("1 + 2 * 3");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);

    // (1) + (2 * 3)
    expect(binary.operator).toBe("+");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const left = expectLiteral(leftExpr);
    expect(left.value).toBe(1);

    const right = expectBinaryExpression(rightExpr);
    expect(right.operator).toBe("*");
  });

  it("is left-associative for addition and subtraction", () => {
    const result = parse("1 - 2 - 3");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);

    // (1 - 2) - 3
    expect(binary.operator).toBe("-");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const right = expectLiteral(rightExpr);
    expect(right.value).toBe(3);

    const left = expectBinaryExpression(leftExpr);
    expect(left.operator).toBe("-");
  });

  it("respects boolean vs comparison precedence", () => {
    const result = parse("A > 1 and B < 2 or C == 3");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);

    // (A > 1 and B < 2) or (C == 3)
    expect(binary.operator).toBe("or");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const left = expectBinaryExpression(leftExpr);
    expect(left.operator).toBe("and");

    const right = expectBinaryExpression(rightExpr);
    expect(right.operator).toBe("==");
  });

  it("parses not with correct precedence", () => {
    const result = parse("not A and B");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);

    // (not A) and B
    expect(binary.operator).toBe("and");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const left = expectFunctionCall(leftExpr);
    expect(left.name).toBe("not");
    expect(left.args).toHaveLength(1);

    const right = expectIdentifier(rightExpr);
    expect(right.name).toBe("B");
  });

  it("parses parenthesized expressions", () => {
    const result = parse("not (A and B)");
    const expr = expectOkR(result);

    const call = expectFunctionCall(expr);
    expect(call.name).toBe("not");
    expect(call.args).toHaveLength(1);

    const [innerRaw] = call.args;
    const innerExpr = expectExpression(innerRaw);
    const inner = expectBinaryExpression(innerExpr);
    expect(inner.operator).toBe("and");
  });

  it("respects division over addition", () => {
    const result = parse("1 + 2 / 4");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);

    // (1) + (2 / 4)
    expect(binary.operator).toBe("+");

    const left = expectLiteral(expectExpression(binary.left));
    expect(left.value).toBe(1);

    const right = expectBinaryExpression(expectExpression(binary.right));
    expect(right.operator).toBe("/");
  });

  it("parses greater-than-or-equal and less-than-or-equal", () => {
    const greaterResult = parse("A >= 1");
    const greaterExpr = expectOkR(greaterResult);
    const greaterBinary = expectBinaryExpression(greaterExpr);
    expect(greaterBinary.operator).toBe(">=");

    const lessResult = parse("A <= 1");
    const lessExpr = expectOkR(lessResult);
    const lessBinary = expectBinaryExpression(lessExpr);
    expect(lessBinary.operator).toBe("<=");
  });

  it("parses boolean expressions on boolean literals", () => {
    const result = parse("not true or false");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);
    expect(binary.operator).toBe("or");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const leftCall = expectFunctionCall(leftExpr);
    expect(leftCall.name).toBe("not");
    expect(leftCall.args).toHaveLength(1);

    const [innerRaw] = leftCall.args;
    const innerLiteral = expectLiteral(expectExpression(innerRaw));
    expect(innerLiteral.literalType).toBe("boolean");
    expect(innerLiteral.value).toBe(true);

    const rightLiteral = expectLiteral(rightExpr);
    expect(rightLiteral.literalType).toBe("boolean");
    expect(rightLiteral.value).toBe(false);
  });

  it("honors parentheses around comparison expressions", () => {
    const result = parse("(A > 1 and B < 2) or C == 3");
    const expr = expectOkR(result);

    const binary = expectBinaryExpression(expr);
    expect(binary.operator).toBe("or");

    const leftExpr = expectExpression(binary.left);
    const rightExpr = expectExpression(binary.right);

    const left = expectBinaryExpression(leftExpr);
    expect(left.operator).toBe("and");

    const leftLeft = expectBinaryExpression(expectExpression(left.left));
    const leftRight = expectBinaryExpression(expectExpression(left.right));
    expect(leftLeft.operator).toBe(">");
    expect(leftRight.operator).toBe("<");

    const right = expectBinaryExpression(rightExpr);
    expect(right.operator).toBe("==");
  });
});

describe("dsl parser - error handling", () => {
  it("returns lexer errors for invalid characters", () => {
    const result = parse("A # B");
    const errors = expectErrR(result);

    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);

    const first = errors[0]!;
    expect(first.code).toBe("PARSE_ERROR");
    expect(first.message).toContain("Lexer error");
    expect(first.location).toBeDefined();
    if (!first.location) throw new TestError("Expected location to be defined");
    expect(typeof first.location.line).toBe("number");
    expect(typeof first.location.column).toBe("number");
  });

  it("returns parser errors for invalid syntax", () => {
    const result = parse("A +");
    const errors = expectErrR(result);

    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);

    const first = errors[0]!;
    expect(first.code).toBe("PARSE_ERROR");
    expect(first.message).toContain("Parser error");
    expect(first.location).toBeDefined();
  });

  it("does not allow assignment expressions", () => {
    const result = parse("A = B");
    const errors = expectErrR(result);

    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);

    const first = errors[0]!;
    expect(first.code).toBe("PARSE_ERROR");
    expect(first.message).toContain("Parser error");
  });

  it("does not allow chained comparison operators", () => {
    const result = parse("A > 1 > 2");
    const errors = expectErrR(result);

    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);

    const first = errors[0]!;
    expect(first.code).toBe("PARSE_ERROR");
    expect(first.message).toContain("Parser error");
  });
});
