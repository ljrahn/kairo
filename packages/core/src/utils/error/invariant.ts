import { BaseError } from "./base-error";

export class InvariantError extends BaseError {
  readonly code = "INVARIANT_ERROR";

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      userMessage: "Internal error",
      cause: context,
    });
  }
}

export function invariant(
  condition: unknown,
  message: string,
  context?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    throw new InvariantError(message, context);
  }
}
