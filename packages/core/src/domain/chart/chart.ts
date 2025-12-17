import type {
  IDomain,
  IDomainType,
  IChart,
  IPoint,
  ITimeSeriesChart,
  INumericChart,
  ICategoryChart,
} from "./types";

export function createTimeDomain(timeZone: string = "UTC"): IDomain<"time"> {
  return { type: "time", timeZone };
}

export function createNumericDomain(unit?: string): IDomain<"numeric"> {
  return { type: "numeric", unit };
}

export function createCategoryDomain(): IDomain<"category"> {
  return { type: "category" };
}

export function createChart<T extends IDomainType>(
  domain: IDomain<T>,
  points: ReadonlyArray<IPoint<T>>
): IChart<T> {
  return { domain, points };
}

export function isTimeSeriesChart(chart: IChart): chart is ITimeSeriesChart {
  return chart.domain.type === "time";
}

export function isNumericChart(chart: IChart): chart is INumericChart {
  return chart.domain.type === "numeric";
}

export function isCategoryChart(chart: IChart): chart is ICategoryChart {
  return chart.domain.type === "category";
}

export function getChartLength(chart: IChart): number {
  return chart.points.length;
}

export function isChartEmpty(chart: IChart): boolean {
  return chart.points.length === 0;
}
