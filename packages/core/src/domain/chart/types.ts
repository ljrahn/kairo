export type IDomainType = "time" | "numeric" | "category";

export type IDomainValue<T extends IDomainType = IDomainType> = T extends "time"
  ? Date
  : T extends "numeric"
    ? number
    : T extends "category"
      ? string
      : never;

export interface IDomain<T extends IDomainType = IDomainType> {
  readonly type: T;
  readonly timeZone?: string;
  readonly unit?: string;
}

export interface IPoint<T extends IDomainType = IDomainType> {
  readonly x: IDomainValue<T>;
  readonly y: number;
}

export interface IChartMetadata {
  readonly name: string;
  readonly description?: string;
  readonly source?: string;
  readonly yUnit?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface IChart<T extends IDomainType = IDomainType> {
  readonly domain: IDomain<T>;
  readonly points: ReadonlyArray<IPoint<T>>;
  readonly metadata: IChartMetadata;
}

export type ITimeSeriesChart = IChart<"time">;
export type INumericChart = IChart<"numeric">;
export type ICategoryChart = IChart<"category">;
