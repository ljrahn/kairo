import { describe, it, expect } from "vitest";
import {
  createChart,
  createMetadata,
  isValidChart,
  getPointCount,
  isEmpty,
  Domain,
  Point,
} from "@kairo/core";

describe("Chart usage from web app", () => {
  it("should import and use core package types", () => {
    const domain: Domain = { type: "time", timezone: "UTC" };
    const points: Point[] = [
      { x: new Date("2024-01-01"), y: 100 },
      { x: new Date("2024-01-02"), y: 150 },
    ];
    const metadata = createMetadata("Revenue");

    const chart = createChart(domain, points, metadata);

    expect(isValidChart(chart)).toBe(true);
    expect(getPointCount(chart)).toBe(2);
    expect(isEmpty(chart)).toBe(false);
  });

  it("should work with domain-specific operations", () => {
    const metadata = createMetadata("Sales");
    const domain: Domain = { type: "numeric", unit: "dollars" };
    const points: Point[] = [
      { x: 1, y: 1000 },
      { x: 2, y: 1500 },
      { x: 3, y: 1200 },
    ];

    const chart = createChart(domain, points, metadata);

    expect(chart.domain.type).toBe("numeric");
    expect(chart.metadata.name).toBe("Sales");
    expect(chart.points.length).toBe(3);
  });

  it("should handle empty charts correctly", () => {
    const metadata = createMetadata("Empty Dataset");
    const domain: Domain = { type: "time" };
    const points: Point[] = [];

    const chart = createChart(domain, points, metadata);

    expect(isEmpty(chart)).toBe(true);
    expect(getPointCount(chart)).toBe(0);
  });
});
