import { ok, err, type Result } from "neverthrow";
import type {
  IExpression,
  INamedArgument,
  IDurationLiteral,
  IStringLiteral,
  IFunctionCall,
} from "../../ast";
import { FunctionError } from "../errors";

/**
 * Shared helpers for function-level validators.
 */

export function findArgument(
  call: IFunctionCall,
  name: string,
  positionalIndex: number
): IExpression | undefined {
  const named = call.args.find(
    (arg): arg is INamedArgument =>
      arg.kind === "NamedArgument" && arg.name === name
  );

  if (named) {
    return named.value;
  }

  return call.args[positionalIndex];
}

export function asDurationLiteral(
  expr: IExpression,
  functionName: string,
  argumentName: string
): Result<IDurationLiteral, FunctionError> {
  if (expr.kind === "NamedArgument") {
    return asDurationLiteral(expr.value, functionName, argumentName);
  }

  if (expr.kind !== "Literal" || expr.literalType !== "duration") {
    return err(
      FunctionError.invalidArgument(
        functionName,
        argumentName,
        "must be a duration literal like '7d' or '1h'"
      )
    );
  }

  return ok(expr as IDurationLiteral);
}

export function asStringLiteral(
  expr: IExpression,
  functionName: string,
  argumentName: string
): Result<IStringLiteral, FunctionError> {
  if (expr.kind === "NamedArgument") {
    return asStringLiteral(expr.value, functionName, argumentName);
  }

  if (expr.kind !== "Literal" || expr.literalType !== "string") {
    return err(
      FunctionError.invalidArgument(
        functionName,
        argumentName,
        "must be a string literal"
      )
    );
  }

  return ok(expr as IStringLiteral);
}
