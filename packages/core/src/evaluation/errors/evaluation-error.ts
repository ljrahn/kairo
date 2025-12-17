import { BaseError } from "../../utils";
import type { IRuntimeValue } from "../types";

export class EvaluationError extends BaseError {
  readonly code = "EVALUATION_ERROR";
  readonly context?: string;

  constructor(message: string, userMessage?: string, context?: string) {
    super(message, { userMessage });
    this.context = context;
  }

  static unknownIdentifier(name: string): EvaluationError {
    const message = `Unknown identifier: ${name}`;
    const userMessage = `Identifier '${name}' is not defined`;
    return new EvaluationError(message, userMessage, `identifier '${name}'`);
  }

  static unaryOperator(
    operator: string,
    operand: IRuntimeValue
  ): EvaluationError {
    const message = `Operator '${operator}' cannot be applied to runtime value of kind ${operand.kind}`;
    const userMessage = `Cannot use '${operator}' with ${operand.kind}`;
    return new EvaluationError(
      message,
      userMessage,
      `unary operator '${operator}'`
    );
  }

  static binaryOperator(
    operator: string,
    left: IRuntimeValue,
    right: IRuntimeValue
  ): EvaluationError {
    const message = `Operator '${operator}' cannot be applied to runtime kinds ${left.kind} and ${right.kind}`;
    const userMessage = `Cannot use '${operator}' with ${left.kind} and ${right.kind}`;
    return new EvaluationError(
      message,
      userMessage,
      `binary operator '${operator}'`
    );
  }

  static functionNotImplemented(name: string): EvaluationError {
    const message = `Evaluation for function '${name}' is not implemented yet`;
    const userMessage = `Function '${name}' is not implemented yet`;
    return new EvaluationError(message, userMessage, `function '${name}'`);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      context: this.context,
    };
  }
}
