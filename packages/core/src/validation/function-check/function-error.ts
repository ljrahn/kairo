import { BaseError } from "../../utils";

export class FunctionError extends BaseError {
  readonly code = "FUNCTION_ERROR";
  readonly functionName: string;
  readonly context?: string;

  constructor(
    message: string,
    userMessage: string,
    functionName: string,
    context?: string
  ) {
    super(message, { userMessage });
    this.functionName = functionName;
    this.context = context;
  }

  static invalidArgument(
    functionName: string,
    argumentName: string,
    reason: string
  ): FunctionError {
    const message = `Function '${functionName}' received invalid ${argumentName}: ${reason}`;
    const userMessage = `Invalid ${argumentName} for '${functionName}': ${reason}`;
    return new FunctionError(message, userMessage, functionName, argumentName);
  }

  static notFound(functionName: string): FunctionError {
    const message = `Function '${functionName}' does not exist`;
    const userMessage = `Unknown function: '${functionName}'`;
    return new FunctionError(message, userMessage, functionName);
  }

  static argumentCount(
    functionName: string,
    expected: number,
    actual: number
  ): FunctionError {
    const message = `Function '${functionName}' expects ${expected} arguments, got ${actual}`;
    const userMessage = `'${functionName}' requires ${expected} ${
      expected === 1 ? "argument" : "arguments"
    }, but ${actual} ${actual === 1 ? "was" : "were"} provided`;
    return new FunctionError(
      message,
      userMessage,
      functionName,
      "argument count"
    );
  }

  static execution(
    functionName: string,
    reason: string,
    details?: string
  ): FunctionError {
    const message = `Function '${functionName}' execution failed: ${reason}`;
    const userMessage = `Failed to execute '${functionName}': ${reason}`;
    return new FunctionError(message, userMessage, functionName, details);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      functionName: this.functionName,
      context: this.context,
    };
  }
}
