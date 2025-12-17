import { describe, it, expect } from "vitest";
import { shiftTimeSeries } from "~/functions";
import {
  getChartTimes,
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

const HOUR_MS = 60 * 60 * 1000;

describe("shiftTimeSeries", () => {
  it("shifts timestamps by the given offset while preserving values", () => {
    const chart = makeTimeSeriesChart([1, 2, 3]);
    const originalTimes = getChartTimes(chart);

    const result = shiftTimeSeries(chart, HOUR_MS);
    const shiftedTimes = getChartTimes(result);

    expect(shiftedTimes).toEqual(
      originalTimes.map((timestamp) => timestamp + HOUR_MS)
    );
    expect(getChartValues(result)).toEqual(getChartValues(chart));
  });

  it("handles an empty series", () => {
    const empty = makeEmptyTimeSeriesChart();
    const result = shiftTimeSeries(empty, HOUR_MS);

    expect(result.points).toHaveLength(0);
  });
});
