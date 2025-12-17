import type { IAstNodeBase } from "../shared";

export interface IIdentifier extends IAstNodeBase {
  readonly kind: "Identifier";
  readonly name: string;
}
