import { describe, it, expect } from "vitest";
import { movingAverageTimeSeries } from "~/functions";
import {
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

const MINUTE_MS = 60 * 1000;

describe("movingAverageTimeSeries", () => {
  it("computes a simple moving average over the given window", () => {
    const chart = makeTimeSeriesChart([1, 2, 3, 4]);

    const windowMs = 2 * MINUTE_MS;
    const result = movingAverageTimeSeries(chart, windowMs);

    expect(getChartValues(result)).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it("handles a window smaller than the sampling interval", () => {
    const chart = makeTimeSeriesChart([1, 2, 3, 4]);
    const halfMinuteMs = 30 * 1000;

    const result = movingAverageTimeSeries(chart, halfMinuteMs);

    expect(getChartValues(result)).toEqual([1, 2, 3, 4]);
  });

  it("handles a single-point series", () => {
    const chart = makeTimeSeriesChart([42]);
    const result = movingAverageTimeSeries(chart, 10 * MINUTE_MS);

    expect(getChartValues(result)).toEqual([42]);
  });

  it("returns the same chart instance for an empty series", () => {
    const empty = makeEmptyTimeSeriesChart();
    const result = movingAverageTimeSeries(empty, 2 * MINUTE_MS);

    expect(result).toBe(empty);
  });
});
