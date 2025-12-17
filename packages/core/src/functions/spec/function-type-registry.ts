import type { IValueType, IDomainType } from "../../domain";

export interface IFunctionParamType {
  readonly kind: IValueType["kind"];
  readonly name?: string;
  readonly optional?: boolean;
  readonly allowedDomains?: readonly IDomainType[];
}

export interface IFunctionTypeSignature {
  readonly name: string;
  readonly parameters: readonly IFunctionParamType[];

  /**
   * Optional per-argument variable scopes. When provided, these variables
   * are made available while type-checking the corresponding argument.
   * Used for cases like filter predicates where identifiers such as
   * `time` and `value` are implicitly bound.
   */
  readonly argVariableScopes?: readonly (
    | ReadonlyMap<string, IValueType>
    | undefined
  )[];
  readonly returnType: (args: readonly IValueType[]) => IValueType;
}

export type IFunctionName = (typeof FunctionTypeRegistryEntries)[number][0];

const FunctionTypeRegistryEntries = [
  [
    "moving_avg",
    {
      name: "moving_avg",
      parameters: [
        { kind: "chart", allowedDomains: ["time"] },
        { kind: "duration" },
      ],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "shift",
    {
      name: "shift",
      parameters: [
        { kind: "chart", allowedDomains: ["time"] },
        { kind: "duration" },
      ],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "normalize",
    {
      name: "normalize",
      parameters: [{ kind: "chart", allowedDomains: ["time"] }],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "align",
    {
      name: "align",
      parameters: [
        { kind: "chart", allowedDomains: ["time"] },
        { kind: "chart", name: "to", allowedDomains: ["time"] },
        { kind: "string", name: "method", optional: true },
      ],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "resample",
    {
      name: "resample",
      parameters: [
        { kind: "chart", allowedDomains: ["time"] },
        { kind: "duration", name: "window" },
        { kind: "string", name: "method", optional: true },
      ],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "filter",
    {
      name: "filter",
      parameters: [
        { kind: "chart", allowedDomains: ["time"] },
        { kind: "boolean" },
      ],
      argVariableScopes: [
        undefined,
        new Map([
          ["time", { kind: "time" }],
          ["value", { kind: "number" }],
        ]),
      ],
      returnType: (args) => args[0]!,
    },
  ],
  [
    "now",
    { name: "now", parameters: [], returnType: () => ({ kind: "time" }) },
  ],
] as const satisfies readonly (readonly [string, IFunctionTypeSignature])[];

export const FunctionTypeRegistry: ReadonlyMap<
  IFunctionName,
  IFunctionTypeSignature
> = new Map<IFunctionName, IFunctionTypeSignature>(
  FunctionTypeRegistryEntries as readonly (readonly [
    IFunctionName,
    IFunctionTypeSignature,
  ])[]
);
