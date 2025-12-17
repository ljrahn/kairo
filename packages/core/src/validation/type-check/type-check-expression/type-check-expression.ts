import { ok, err, Result } from "neverthrow";
import { invariant } from "../../../utils";
import type {
  IFunctionCall,
  IUnaryExpression,
  IBinaryExpression,
  IBinaryOperator,
  IExpression,
  ILiteral,
  IIdentifier,
} from "../../../ast";
import type { IValueType } from "../../../domain";
import {
  FunctionTypeRegistry,
  type IFunctionTypeSignature,
  type IFunctionName,
} from "../../../functions";
import type { ITypeCheckContext } from "../types";
import { TypeCheckError } from "../errors";

/**
 * Infers the static `IValueType` of an `IExpression` in the DSL.
 */
export function getExpressionType(
  expr: IExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeCheckError> {
  switch (expr.kind) {
    case "Literal":
      return getLiteralType(expr);
    case "Identifier":
      return getIdentifierType(expr, context);
    case "BinaryExpression":
      return getBinaryExpressionType(expr, context);
    case "UnaryExpression":
      return getUnaryExpressionType(expr, context);
    case "FunctionCall":
      return getFunctionCallType(expr, context);
    default: {
      invariant(false, "Unknown expression kind in type checker", {
        kind: (expr as IExpression).kind,
      });
    }
  }
}

// literal type checking
function getLiteralType(expr: ILiteral): Result<IValueType, TypeCheckError> {
  switch (expr.literalType) {
    case "number":
      return ok({ kind: "number" });
    case "boolean":
      return ok({ kind: "boolean" });
    case "duration":
      return ok({ kind: "duration" });
    case "string":
      return ok({ kind: "string" });
    default: {
      invariant(false, "Unknown literal type in type checker", {
        literalType: (expr as ILiteral).literalType,
      });
    }
  }
}

function getIdentifierType(
  expr: IIdentifier,
  context: ITypeCheckContext
): Result<IValueType, TypeCheckError> {
  const variableType = context.variables.get(expr.name);
  if (variableType) {
    return ok(variableType);
  }

  const chart = context.inputCharts.get(expr.name);

  if (!chart) {
    return err(
      new TypeCheckError(
        `Unknown identifier: ${expr.name}`,
        `Chart or variable '${expr.name}' not found`,
        { kind: "unknown" },
        { kind: "unknown" },
        expr.location,
        `identifier '${expr.name}'`
      )
    );
  }

  return ok({ kind: "chart", domainType: chart.domain.type });
}

// binary expression type checking
function getBinaryExpressionType(
  expr: IBinaryExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeCheckError> {
  const leftR = getExpressionType(expr.left, context);
  const rightR = getExpressionType(expr.right, context);

  if (leftR.isErr()) return leftR;
  if (rightR.isErr()) return rightR;

  const leftType = leftR.value;
  const rightType = rightR.value;

  // arithmetic operators: +, -, *, /
  if (isArithmeticOperator(expr.operator)) {
    // number +/-*/ number -> number
    if (leftType.kind === "number" && rightType.kind === "number") {
      return ok({ kind: "number" });
    }

    // chart +/-*/ chart (same domain) -> chart
    if (
      leftType.kind === "chart" &&
      rightType.kind === "chart" &&
      leftType.domainType === rightType.domainType
    ) {
      return ok({ kind: "chart", domainType: leftType.domainType });
    }

    // chart +/-*/ number -> chart
    if (leftType.kind === "chart" && rightType.kind === "number") {
      return ok({ kind: "chart", domainType: leftType.domainType });
    }

    // number +/-*/ chart -> chart
    if (leftType.kind === "number" && rightType.kind === "chart") {
      return ok({ kind: "chart", domainType: rightType.domainType });
    }

    // time +/- duration -> time
    if (
      leftType.kind === "time" &&
      rightType.kind === "duration" &&
      (expr.operator === "+" || expr.operator === "-")
    ) {
      return ok({ kind: "time" });
    }

    // duration + time -> time
    if (
      leftType.kind === "duration" &&
      rightType.kind === "time" &&
      expr.operator === "+"
    ) {
      return ok({ kind: "time" });
    }

    return err(
      TypeCheckError.operator(expr.operator, leftType, rightType, expr.location)
    );
  }

  // comparison operators: >, >=, <, <=, ==
  if (isComparisonOperator(expr.operator)) {
    // can compare numbers
    if (leftType.kind === "number" && rightType.kind === "number") {
      return ok({ kind: "boolean" });
    }

    // can compare timestamps
    if (leftType.kind === "time" && rightType.kind === "time") {
      return ok({ kind: "boolean" });
    }

    // can compare booleans for equality
    if (
      expr.operator === "==" &&
      leftType.kind === "boolean" &&
      rightType.kind === "boolean"
    ) {
      return ok({ kind: "boolean" });
    }

    return err(
      TypeCheckError.operator(expr.operator, leftType, rightType, expr.location)
    );
  }

  // boolean operators: and, or
  if (isBooleanOperator(expr.operator)) {
    if (leftType.kind === "boolean" && rightType.kind === "boolean") {
      return ok({ kind: "boolean" });
    }

    return err(
      TypeCheckError.operator(expr.operator, leftType, rightType, expr.location)
    );
  }

  invariant(false, "Unknown binary operator in type checker", {
    operator: expr.operator,
  });
}

function isArithmeticOperator(
  op: IBinaryOperator
): op is "+" | "-" | "*" | "/" {
  return op === "+" || op === "-" || op === "*" || op === "/";
}

function isComparisonOperator(
  op: IBinaryOperator
): op is ">" | ">=" | "<" | "<=" | "==" {
  return op === ">" || op === ">=" || op === "<" || op === "<=" || op === "==";
}

function isBooleanOperator(op: IBinaryOperator): op is "and" | "or" {
  return op === "and" || op === "or";
}

// unary expression type checking
function getUnaryExpressionType(
  expr: IUnaryExpression,
  context: ITypeCheckContext
): Result<IValueType, TypeCheckError> {
  const operandR = getExpressionType(expr.operand, context);

  if (operandR.isErr()) return operandR;

  const operandType = operandR.value;

  if (expr.operator === "!") {
    if (operandType.kind !== "boolean") {
      return err(
        TypeCheckError.operator("!", operandType, operandType, expr.location)
      );
    }

    return ok({ kind: "boolean" });
  }

  if (expr.operator === "-") {
    if (operandType.kind !== "number") {
      return err(
        TypeCheckError.operator("-", operandType, operandType, expr.location)
      );
    }

    return ok({ kind: "number" });
  }

  invariant(false, "Unknown unary operator in type checker", {
    operator: expr.operator,
  });
}

// function call type checking
function getFunctionCallType(
  expr: IFunctionCall,
  context: ITypeCheckContext
): Result<IValueType, TypeCheckError> {
  const signature: IFunctionTypeSignature | undefined =
    FunctionTypeRegistry.get(expr.name as IFunctionName);

  if (!signature) {
    return err(
      new TypeCheckError(
        `Unknown function: ${expr.name}`,
        `Function '${expr.name}' is not defined`,
        { kind: "unknown" },
        { kind: "unknown" },
        expr.location,
        `function '${expr.name}'`
      )
    );
  }

  const resolvedArgsR = resolveFunctionArguments(expr, signature);
  if (resolvedArgsR.isErr()) {
    return err(resolvedArgsR.error);
  }

  const argTypesR = inferFunctionArgumentTypes(
    expr,
    signature,
    resolvedArgsR.value,
    context
  );

  if (argTypesR.isErr()) {
    return err(argTypesR.error);
  }

  return ok(signature.returnType(argTypesR.value));
}

function resolveFunctionArguments(
  expr: IFunctionCall,
  signature: IFunctionTypeSignature
): Result<(IExpression | undefined)[], TypeCheckError> {
  const params = signature.parameters;
  const resolved: (IExpression | undefined)[] = new Array(params.length).fill(
    undefined
  );
  let seenNamed = false;

  for (let callIndex = 0; callIndex < expr.args.length; callIndex++) {
    const rawArg = expr.args[callIndex];

    invariant(
      rawArg !== undefined,
      "FunctionCall arguments array mutated during resolution",
      { functionName: expr.name, callIndex, argsLength: expr.args.length }
    );

    if (rawArg.kind === "NamedArgument") {
      seenNamed = true;
      const paramIndex = params.findIndex(
        (p) => p.name !== undefined && p.name === rawArg.name
      );

      if (paramIndex === -1) {
        return err(
          new TypeCheckError(
            `Function '${expr.name}' does not have a parameter named '${rawArg.name}'`,
            `Unknown named argument '${rawArg.name}' for function '${expr.name}'`,
            params.map((p) => ({ kind: p.kind }) as IValueType),
            { kind: "unknown" },
            rawArg.location,
            `${expr.name} argument '${rawArg.name}'`
          )
        );
      }

      if (resolved[paramIndex]) {
        return err(
          new TypeCheckError(
            `Function '${expr.name}' received multiple values for parameter '${rawArg.name}'`,
            `Parameter '${rawArg.name}' for function '${expr.name}' was provided more than once`,
            { kind: "unknown" },
            { kind: "unknown" },
            rawArg.location,
            `${expr.name} argument '${rawArg.name}'`
          )
        );
      }

      resolved[paramIndex] = rawArg.value;
      continue;
    }

    // positional argument: must appear before any named arguments
    if (seenNamed) {
      return err(
        new TypeCheckError(
          `Function '${expr.name}' cannot have positional arguments after named arguments`,
          `Positional arguments must come before any named arguments for function '${expr.name}'`,
          params.map((p) => ({ kind: p.kind }) as IValueType),
          { kind: "unknown" },
          expr.location,
          `${expr.name} arguments`
        )
      );
    }

    // find the next available parameter that does not require a name
    let paramIndex = -1;
    for (let i = 0; i < params.length; i++) {
      if (resolved[i] !== undefined) {
        continue;
      }

      const param = params[i];
      invariant(
        param !== undefined,
        "Function signature parameters length mismatch during positional resolution",
        {
          functionName: expr.name,
          callIndex,
          paramsLength: params.length,
          resolvedArgsLength: resolved.length,
        }
      );

      if (param.name !== undefined) {
        // the first unresolved parameter requires a name, so it cannot
        // be satisfied by a positional argument
        break;
      }

      paramIndex = i;
      break;
    }

    if (paramIndex === -1) {
      return err(
        new TypeCheckError(
          `Function '${expr.name}' does not accept positional argument ${callIndex + 1} for a named parameter`,
          `Argument ${callIndex + 1} of function '${expr.name}' must be passed using 'name=value' syntax`,
          params.map((p) => ({ kind: p.kind }) as IValueType),
          { kind: "unknown" },
          expr.location,
          `${expr.name} arguments`
        )
      );
    }

    resolved[paramIndex] = rawArg;
  }

  return ok(resolved);
}

function inferFunctionArgumentTypes(
  expr: IFunctionCall,
  signature: IFunctionTypeSignature,
  resolvedArgExprs: readonly (IExpression | undefined)[],
  context: ITypeCheckContext
): Result<IValueType[], TypeCheckError> {
  const params = signature.parameters;
  const argTypesByParam: (IValueType | undefined)[] = new Array(
    params.length
  ).fill(undefined);

  for (let i = 0; i < params.length; i++) {
    const param = params[i];

    invariant(
      param !== undefined,
      "Function signature parameters length mismatch during type inference",
      {
        functionName: expr.name,
        paramIndex: i,
        paramsLength: params.length,
        resolvedArgsLength: resolvedArgExprs.length,
      }
    );

    const argExpr = resolvedArgExprs[i];

    if (!argExpr) {
      if (param.optional) {
        continue;
      }

      return err(
        TypeCheckError.argument(
          expr.name,
          i,
          { kind: param.kind } as IValueType,
          { kind: "unknown" },
          expr.location
        )
      );
    }

    const argScope = signature.argVariableScopes?.[i];
    let argContext: ITypeCheckContext = context;

    if (argScope) {
      const mergedVariables = new Map<string, IValueType>();

      if (context.variables) {
        for (const [key, value] of context.variables) {
          mergedVariables.set(key, value);
        }
      }

      for (const [key, value] of argScope) {
        mergedVariables.set(key, value);
      }

      argContext = { ...context, variables: mergedVariables };
    }

    const result = getExpressionType(argExpr, argContext);
    if (result.isErr()) {
      return err(result.error);
    }

    const argType = result.value;
    argTypesByParam[i] = argType;

    if (argType.kind !== param.kind) {
      return err(
        TypeCheckError.argument(
          expr.name,
          i,
          { kind: param.kind } as IValueType,
          argType,
          argExpr.location
        )
      );
    }

    if (
      argType.kind === "chart" &&
      param.allowedDomains &&
      !param.allowedDomains.includes(argType.domainType)
    ) {
      const firstAllowedDomain = param.allowedDomains[0];

      invariant(
        firstAllowedDomain !== undefined,
        "Function signature.allowedDomains must be non-empty when provided",
        {
          functionName: expr.name,
          paramIndex: i,
        }
      );

      const expectedType: IValueType = {
        kind: "chart",
        domainType: firstAllowedDomain,
      };

      return err(
        TypeCheckError.argument(
          expr.name,
          i,
          expectedType,
          argType,
          argExpr.location
        )
      );
    }
  }

  const argTypes = argTypesByParam.filter(
    (t): t is IValueType => t !== undefined
  );

  return ok(argTypes);
}
