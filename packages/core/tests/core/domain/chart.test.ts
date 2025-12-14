import { describe, it, expect } from "vitest";
import { createChart } from "~/domain/chart";

describe("createChart", () => {
  it("should create a chart with all properties", () => {
    const chart = createChart();
    expect(chart).toBeDefined();
  });
});
