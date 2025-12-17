import type { IChart, IPoint, ITimeSeriesChart } from "../../../domain";
import { createChart } from "../../../domain";
import { ensureTimeSeriesChart } from "../shared";

export function filterTimeSeries(
  chart: IChart,
  predicate: (point: IPoint<"time">, index: number) => boolean
): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);

  const length = timeSeries.points.length;
  if (length === 0) {
    return timeSeries;
  }

  const filteredPoints: IPoint<"time">[] = [];

  for (let index = 0; index < length; index += 1) {
    const point = timeSeries.points[index]!;
    if (predicate(point, index)) {
      filteredPoints.push(point);
    }
  }

  return createChart(timeSeries.domain, filteredPoints);
}
