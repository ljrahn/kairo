export interface IAstLocation {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
  readonly length?: number;
}

export interface IAstNodeBase {
  readonly location: IAstLocation;
}
