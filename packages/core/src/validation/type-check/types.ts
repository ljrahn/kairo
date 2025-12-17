import { IChart, IValueType } from "../../domain";

/**
 * Input context for program-level type checking. Only charts are provided
 * as inputs; variables are derived during type checking as the program
 * introduces assignments.
 */
export interface ITypeCheckInputContext {
  readonly charts: ReadonlyMap<string, IChart>;
}

/**
 * Expression/type-check context, used internally while walking expressions
 * and as the output context for program type checking. Variables represent
 * the types of identifiers introduced by prior assignments.
 */
export interface ITypeCheckContext {
  readonly inputCharts: ReadonlyMap<string, IChart>;
  readonly variables: ReadonlyMap<string, IValueType>;
}
