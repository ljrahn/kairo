import { describe, it, expect } from "vitest";
import { filterTimeSeries } from "~/functions";
import {
  getChartTimes,
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

describe("filterTimeSeries", () => {
  it("filters points based on value predicate", () => {
    const chart = makeTimeSeriesChart([-1, 0, 1, 2]);

    const result = filterTimeSeries(chart, (point) => point.y > 0);

    expect(getChartValues(result)).toEqual([1, 2]);
  });

  it("filters points based on index", () => {
    const chart = makeTimeSeriesChart([10, 20, 30, 40]);

    const result = filterTimeSeries(chart, (_point, index) => index % 2 === 0);

    expect(getChartValues(result)).toEqual([10, 30]);
  });

  it("preserves timestamps for kept points", () => {
    const chart = makeTimeSeriesChart([10, 20, 30, 40]);

    const result = filterTimeSeries(chart, (point) => point.y >= 30);

    const originalTimes = getChartTimes(chart).slice(2);
    const filteredTimes = getChartTimes(result);

    expect(filteredTimes).toEqual(originalTimes);
  });

  it("returns the same chart instance for an empty series", () => {
    const empty = makeEmptyTimeSeriesChart();

    const result = filterTimeSeries(empty, () => true);

    expect(result).toBe(empty);
  });
});
