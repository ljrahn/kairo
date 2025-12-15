import type { ILiteral } from "../literal";
import type { IIdentifier } from "../identifier";
import type { IBinaryExpression } from "../binary-expression";
import type { IFunctionCall } from "../function-call";
import type { INamedArgument } from "../named-argument";

export type IExpression =
  | ILiteral
  | IIdentifier
  | IBinaryExpression
  | IFunctionCall
  | INamedArgument;

export type IExpressionKind = IExpression["kind"];
