import { createChart, createTimeDomain, type ITimeSeriesChart } from "~/domain";

interface ITimeSeriesOptions {
  readonly name?: string;
  readonly start?: Date;
  readonly stepMs?: number;
}

const DEFAULT_START = new Date(2020, 0, 1, 0, 0, 0);
const DEFAULT_STEP_MS = 60 * 1000; // 1 minute

export function makeTimeSeriesChart(
  values: readonly number[],
  options: ITimeSeriesOptions = {}
): ITimeSeriesChart {
  const domain = createTimeDomain("UTC");

  const start = options.start ?? DEFAULT_START;
  const stepMs = options.stepMs ?? DEFAULT_STEP_MS;

  const points = values.map((value, index) => ({
    x: new Date(start.getTime() + index * stepMs),
    y: value,
  }));

  return createChart(domain, points);
}

export function makeEmptyTimeSeriesChart(): ITimeSeriesChart {
  const domain = createTimeDomain("UTC");

  return createChart(domain, []);
}

export function getChartValues(chart: ITimeSeriesChart): number[] {
  return chart.points.map((point) => point.y);
}

export function getChartTimes(chart: ITimeSeriesChart): number[] {
  return chart.points.map((point) => point.x.getTime());
}
