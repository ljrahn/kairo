import { createChart, IChart, IPoint, ITimeSeriesChart } from "../../../domain";
import { ensureTimeSeriesChart } from "../shared";

export function shiftTimeSeries(
  chart: IChart,
  offsetMs: number
): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);
  const points: IPoint<"time">[] = timeSeries.points.map((point) => ({
    x: new Date(point.x.getTime() + offsetMs),
    y: point.y,
  }));

  return createChart(timeSeries.domain, points);
}
