import { createChart, isTimeSeriesChart } from "../../../domain";
import type { IChart, IPoint, ITimeSeriesChart } from "../../../domain";
import { invariant } from "../../../utils";

export function ensureTimeSeriesChart(chart: IChart): ITimeSeriesChart {
  invariant(isTimeSeriesChart(chart), "Expected time series chart", {
    chart: { domain: chart.domain },
  });

  return chart;
}

export function mapTimeSeriesValues(
  chart: IChart,
  transform: (point: IPoint<"time">, index: number) => number
): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);
  const points = timeSeries.points.map((point, index) => ({
    x: point.x,
    y: transform(point, index),
  }));

  return createChart(timeSeries.domain, points);
}
