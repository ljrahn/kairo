export interface IErrorLocation {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
  readonly length?: number;
}
