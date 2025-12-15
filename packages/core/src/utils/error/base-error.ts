export abstract class BaseError extends Error {
  abstract readonly code: string;
  readonly userMessage: string;

  constructor(
    message: string,
    opts: { userMessage?: string; cause?: unknown } = {}
  ) {
    const { userMessage, cause } = opts;
    super(message, { cause });
    this.name = this.constructor.name;
    this.userMessage = userMessage ?? message;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
    };
  }
}
