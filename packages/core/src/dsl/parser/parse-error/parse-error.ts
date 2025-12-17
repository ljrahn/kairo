import { BaseError } from "../../../utils";
import type { IAstLocation } from "../../../ast";

export class ParseError extends BaseError {
  readonly code = "PARSE_ERROR";
  readonly location?: IAstLocation;

  constructor(
    message: string,
    options: {
      userMessage?: string;
      location?: IAstLocation;
      cause?: unknown;
    } = {}
  ) {
    super(message, { userMessage: options.userMessage, cause: options.cause });
    this.location = options.location;
  }

  static atLocation(
    message: string,
    userMessage: string,
    location: IAstLocation
  ): ParseError {
    return new ParseError(message, { userMessage, location });
  }

  static general(message: string, userMessage: string): ParseError {
    return new ParseError(message, { userMessage });
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), location: this.location };
  }
}
