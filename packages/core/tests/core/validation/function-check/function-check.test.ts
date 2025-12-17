import { describe, it, expect } from "vitest";
import { expectOkR, expectErrR } from "~/test";
import { FunctionError } from "~/functions";
import { validate } from "./function-check-test-helper";

describe("function-check - moving_avg", () => {
  it("accepts a positive window duration", () => {
    const result = validate("moving_avg(A, 7d)");
    expectOkR(result);
  });

  it("rejects zero window duration", () => {
    const result = validate("moving_avg(A, 0h)");
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be greater than zero");
  });
});

describe("function-check - resample", () => {
  it("accepts a positive window with no method", () => {
    const result = validate("resample(A, window=1h)");
    expectOkR(result);
  });

  it("accepts a positive window with valid method", () => {
    const result = validate('resample(A, window=1h, method="mean")');
    expectOkR(result);
  });

  it("rejects zero window", () => {
    const result = validate("resample(A, window=0h)");
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be greater than zero");
  });

  it("rejects invalid method values", () => {
    const result = validate('resample(A, window=1h, method="cubic")');
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be one of");
  });

  it("rejects non-literal method expressions", () => {
    const result = validate("resample(A, window=1h, method=foo)");
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be a string literal");
  });
});

describe("function-check - align", () => {
  it("accepts valid method literals", () => {
    const result = validate('align(B, to=A, method="linear")');
    expectOkR(result);
  });

  it("rejects invalid method literals", () => {
    const result = validate('align(B, to=A, method="nearest")');
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be one of");
  });

  it("rejects non-literal method expressions", () => {
    const result = validate("align(B, to=A, method=foo)");
    const error = expectErrR(result);

    expect(error).toBeInstanceOf(FunctionError);
    expect(error.message).toContain("must be a string literal");
  });
});
