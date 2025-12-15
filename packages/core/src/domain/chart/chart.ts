import type {
  IDomain,
  IDomainType,
  IChart,
  IChartMetadata,
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
  points: ReadonlyArray<IPoint<T>>,
  metadata: IChartMetadata
): IChart<T> {
  return { domain, points, metadata };
}

export function createChartMetadata(
  name: string,
  opts?: {
    description?: string;
    source?: string;
    yUnit?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
): IChartMetadata {
  const now = new Date();
  return {
    name,
    description: opts?.description,
    source: opts?.source,
    yUnit: opts?.yUnit,
    createdAt: opts?.createdAt ?? now,
    updatedAt: opts?.updatedAt ?? now,
  };
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
