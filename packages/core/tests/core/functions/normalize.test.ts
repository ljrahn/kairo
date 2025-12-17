import { describe, it, expect } from "vitest";
import { normalizeTimeSeries } from "~/functions";
import {
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

describe("normalizeTimeSeries", () => {
  it("normalizes values into the [0, 1] range", () => {
    const chart = makeTimeSeriesChart([10, 20, 30]);
    const result = normalizeTimeSeries(chart);

    const values = getChartValues(result);
    expect(values[0]).toBeCloseTo(0);
    expect(values[1]).toBeCloseTo(0.5);
    expect(values[2]).toBeCloseTo(1);
  });

  it("maps a constant series to all zeros", () => {
    const chart = makeTimeSeriesChart([5, 5, 5]);
    const result = normalizeTimeSeries(chart);

    expect(getChartValues(result)).toEqual([0, 0, 0]);
  });

  it("returns the same chart instance for an empty series", () => {
    const empty = makeEmptyTimeSeriesChart();
    const result = normalizeTimeSeries(empty);

    expect(result).toBe(empty);
  });
});
