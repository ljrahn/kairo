import { describe, it, expect } from "vitest";
import { resampleTimeSeries } from "~/functions";
import {
  getChartTimes,
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

const MINUTE_MS = 60 * 1000;

describe("resampleTimeSeries", () => {
  it("resamples using mean aggregation by default", () => {
    const chart = makeTimeSeriesChart([1, 3, 5, 7]);
    const windowMs = 2 * MINUTE_MS;

    const result = resampleTimeSeries(chart, windowMs);

    expect(getChartValues(result)).toEqual([2, 6]);

    const startTime = chart.points[0]!.x.getTime();
    expect(getChartTimes(result)).toEqual([
      startTime,
      startTime + 2 * MINUTE_MS,
    ]);
  });

  it("supports sum aggregation", () => {
    const chart = makeTimeSeriesChart([1, 3, 5, 7]);
    const windowMs = 2 * MINUTE_MS;

    const result = resampleTimeSeries(chart, windowMs, "sum");

    expect(getChartValues(result)).toEqual([4, 12]);
  });

  it("supports last-value aggregation", () => {
    const chart = makeTimeSeriesChart([1, 3, 5, 7]);
    const windowMs = 2 * MINUTE_MS;

    const result = resampleTimeSeries(chart, windowMs, "last");

    expect(getChartValues(result)).toEqual([3, 7]);
  });

  it("returns the same chart instance when the input is empty", () => {
    const empty = makeEmptyTimeSeriesChart();
    const result = resampleTimeSeries(empty, 2 * MINUTE_MS);

    expect(result).toBe(empty);
  });

  it("does not modify the series when window is non-positive", () => {
    const chart = makeTimeSeriesChart([1, 2, 3]);

    const zeroWindowResult = resampleTimeSeries(chart, 0);
    expect(zeroWindowResult).toBe(chart);

    const negativeWindowResult = resampleTimeSeries(chart, -MINUTE_MS);
    expect(negativeWindowResult).toBe(chart);
  });
});
