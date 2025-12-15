import { BaseError } from "../../utils";
import type { IDomainType } from "../../domain";

export class DomainError extends BaseError {
  readonly code = "DOMAIN_ERROR";
  readonly expected: IDomainType | IDomainType[];
  readonly actual: IDomainType;
  readonly context?: string;

  constructor(
    message: string,
    userMessage: string,
    expected: IDomainType | IDomainType[],
    actual: IDomainType,
    context?: string
  ) {
    super(message, { userMessage });
    this.expected = expected;
    this.actual = actual;
    this.context = context;
  }

  static incompatible(
    functionName: string,
    expected: IDomainType | IDomainType[],
    actual: IDomainType
  ): DomainError {
    const expectedStr = Array.isArray(expected)
      ? expected.join(" or ")
      : expected;
    const message = `Function '${functionName}' requires ${expectedStr} domain, got ${actual}`;
    const userMessage = `Function '${functionName}' only works with ${expectedStr} charts, but received a ${actual} chart`;
    return new DomainError(
      message,
      userMessage,
      expected,
      actual,
      `function '${functionName}'`
    );
  }

  static mismatch(
    leftDomain: IDomainType,
    rightDomain: IDomainType,
    operation: string
  ): DomainError {
    const message = `Cannot ${operation} charts with different domains: ${leftDomain} and ${rightDomain}`;
    const userMessage = `Cannot ${operation} a ${leftDomain} chart with a ${rightDomain} chart`;
    return new DomainError(
      message,
      userMessage,
      leftDomain,
      rightDomain,
      operation
    );
  }

  static unsupported(domain: IDomainType, operation: string): DomainError {
    const message = `Operation '${operation}' is not supported for ${domain} domain`;
    const userMessage = `The ${domain} domain does not support '${operation}'`;
    return new DomainError(
      message,
      userMessage,
      ["time", "numeric", "category"],
      domain,
      operation
    );
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      expected: this.expected,
      actual: this.actual,
      context: this.context,
    };
  }
}
