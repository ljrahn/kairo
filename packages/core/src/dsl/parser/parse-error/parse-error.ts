import { BaseError } from "../../../utils";
import type { IErrorLocation } from "./types";

export class ParseError extends BaseError {
  readonly code = "PARSE_ERROR";
  readonly location?: IErrorLocation;

  constructor(
    message: string,
    options: {
      userMessage?: string;
      location?: IErrorLocation;
      cause?: unknown;
    } = {}
  ) {
    super(message, { userMessage: options.userMessage, cause: options.cause });
    this.location = options.location;
  }

  static atLocation(
    message: string,
    userMessage: string,
    location: IErrorLocation
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
