import { BaseError } from "../../../utils";
import { IValueType, valueTypeToString } from "../../../domain";
import type { IAstLocation } from "../../../ast";

export class TypeCheckError extends BaseError {
  readonly code = "TYPE_ERROR";
  readonly expected: IValueType | IValueType[];
  readonly actual: IValueType;
  readonly context?: string;
  readonly location?: IAstLocation;

  constructor(
    message: string,
    userMessage: string,
    expected: IValueType | IValueType[],
    actual: IValueType,
    location: IAstLocation,
    context?: string
  ) {
    super(message, { userMessage });
    this.expected = expected;
    this.actual = actual;
    this.context = context;
    this.location = location;
  }

  static operator(
    operator: string,
    leftType: IValueType,
    rightType: IValueType,
    location: IAstLocation
  ): TypeCheckError {
    const leftStr = valueTypeToString(leftType);
    const rightStr = valueTypeToString(rightType);
    const message = `Operator '${operator}' cannot be applied to types ${leftStr} and ${rightStr}`;
    const userMessage = `Cannot use '${operator}' with ${leftStr} and ${rightStr}`;
    return new TypeCheckError(
      message,
      userMessage,
      [{ kind: "number" }, { kind: "boolean" }],
      leftType,
      location,
      `operator '${operator}'`
    );
  }

  static argument(
    functionName: string,
    argumentIndex: number,
    expected: IValueType | IValueType[],
    actual: IValueType,
    location: IAstLocation
  ): TypeCheckError {
    const expectedStr = Array.isArray(expected)
      ? expected.map(valueTypeToString).join(" or ")
      : valueTypeToString(expected);
    const actualStr = valueTypeToString(actual);
    const message = `Function '${functionName}' argument ${argumentIndex + 1}: expected ${expectedStr}, got ${actualStr}`;
    const userMessage = `Argument ${argumentIndex + 1} of function '${functionName}' must be ${expectedStr}, got ${actualStr}`;
    return new TypeCheckError(
      message,
      userMessage,
      expected,
      actual,
      location,
      `${functionName} argument ${argumentIndex + 1}`
    );
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      expected: Array.isArray(this.expected)
        ? this.expected.map(valueTypeToString)
        : valueTypeToString(this.expected),
      actual: valueTypeToString(this.actual),
      context: this.context,
      location: this.location,
    };
  }
}
