import type { IAstLocation } from "../shared";
import type {
  IAssignmentStatement,
  IExpressionStatement,
  IProgram,
  IStatement,
} from "./types";
import type { IExpression } from "../expression";

export function createAssignmentStatement(
  name: string,
  expression: IExpression,
  location: IAstLocation
): IAssignmentStatement {
  return { kind: "AssignmentStatement", name, expression, location };
}

export function createExpressionStatement(
  expression: IExpression,
  location: IAstLocation
): IExpressionStatement {
  return { kind: "ExpressionStatement", expression, location };
}

export function createProgram(
  statements: readonly IStatement[],
  location: IAstLocation
): IProgram {
  return { kind: "Program", statements, location };
}
