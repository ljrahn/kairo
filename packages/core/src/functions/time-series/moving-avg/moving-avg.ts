import type { IChart, ITimeSeriesChart, IPoint } from "../../../domain";
import { createChart, getChartLength } from "../../../domain";
import { ensureTimeSeriesChart } from "../shared";

export function movingAverageTimeSeries(
  chart: IChart,
  windowMs: number
): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);
  const length = getChartLength(timeSeries);

  if (length === 0) {
    return timeSeries;
  }

  const points: IPoint<"time">[] = [];
  let startIndex = 0;
  let sum = 0;

  for (let index = 0; index < length; index += 1) {
    const point = timeSeries.points[index]!;
    const time = point.x.getTime();
    sum += point.y;

    while (startIndex < index) {
      const startPoint = timeSeries.points[startIndex]!;
      const startTime = startPoint.x.getTime();
      if (time - startTime < windowMs) {
        break;
      }

      sum -= startPoint.y;
      startIndex += 1;
    }

    const count = index - startIndex + 1;
    const average = count > 0 ? sum / count : point.y;

    points.push({ x: point.x, y: average });
  }

  return createChart(timeSeries.domain, points);
}
