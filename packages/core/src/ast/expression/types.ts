import type { ILiteral } from "../literal";
import type { IIdentifier } from "../identifier";
import type { IBinaryExpression } from "../binary-expression";
import type { IFunctionCall } from "../function-call";
import type { INamedArgument } from "../named-argument";
import type { IUnaryExpression } from "../unary-expression";

export type IExpression =
  | ILiteral
  | IIdentifier
  | IBinaryExpression
  | IFunctionCall
  | INamedArgument
  | IUnaryExpression;

export type IExpressionKind = IExpression["kind"];
