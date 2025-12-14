import { describe, it, expect } from "vitest";
import { createChart, createMetadata, Chart } from "@kairo/core";

function formatChartTitle(chart: Chart): string {
  const pointCount = chart.points.length;
  const suffix = pointCount === 1 ? "point" : "points";
  return `${chart.metadata.name} (${pointCount} ${suffix})`;
}

function getChartSummary(chart: Chart): string {
  const { domain, points, metadata } = chart;
  return `${metadata.name}: ${domain.type} chart with ${points.length} data points`;
}

describe("Chart formatting utilities", () => {
  it("should format chart title with point count", () => {
    const chart = createChart(
      { type: "time" },
      [
        { x: new Date("2024-01-01"), y: 100 },
        { x: new Date("2024-01-02"), y: 150 },
      ],
      createMetadata("Revenue")
    );

    const title = formatChartTitle(chart);

    expect(title).toBe("Revenue (2 points)");
  });

  it("should handle singular point count", () => {
    const chart = createChart(
      { type: "numeric" },
      [{ x: 1, y: 100 }],
      createMetadata("Single Data Point")
    );

    const title = formatChartTitle(chart);

    expect(title).toBe("Single Data Point (1 point)");
  });

  it("should handle empty chart", () => {
    const chart = createChart({ type: "time" }, [], createMetadata("Empty"));

    const title = formatChartTitle(chart);

    expect(title).toBe("Empty (0 points)");
  });

  it("should generate chart summary", () => {
    const chart = createChart(
      { type: "time" },
      [
        { x: new Date("2024-01-01"), y: 100 },
        { x: new Date("2024-01-02"), y: 150 },
        { x: new Date("2024-01-03"), y: 120 },
      ],
      createMetadata("Sales")
    );

    const summary = getChartSummary(chart);

    expect(summary).toBe("Sales: time chart with 3 data points");
  });

  it("should work with different domain types", () => {
    const numericChart = createChart(
      { type: "numeric", unit: "meters" },
      [
        { x: 0, y: 0 },
        { x: 10, y: 100 },
      ],
      createMetadata("Distance")
    );

    const summary = getChartSummary(numericChart);

    expect(summary).toBe("Distance: numeric chart with 2 data points");
  });
});
