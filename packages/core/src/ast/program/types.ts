import type { IExpression } from "../expression";
import type { IAstNodeBase } from "../shared";

export interface IAssignmentStatement extends IAstNodeBase {
  readonly kind: "AssignmentStatement";
  readonly name: string;
  readonly expression: IExpression;
}

export interface IExpressionStatement extends IAstNodeBase {
  readonly kind: "ExpressionStatement";
  readonly expression: IExpression;
}

export type IStatement = IAssignmentStatement | IExpressionStatement;

export interface IProgram extends IAstNodeBase {
  readonly kind: "Program";
  readonly statements: readonly IStatement[];
}
