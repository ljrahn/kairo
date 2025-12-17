import { describe, it, expect } from "vitest";
import { parseProgram } from "~/dsl";
import { expectOkR, expectErrR } from "~/test";
import type {
  IProgram,
  IAssignmentStatement,
  IExpressionStatement,
} from "~/ast";
import {
  expectExpression,
  expectLiteral,
  expectIdentifier,
  expectFunctionCall,
  expectBinaryExpression,
  expectNamedArgument,
  expectUnaryExpression,
} from "./parser-test-helper";

function expectProgram(result: unknown): IProgram {
  if (!result || typeof result !== "object" || !("kind" in result)) {
    throw new Error("Expected program AST result");
  }
  const program = result as { kind: string };
  if (program.kind !== "Program") {
    throw new Error(`Expected Program AST, got ${program.kind}`);
  }
  return result as IProgram;
}

function expectAssignmentStatement(
  statement: unknown,
  expectedName?: string
): IAssignmentStatement {
  if (!statement || typeof statement !== "object" || !("kind" in statement)) {
    throw new Error("Expected statement node");
  }
  const value = statement as { kind: string };
  if (value.kind !== "AssignmentStatement") {
    throw new Error(`Expected AssignmentStatement, got ${value.kind}`);
  }
  const assignment = statement as IAssignmentStatement;
  if (expectedName !== undefined) {
    expect(assignment.name).toBe(expectedName);
  }
  return assignment;
}

function expectExpressionStatement(statement: unknown): IExpressionStatement {
  if (!statement || typeof statement !== "object" || !("kind" in statement)) {
    throw new Error("Expected statement node");
  }
  const value = statement as { kind: string };
  if (value.kind !== "ExpressionStatement") {
    throw new Error(`Expected ExpressionStatement, got ${value.kind}`);
  }
  return statement as IExpressionStatement;
}

describe("dsl parser - programs", () => {
  it("wraps a single expression as an expression statement", () => {
    const result = parseProgram("1 + 2 * 3");
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(1);
    const statement = expectExpressionStatement(program.statements[0]);

    const expr = expectExpression(statement.expression);
    const binary = expectBinaryExpression(expr);

    // (1) + (2 * 3)
    expect(binary.operator).toBe("+");

    const leftLiteral = expectLiteral(expectExpression(binary.left));
    expect(leftLiteral.value).toBe(1);

    const rightBinary = expectBinaryExpression(expectExpression(binary.right));
    expect(rightBinary.operator).toBe("*");
  });

  it("parses a single assignment statement", () => {
    const result = parseProgram("A = 1 + 2");
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(1);
    const assignment = expectAssignmentStatement(program.statements[0], "A");

    const expr = expectExpression(assignment.expression);
    const binary = expectBinaryExpression(expr);
    expect(binary.operator).toBe("+");

    const leftLiteral = expectLiteral(expectExpression(binary.left));
    const rightLiteral = expectLiteral(expectExpression(binary.right));
    expect(leftLiteral.value).toBe(1);
    expect(rightLiteral.value).toBe(2);
  });

  it("parses multiple assignment statements separated by semicolons", () => {
    const result = parseProgram("A = 1; B = A + 2");
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(2);

    expectAssignmentStatement(program.statements[0], "A");
    const second = expectAssignmentStatement(program.statements[1], "B");

    const secondExpr = expectExpression(second.expression);
    const secondBinary = expectBinaryExpression(secondExpr);
    const secondLeft = expectIdentifier(expectExpression(secondBinary.left));
    expect(secondLeft.name).toBe("A");
  });

  it("parses a mix of assignment and expression statements", () => {
    const result = parseProgram("A = 1; A + 2");
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(2);

    const first = expectAssignmentStatement(program.statements[0], "A");
    expect(first.kind).toBe("AssignmentStatement");

    const second = expectExpressionStatement(program.statements[1]);
    const expr = expectExpression(second.expression);
    const binary = expectBinaryExpression(expr);

    const left = expectIdentifier(expectExpression(binary.left));
    expect(left.name).toBe("A");
  });

  it("allows an optional trailing semicolon without creating extra statements", () => {
    const resultWith = parseProgram("A = 1; B = 2;");
    const programWith = expectProgram(expectOkR(resultWith));

    expect(programWith.statements).toHaveLength(2);
    expectAssignmentStatement(programWith.statements[0], "A");
    expectAssignmentStatement(programWith.statements[1], "B");
  });

  it("treats newlines as whitespace between statements", () => {
    const source = ["A = 1 + 2;", "B = A + 3", ";", "C = B * 2"].join("\n");

    const result = parseProgram(source);
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(3);
    expectAssignmentStatement(program.statements[0], "A");
    expectAssignmentStatement(program.statements[1], "B");
    expectAssignmentStatement(program.statements[2], "C");
  });

  it("parses complex statements with function calls and named arguments", () => {
    const result = parseProgram(
      'A = moving_avg(Revenue, 7d); align(A, to=Revenue, method="linear")'
    );
    const program = expectProgram(expectOkR(result));

    expect(program.statements).toHaveLength(2);

    const assign = expectAssignmentStatement(program.statements[0], "A");
    const assignCall = expectFunctionCall(expectExpression(assign.expression));
    expect(assignCall.name).toBe("moving_avg");
    expect(assignCall.args).toHaveLength(2);

    const exprStmt = expectExpressionStatement(program.statements[1]);
    const exprCall = expectFunctionCall(expectExpression(exprStmt.expression));
    expect(exprCall.name).toBe("align");
    expect(exprCall.args).toHaveLength(3);

    const [, toArgRaw, methodArgRaw] = exprCall.args;
    const toArg = expectNamedArgument(expectExpression(toArgRaw));
    expect(toArg.name).toBe("to");
    const toValue = expectIdentifier(expectExpression(toArg.value));
    expect(toValue.name).toBe("Revenue");

    const methodArg = expectNamedArgument(expectExpression(methodArgRaw));
    expect(methodArg.name).toBe("method");
    const methodValue = expectLiteral(expectExpression(methodArg.value));
    expect(methodValue.literalType).toBe("string");
    expect(methodValue.value).toBe("linear");
  });

  describe("error handling", () => {
    it("requires at least one statement", () => {
      const result = parseProgram("");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
      expect(first.location).toBeDefined();
    });

    it("fails on incomplete assignment", () => {
      const result = parseProgram("A =");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
    });

    it("returns lexer errors for invalid characters in programs", () => {
      const result = parseProgram("A # B;");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);

      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Lexer error");
      expect(first.location).toBeDefined();
    });

    it("returns parser errors for invalid program syntax", () => {
      const result = parseProgram("A = 1 +");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);

      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
      expect(first.location).toBeDefined();
    });

    it("returns parser errors for invalid expression syntax", () => {
      const result = parseProgram("A +");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
    });

    it("does not allow empty statements between semicolons", () => {
      const result = parseProgram("A = 1;; B = 2");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
    });

    it("requires semicolons between statements even with newlines", () => {
      const result = parseProgram("A = 1\nB = 2");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
    });

    it("does not allow chained comparison operators in expressions", () => {
      const result = parseProgram("A > 1 > 2;");
      const errors = expectErrR(result);

      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      const first = errors[0]!;
      expect(first.code).toBe("PARSE_ERROR");
      expect(first.message).toContain("Parser error");
    });
  });

  describe("dsl program parser - literals", () => {
    it("parses number literals", () => {
      const result = parseProgram("42");
      const program = expectProgram(expectOkR(result));

      expect(program.statements).toHaveLength(1);
      const stmt = expectExpressionStatement(program.statements[0]);
      const literal = expectLiteral(expectExpression(stmt.expression));
      expect(literal.literalType).toBe("number");
      expect(literal.value).toBe(42);
    });

    it("parses boolean literals", () => {
      const resultTrue = parseProgram("true");
      const programTrue = expectProgram(expectOkR(resultTrue));
      const stmtTrue = expectExpressionStatement(programTrue.statements[0]);
      const literalTrue = expectLiteral(expectExpression(stmtTrue.expression));
      expect(literalTrue.literalType).toBe("boolean");
      expect(literalTrue.value).toBe(true);

      const resultFalse = parseProgram("false");
      const programFalse = expectProgram(expectOkR(resultFalse));
      const stmtFalse = expectExpressionStatement(programFalse.statements[0]);
      const literalFalse = expectLiteral(
        expectExpression(stmtFalse.expression)
      );
      expect(literalFalse.literalType).toBe("boolean");
      expect(literalFalse.value).toBe(false);
    });

    it("parses string literals", () => {
      const result = parseProgram('"hello"');
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const literal = expectLiteral(expectExpression(stmt.expression));
      expect(literal.literalType).toBe("string");
      expect(literal.value).toBe("hello");
    });

    it("parses duration literals", () => {
      const result = parseProgram("7d");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const literal = expectLiteral(expectExpression(stmt.expression));
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
        const result = parseProgram(input);
        const program = expectProgram(expectOkR(result));
        const stmt = expectExpressionStatement(program.statements[0]);
        const literal = expectLiteral(expectExpression(stmt.expression));

        expect(literal.literalType).toBe("duration");
        const duration = literal.value as { value: number; unit: string };
        expect(duration.value).toBe(value);
        expect(duration.unit).toBe(unit);
      }
    });
  });

  describe("dsl program parser - identifiers and function calls", () => {
    it("parses bare identifiers", () => {
      const result = parseProgram("Revenue_2024");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const identifier = expectIdentifier(expectExpression(stmt.expression));
      expect(identifier.name).toBe("Revenue_2024");
    });

    it("parses function calls with no args", () => {
      const result = parseProgram("now()");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));
      expect(call.name).toBe("now");
      expect(call.args).toHaveLength(0);
    });

    it("parses function calls with positional args", () => {
      const result = parseProgram("moving_avg(A, 7d)");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));
      expect(call.name).toBe("moving_avg");
      expect(call.args).toHaveLength(2);

      const [chartArgRaw, durationArgRaw] = call.args;
      const chartArg = expectIdentifier(expectExpression(chartArgRaw));
      const durationArg = expectLiteral(expectExpression(durationArgRaw));

      expect(durationArg.literalType).toBe("duration");
      expect(chartArg.name).toBe("A");
    });

    it("parses function calls with named args", () => {
      const result = parseProgram('align(B, to=A, method="linear")');
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));
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
      const result = parseProgram("filter(A, value > 0 and value < 10)");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));
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
      const result = parseProgram("filter(A, time >= now() - 30d)");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));
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

  describe("dsl program parser - locations", () => {
    it("sets program location based on its statements", () => {
      const source = "A = 1 + 2";
      const result = parseProgram(source);
      const program = expectProgram(expectOkR(result));

      expect(program.location).toBeDefined();
      expect(program.location.offset).toBe(0);
      // program location should at least cover the assignment statement
      const stmt = expectAssignmentStatement(program.statements[0], "A");
      const stmtEnd = stmt.location.offset + (stmt.location.length ?? 0);
      const programEnd =
        program.location.offset + (program.location.length ?? 0);
      expect(programEnd).toBeGreaterThanOrEqual(stmtEnd);
    });

    it("assigns concrete locations to a simple assignment expression", () => {
      const source = "A = 1 + 2";
      const result = parseProgram(source);
      const program = expectProgram(expectOkR(result));

      // "A = 1 + 2"
      //  012345678
      //  A(0) 1(4) +(6) 2(8)
      const stmt = expectAssignmentStatement(program.statements[0], "A");
      expect(stmt.location.offset).toBe(0);
      expect(stmt.location.length).toBe(source.length);

      const expr = expectExpression(stmt.expression);
      const binary = expectBinaryExpression(expr);

      expect(binary.location.offset).toBe(4); // starts at "1"
      expect(binary.location.length).toBe(5); // "1 + 2" spans indices 4-8

      const left = expectLiteral(expectExpression(binary.left));
      expect(left.location.offset).toBe(4);
      expect(left.location.length).toBe(1);

      const right = expectLiteral(expectExpression(binary.right));
      expect(right.location.offset).toBe(8);
      expect(right.location.length).toBe(1);
    });

    it("assigns concrete locations to function calls and named arguments", () => {
      const source = 'align(A, to=B, method="linear")';
      const result = parseProgram(source);
      const program = expectProgram(expectOkR(result));

      const stmt = expectExpressionStatement(program.statements[0]);
      const call = expectFunctionCall(expectExpression(stmt.expression));

      expect(call.location.offset).toBe(0);
      expect(call.location.length).toBe(source.length);

      const [, toArgRaw] = call.args;
      const toArg = expectNamedArgument(expectExpression(toArgRaw));
      expect(toArg.location).toBeDefined();
      expect(toArg.value.location.offset).toBeGreaterThan(
        toArg.location.offset
      );
    });
  });

  describe("dsl program parser - operator precedence and associativity", () => {
    it("respects multiplication over addition", () => {
      const result = parseProgram("1 + 2 * 3");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

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
      const result = parseProgram("1 - 2 - 3");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

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
      const result = parseProgram("A > 1 and B < 2 or C == 3");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

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

    it("parses ! with correct precedence", () => {
      const result = parseProgram("!A and B");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const binary = expectBinaryExpression(expr);

      // (!A) and B
      expect(binary.operator).toBe("and");

      const leftExpr = expectExpression(binary.left);
      const rightExpr = expectExpression(binary.right);

      const left = expectUnaryExpression(leftExpr);
      expect(left.operator).toBe("!");

      const right = expectIdentifier(rightExpr);
      expect(right.name).toBe("B");
    });

    it("parses parenthesized expressions", () => {
      const result = parseProgram("!(A and B)");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const unary = expectUnaryExpression(expr);
      expect(unary.operator).toBe("!");

      const innerExpr = expectExpression(unary.operand);
      const inner = expectBinaryExpression(innerExpr);
      expect(inner.operator).toBe("and");
    });

    it("respects division over addition", () => {
      const result = parseProgram("1 + 2 / 4");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const binary = expectBinaryExpression(expr);

      // (1) + (2 / 4)
      expect(binary.operator).toBe("+");

      const left = expectLiteral(expectExpression(binary.left));
      expect(left.value).toBe(1);

      const right = expectBinaryExpression(expectExpression(binary.right));
      expect(right.operator).toBe("/");
    });

    it("parses unary minus with correct precedence", () => {
      const result = parseProgram("-1 + 2");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const binary = expectBinaryExpression(expr);
      expect(binary.operator).toBe("+");

      const leftUnary = expectUnaryExpression(expectExpression(binary.left));
      expect(leftUnary.operator).toBe("-");

      const leftInner = expectLiteral(expectExpression(leftUnary.operand));
      expect(leftInner.value).toBe(1);

      const rightLiteral = expectLiteral(expectExpression(binary.right));
      expect(rightLiteral.value).toBe(2);
    });

    it("parses parenthesized unary minus expressions", () => {
      const result = parseProgram("-(1 + 2)");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const unary = expectUnaryExpression(expr);
      expect(unary.operator).toBe("-");

      const innerBinary = expectBinaryExpression(
        expectExpression(unary.operand)
      );
      expect(innerBinary.operator).toBe("+");
    });

    it("parses greater-than-or-equal and less-than-or-equal", () => {
      const greaterResult = parseProgram("A >= 1");
      const greaterProgram = expectProgram(expectOkR(greaterResult));
      const greaterStmt = expectExpressionStatement(
        greaterProgram.statements[0]
      );
      const greaterExpr = expectExpression(greaterStmt.expression);
      const greaterBinary = expectBinaryExpression(greaterExpr);
      expect(greaterBinary.operator).toBe(">=");

      const lessResult = parseProgram("A <= 1");
      const lessProgram = expectProgram(expectOkR(lessResult));
      const lessStmt = expectExpressionStatement(lessProgram.statements[0]);
      const lessExpr = expectExpression(lessStmt.expression);
      const lessBinary = expectBinaryExpression(lessExpr);
      expect(lessBinary.operator).toBe("<=");
    });

    it("parses boolean expressions on boolean literals", () => {
      const result = parseProgram("!true or false");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

      const binary = expectBinaryExpression(expr);
      expect(binary.operator).toBe("or");

      const leftExpr = expectExpression(binary.left);
      const rightExpr = expectExpression(binary.right);

      const leftUnary = expectUnaryExpression(leftExpr);
      expect(leftUnary.operator).toBe("!");

      const innerLiteral = expectLiteral(expectExpression(leftUnary.operand));
      expect(innerLiteral.literalType).toBe("boolean");
      expect(innerLiteral.value).toBe(true);

      const rightLiteral = expectLiteral(rightExpr);
      expect(rightLiteral.literalType).toBe("boolean");
      expect(rightLiteral.value).toBe(false);
    });

    it("honors parentheses around comparison expressions", () => {
      const result = parseProgram("(A > 1 and B < 2) or C == 3");
      const program = expectProgram(expectOkR(result));
      const stmt = expectExpressionStatement(program.statements[0]);
      const expr = expectExpression(stmt.expression);

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
});
