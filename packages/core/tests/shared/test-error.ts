import { BaseError } from "~/utils";

export class TestError extends BaseError {
  readonly code = "TEST_ERROR";
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    opts: { context?: Record<string, unknown>; cause?: unknown } = {}
  ) {
    const { context, cause } = opts;

    super(message, { cause });
    this.context = context;
  }
}
