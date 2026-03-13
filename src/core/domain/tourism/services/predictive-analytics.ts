/**
 * AgentFlow Pro - Predictive Analytics (Blok C #8)
 * Simple trend-based forecasts: avg, growth. No ML for MVP.
 */

export interface HistoricalPoint {
  month: string;
  bookings: number;
  nights: number;
  revenue: number;
}

export interface PredictiveResult {
  forecastNightsNext30d: number;
  forecastBookingsNext30d: number;
  forecastRevenueNext30d: number;
  trendDirection: "up" | "down" | "stable";
  trendPercent: number;
  confidence: number;
}

/**
 * Simple forecast: use average of last 3 months, apply slight growth if trend is up.
 */
export function computePredictive(
  monthlyData: HistoricalPoint[],
  avgStayLength: number
): PredictiveResult {
  if (monthlyData.length === 0) {
    return {
      forecastNightsNext30d: 0,
      forecastBookingsNext30d: 0,
      forecastRevenueNext30d: 0,
      trendDirection: "stable",
      trendPercent: 0,
      confidence: 0,
    };
  }

  const recent = monthlyData.slice(-3);
  const avgNights = recent.reduce((s, m) => s + m.nights, 0) / recent.length;
  const avgBookings = recent.reduce((s, m) => s + m.bookings, 0) / recent.length;
  const avgRevenue = recent.reduce((s, m) => s + m.revenue, 0) / recent.length;

  // Simple trend: compare last month to previous
  let trendDirection: "up" | "down" | "stable" = "stable";
  let trendPercent = 0;
  if (recent.length >= 2) {
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];
    const change =
      prev.nights > 0 ? ((last.nights - prev.nights) / prev.nights) * 100 : 0;
    trendPercent = Math.round(change * 10) / 10;
    if (change > 5) trendDirection = "up";
    else if (change < -5) trendDirection = "down";
  }

  // Forecast next 30 days: ~1 month = last month's avg, scaled by trend
  const trendFactor = trendDirection === "up" ? 1.05 : trendDirection === "down" ? 0.95 : 1;
  const forecastNights = Math.round(avgNights * trendFactor);
  const forecastBookings = avgStayLength > 0
    ? Math.round(forecastNights / avgStayLength)
    : Math.round(avgBookings * trendFactor);
  const forecastRevenue = Math.round(avgRevenue * trendFactor * 100) / 100;

  const confidence = monthlyData.length >= 2 ? Math.min(0.7 + monthlyData.length * 0.05, 0.9) : 0.5;

  return {
    forecastNightsNext30d: forecastNights,
    forecastBookingsNext30d: forecastBookings,
    forecastRevenueNext30d: forecastRevenue,
    trendDirection,
    trendPercent,
    confidence,
  };
}
