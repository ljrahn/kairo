import type { IChart, IPoint, ITimeSeriesChart } from "../../../domain";
import { createChart, getChartLength } from "../../../domain";
import { ensureTimeSeriesChart } from "../shared";
import type { IAlignMethod } from "./constraints";

interface IAlignNeighbors {
  readonly leftIndex: number;
  readonly rightIndex: number;
}

type IAlignInterpolator = (
  source: ITimeSeriesChart,
  targetTimeMs: number,
  neighbors: IAlignNeighbors
) => number;

// methods that use interpolation on a continuous axis.
type IContinuousAlignMethod = Exclude<IAlignMethod, "exact">;

const ALIGN_INTERPOLATORS: Record<IContinuousAlignMethod, IAlignInterpolator> =
  {
    step: (source, _targetTimeMs, neighbors) => {
      const leftPoint = source.points[neighbors.leftIndex]!;
      return leftPoint.y;
    },
    linear: (source, targetTimeMs, neighbors) => {
      const leftPoint = source.points[neighbors.leftIndex]!;
      const rightPoint = source.points[neighbors.rightIndex]!;

      const leftTime = leftPoint.x.getTime();
      const rightTime = rightPoint.x.getTime();

      if (
        neighbors.leftIndex === neighbors.rightIndex ||
        leftTime === rightTime
      ) {
        return leftPoint.y;
      }

      const span = rightTime - leftTime;
      const offset = targetTimeMs - leftTime;
      const ratio = offset / span;

      return leftPoint.y + ratio * (rightPoint.y - leftPoint.y);
    },
  };

export function alignTimeSeries(
  sourceChart: IChart,
  targetChart: IChart,
  method: IAlignMethod = "linear"
): ITimeSeriesChart {
  const source = ensureTimeSeriesChart(sourceChart);
  const target = ensureTimeSeriesChart(targetChart);

  const sourceLength = getChartLength(source);
  const targetLength = getChartLength(target);

  if (sourceLength === 0 || targetLength === 0) {
    // if there is no data in either chart, return an empty
    // time-series chart with the source domain.
    return createChart(source.domain, []);
  }

  let alignedPoints: IPoint<"time">[];

  if (method === "exact") {
    alignedPoints = alignExact(source, target);
  } else {
    alignedPoints = alignContinuous(
      source,
      target,
      method as IContinuousAlignMethod
    );
  }

  return createChart(source.domain, alignedPoints);
}

function alignExact(
  source: ITimeSeriesChart,
  target: ITimeSeriesChart
): IPoint<"time">[] {
  const sourceByTime = new Map<number, number>();

  for (const point of source.points) {
    sourceByTime.set(point.x.getTime(), point.y);
  }

  const aligned: IPoint<"time">[] = [];

  for (const targetPoint of target.points) {
    const timeMs = targetPoint.x.getTime();
    if (sourceByTime.has(timeMs)) {
      const value = sourceByTime.get(timeMs)!;
      aligned.push({ x: targetPoint.x, y: value });
    }
  }

  return aligned;
}

function alignContinuous(
  source: ITimeSeriesChart,
  target: ITimeSeriesChart,
  method: IContinuousAlignMethod
): IPoint<"time">[] {
  const interpolator = ALIGN_INTERPOLATORS[method];
  const aligned: IPoint<"time">[] = [];

  const sourceLength = source.points.length;

  let sourceIndex = 0;

  for (const targetPoint of target.points) {
    const targetTimeMs = targetPoint.x.getTime();

    // advance the source index until we find the first point
    // whose time is >= the target time.
    while (
      sourceIndex < sourceLength &&
      source.points[sourceIndex]!.x.getTime() <= targetTimeMs
    ) {
      sourceIndex += 1;
    }

    let leftIndex: number;
    let rightIndex: number;

    if (sourceIndex <= 0) {
      // Target time is before or at the first source point.
      leftIndex = 0;
      rightIndex = 0;
    } else if (sourceIndex >= sourceLength) {
      // Target time is after the last source point.
      leftIndex = sourceLength - 1;
      rightIndex = sourceLength - 1;
    } else {
      // Target time lies between source[sourceIndex - 1] and source[sourceIndex],
      // or exactly at source[sourceIndex].
      leftIndex = sourceIndex - 1;
      rightIndex = sourceIndex;
    }

    const value = interpolator(source, targetTimeMs, {
      leftIndex,
      rightIndex,
    });

    aligned.push({ x: targetPoint.x, y: value });
  }

  return aligned;
}
