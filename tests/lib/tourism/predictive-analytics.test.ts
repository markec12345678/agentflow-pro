import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

import {
  computePredictive,
  type HistoricalPoint,
} from "@/lib/tourism/predictive-analytics";

describe("computePredictive", () => {
  it("returns zeros when no data", () => {
    const result = computePredictive([], 2);
    expect(result).toEqual({
      forecastNightsNext30d: 0,
      forecastBookingsNext30d: 0,
      forecastRevenueNext30d: 0,
      trendDirection: "stable",
      trendPercent: 0,
      confidence: 0,
    });
  });

  it("computes forecast from single month", () => {
    const data: HistoricalPoint[] = [
      { month: "2025-01", bookings: 5, nights: 10, revenue: 1500 },
    ];
    const result = computePredictive(data, 2);
    expect(result.forecastNightsNext30d).toBe(10);
    expect(result.forecastBookingsNext30d).toBe(5);
    expect(result.forecastRevenueNext30d).toBe(1500);
    expect(result.trendDirection).toBe("stable");
    expect(result.confidence).toBe(0.5);
  });

  it("detects upward trend", () => {
    const data: HistoricalPoint[] = [
      { month: "2025-01", bookings: 4, nights: 8, revenue: 1000 },
      { month: "2025-02", bookings: 6, nights: 14, revenue: 1800 },
    ];
    const result = computePredictive(data, 2);
    expect(result.trendDirection).toBe("up");
    expect(result.forecastNightsNext30d).toBeGreaterThanOrEqual(11);
  });

  it("detects downward trend", () => {
    const data: HistoricalPoint[] = [
      { month: "2025-01", bookings: 6, nights: 12, revenue: 1500 },
      { month: "2025-02", bookings: 4, nights: 6, revenue: 800 },
    ];
    const result = computePredictive(data, 2);
    expect(result.trendDirection).toBe("down");
  });

  it("uses last 3 months for average", () => {
    const data: HistoricalPoint[] = [
      { month: "2025-01", bookings: 2, nights: 4, revenue: 400 },
      { month: "2025-02", bookings: 4, nights: 8, revenue: 800 },
      { month: "2025-03", bookings: 6, nights: 12, revenue: 1200 },
    ];
    const result = computePredictive(data, 2);
    const avgNights = (4 + 8 + 12) / 3;
    expect(result.forecastNightsNext30d).toBe(Math.round(avgNights * 1.05));
  });
});
