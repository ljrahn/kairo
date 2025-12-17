import { describe, it, expect } from "vitest";
import { alignTimeSeries } from "~/functions";
import {
  getChartTimes,
  getChartValues,
  makeEmptyTimeSeriesChart,
  makeTimeSeriesChart,
} from "./chart-fixtures";

const MINUTE_MS = 60 * 1000;

describe("alignTimeSeries", () => {
  it("aligns using exact matching timestamps", () => {
    const source = makeTimeSeriesChart([10, 20, 30], { name: "source" });

    const sourceStartTime = source.points[0]!.x;
    const targetStartTime = new Date(sourceStartTime.getTime() + MINUTE_MS);
    const target = makeTimeSeriesChart([100, 200, 300, 400], {
      name: "target",
      start: targetStartTime,
    });

    const aligned = alignTimeSeries(source, target, "exact");

    expect(aligned.points).toHaveLength(2);
    expect(getChartValues(aligned)).toEqual([20, 30]);

    const alignedTimes = getChartTimes(aligned);
    const expectedTimes = [
      target.points[0]!.x.getTime(),
      target.points[1]!.x.getTime(),
    ];
    expect(alignedTimes).toEqual(expectedTimes);
  });

  it("aligns using linear interpolation by default", () => {
    const start = new Date(2020, 0, 1, 0, 0, 0);

    const source = makeTimeSeriesChart([0, 10], {
      name: "source",
      start,
      stepMs: 10 * MINUTE_MS,
    });

    const target = makeTimeSeriesChart([0, 0, 0, 0], {
      name: "target",
      start,
      stepMs: 5 * MINUTE_MS,
    });

    const aligned = alignTimeSeries(source, target);

    expect(getChartValues(aligned)).toEqual([0, 5, 10, 10]);
  });

  it("aligns using step interpolation", () => {
    const start = new Date(2020, 0, 1, 0, 0, 0);

    const source = makeTimeSeriesChart([0, 10], {
      name: "source",
      start,
      stepMs: 10 * MINUTE_MS,
    });

    const target = makeTimeSeriesChart([0, 0, 0, 0], {
      name: "target",
      start,
      stepMs: 5 * MINUTE_MS,
    });

    const aligned = alignTimeSeries(source, target, "step");

    expect(getChartValues(aligned)).toEqual([0, 0, 10, 10]);
  });

  it("returns an empty series when source or target is empty", () => {
    const sourceEmpty = makeEmptyTimeSeriesChart();
    const target = makeTimeSeriesChart([1, 2], { name: "target" });

    const alignedFromEmptySource = alignTimeSeries(sourceEmpty, target);
    expect(alignedFromEmptySource.points).toHaveLength(0);
    expect(alignedFromEmptySource.domain).toBe(sourceEmpty.domain);

    const targetEmpty = makeEmptyTimeSeriesChart();
    const alignedToEmptyTarget = alignTimeSeries(target, targetEmpty);
    expect(alignedToEmptyTarget.points).toHaveLength(0);
    expect(alignedToEmptyTarget.domain).toBe(target.domain);
  });
});
