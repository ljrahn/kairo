import {
  IBinaryExpression,
  IExpression,
  IFunctionCall,
  IIdentifier,
  ILiteral,
  INamedArgument,
  isBinaryExpression,
  isFunctionCall,
  isIdentifier,
  isLiteral,
  isNamedArgument,
} from "~/ast";
import { TestError } from "~/test";

export function expectExpression(node: unknown): IExpression {
  if (!node || typeof node !== "object" || !("kind" in node)) {
    throw new TestError("Expected expression node", {
      context: { node },
    });
  }

  return node as IExpression;
}

export function expectLiteral(node: IExpression): ILiteral {
  if (!isLiteral(node)) {
    throw new TestError(`Expected Literal node, got ${node.kind}`, {
      context: { node },
    });
  }
  return node;
}

export function expectIdentifier(node: IExpression): IIdentifier {
  if (!isIdentifier(node)) {
    throw new TestError(`Expected Identifier node, got ${node.kind}`, {
      context: { node },
    });
  }
  return node;
}

export function expectFunctionCall(node: IExpression): IFunctionCall {
  if (!isFunctionCall(node)) {
    throw new TestError(`Expected FunctionCall node, got ${node.kind}`, {
      context: { node },
    });
  }
  return node;
}

export function expectBinaryExpression(node: IExpression): IBinaryExpression {
  if (!isBinaryExpression(node)) {
    throw new TestError(`Expected BinaryExpression node, got ${node.kind}`, {
      context: { node },
    });
  }
  return node;
}

export function expectNamedArgument(node: IExpression): INamedArgument {
  if (!isNamedArgument(node)) {
    throw new TestError(`Expected NamedArgument node, got ${node.kind}`, {
      context: { node },
    });
  }
  return node;
}
