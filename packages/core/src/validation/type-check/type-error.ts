import { BaseError } from "../../utils";
import { IValueType, valueTypeToString } from "../../domain";

export class TypeError extends BaseError {
  readonly code = "TYPE_ERROR";
  readonly expected: IValueType | IValueType[];
  readonly actual: IValueType;
  readonly context?: string;

  constructor(
    message: string,
    userMessage: string,
    expected: IValueType | IValueType[],
    actual: IValueType,
    context?: string
  ) {
    super(message, { userMessage });
    this.expected = expected;
    this.actual = actual;
    this.context = context;
  }

  static mismatch(
    expected: IValueType | IValueType[],
    actual: IValueType,
    context?: string
  ): TypeError {
    const expectedStr = Array.isArray(expected)
      ? expected.map(valueTypeToString).join(" or ")
      : valueTypeToString(expected);
    const actualStr = valueTypeToString(actual);
    const message = `Type mismatch: expected ${expectedStr}, got ${actualStr}${
      context ? ` in ${context}` : ""
    }`;
    const userMessage = `Expected ${expectedStr}, but got ${actualStr}${
      context ? ` in ${context}` : ""
    }`;
    return new TypeError(message, userMessage, expected, actual, context);
  }

  static operator(
    operator: string,
    leftType: IValueType,
    rightType: IValueType
  ): TypeError {
    const leftStr = valueTypeToString(leftType);
    const rightStr = valueTypeToString(rightType);
    const message = `Operator '${operator}' cannot be applied to types ${leftStr} and ${rightStr}`;
    const userMessage = `Cannot use '${operator}' with ${leftStr} and ${rightStr}`;
    return new TypeError(
      message,
      userMessage,
      [{ kind: "number" }, { kind: "boolean" }],
      leftType,
      `operator '${operator}'`
    );
  }

  static argument(
    functionName: string,
    argumentIndex: number,
    expected: IValueType | IValueType[],
    actual: IValueType
  ): TypeError {
    const expectedStr = Array.isArray(expected)
      ? expected.map(valueTypeToString).join(" or ")
      : valueTypeToString(expected);
    const actualStr = valueTypeToString(actual);
    const message = `Function '${functionName}' argument ${argumentIndex + 1}: expected ${expectedStr}, got ${actualStr}`;
    const userMessage = `Argument ${argumentIndex + 1} of function '${functionName}' must be ${expectedStr}, got ${actualStr}`;
    return new TypeError(
      message,
      userMessage,
      expected,
      actual,
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
    };
  }
}
