import type { IChart, ITimeSeriesChart } from "../../../domain";
import { getChartLength } from "../../../domain";
import { ensureTimeSeriesChart, mapTimeSeriesValues } from "../shared";

export function normalizeTimeSeries(chart: IChart): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);
  const length = getChartLength(timeSeries);

  if (length === 0) {
    return timeSeries;
  }

  let min = Infinity;
  let max = -Infinity;

  for (let index = 0; index < length; index += 1) {
    const value = timeSeries.points[index]!.y;
    if (value < min) {
      min = value;
    }

    if (value > max) {
      max = value;
    }
  }

  if (min === max) {
    return mapTimeSeriesValues(timeSeries, () => 0);
  }

  const range = max - min;

  return mapTimeSeriesValues(timeSeries, (point) => (point.y - min) / range);
}
