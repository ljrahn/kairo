import type { IChart, IPoint, ITimeSeriesChart } from "../../../domain";
import { createChart, getChartLength } from "../../../domain";
import { ensureTimeSeriesChart } from "../shared";
import type { IResampleMethod } from "./constraints";

interface IResampleBucketState {
  readonly sum: number;
  readonly count: number;
  readonly lastValue: number;
}

type IResampleAggregator = (state: IResampleBucketState) => number;

const RESAMPLE_AGGREGATORS: Record<IResampleMethod, IResampleAggregator> = {
  mean: (state) =>
    state.count > 0 ? state.sum / state.count : state.lastValue,
  sum: (state) => state.sum,
  last: (state) => state.lastValue,
};

export function resampleTimeSeries(
  chart: IChart,
  windowMs: number,
  method: IResampleMethod = "mean"
): ITimeSeriesChart {
  const timeSeries = ensureTimeSeriesChart(chart);
  const length = getChartLength(timeSeries);

  if (length === 0) {
    return timeSeries;
  }

  // defensive guard; function constraints should already ensure this.
  if (windowMs <= 0) {
    return timeSeries;
  }

  const points: IPoint<"time">[] = [];

  const firstPoint = timeSeries.points[0]!;
  const baseTime = firstPoint.x.getTime();

  let currentBucketIndex = 0;
  let currentBucketStart = baseTime;

  let sum = 0;
  let count = 0;
  let lastValue = 0;
  let hasValue = false;

  const flushBucket = () => {
    if (!hasValue) return;

    const state: IResampleBucketState = { sum, count, lastValue };

    const aggregatedValue = RESAMPLE_AGGREGATORS[method](state);
    points.push({ x: new Date(currentBucketStart), y: aggregatedValue });
  };

  for (let index = 0; index < length; index += 1) {
    const point = timeSeries.points[index]!;
    const time = point.x.getTime();

    const bucketIndex = Math.floor((time - baseTime) / windowMs);

    if (bucketIndex !== currentBucketIndex) {
      flushBucket();

      currentBucketIndex = bucketIndex;
      currentBucketStart = baseTime + bucketIndex * windowMs;

      sum = 0;
      count = 0;
      lastValue = 0;
      hasValue = false;
    }

    sum += point.y;
    count += 1;
    lastValue = point.y;
    hasValue = true;
  }

  flushBucket();

  return createChart(timeSeries.domain, points);
}
