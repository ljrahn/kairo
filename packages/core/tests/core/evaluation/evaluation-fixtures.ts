import { createChart, createTimeDomain, createNumericDomain } from "~/domain";
import type { ITimeSeriesChart, INumericChart } from "~/domain";

export function makeTimeSeriesChart(
  values: readonly number[]
): ITimeSeriesChart {
  const domain = createTimeDomain("UTC");

  const points = values.map((value, index) => ({
    x: new Date(2020, 0, 1, 0, index),
    y: value,
  }));

  return createChart(domain, points);
}

export function makeEmptyTimeSeriesChart(): ITimeSeriesChart {
  const domain = createTimeDomain("UTC");
  return createChart(domain, []);
}

export function makeNumericChart(
  values: readonly number[],
  unit?: string
): INumericChart {
  const domain = createNumericDomain(unit);

  const points = values.map((value, index) => ({
    x: index,
    y: value,
  }));

  return createChart(domain, points);
}
