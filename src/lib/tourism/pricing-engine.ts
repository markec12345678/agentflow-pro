/**
 * AgentFlow Pro - Pricing Engine (TOURISM-EMAIL-ROADMAP §7)
 * PRICING_STRATEGIES konfiguracija za base_rate, rules, dynamic_adjustment.
 * calculatePrice – applies rules to base rate.
 */

import {
  differenceInDays,
  addDays,
  startOfDay,
  getDay,
} from "date-fns";

export interface CalculatePriceResult {
  baseTotal: number;
  adjustments: { rule: string; amount: number; percent?: number }[];
  finalPrice: number;
  nights: number;
}

export interface CalculatePriceOptions {
  competitorAvg?: number;
}

/**
 * Calculates total price applying PRICING_STRATEGIES rules.
 * Order: length_of_stay discount → early_bird or last_minute → weekend_premium.
 */
export function calculatePrice(
  baseRatePerNight: number,
  checkIn: Date,
  checkOut: Date,
  options?: CalculatePriceOptions
): CalculatePriceResult {
  const adjustments: CalculatePriceResult["adjustments"] = [];
  const today = startOfDay(new Date());
  const checkInDay = startOfDay(checkIn);
  const checkOutDay = startOfDay(checkOut);
  const nights = Math.max(1, differenceInDays(checkOutDay, checkInDay));
  let runningTotal = baseRatePerNight * nights;

  const { rules } = PRICING_STRATEGIES;

  // length_of_stay: highest matching discount (7→25%, 5→20%, 3→15%)
  const losRules = [...rules.length_of_stay].sort((a, b) => b.nights - a.nights);
  const losMatch = losRules.find((r) => nights >= r.nights);
  if (losMatch) {
    const discountAmount = runningTotal * losMatch.discount;
    runningTotal -= discountAmount;
    adjustments.push({
      rule: "length_of_stay",
      amount: -discountAmount,
      percent: losMatch.discount * 100,
    });
  }

  // early_bird: booking >= 60 days ahead → -10%
  // last_minute: booking <= 3 days ahead → -20% (mutually exclusive with early_bird)
  const daysUntilCheckIn = differenceInDays(checkInDay, today);
  if (daysUntilCheckIn >= rules.early_bird.days_before) {
    const discountAmount = runningTotal * rules.early_bird.discount;
    runningTotal -= discountAmount;
    adjustments.push({
      rule: "early_bird",
      amount: -discountAmount,
      percent: rules.early_bird.discount * 100,
    });
  } else if (daysUntilCheckIn <= rules.last_minute.days_before) {
    const discountAmount = runningTotal * rules.last_minute.discount;
    runningTotal -= discountAmount;
    adjustments.push({
      rule: "last_minute",
      amount: -discountAmount,
      percent: rules.last_minute.discount * 100,
    });
  }

  // weekend_premium: +25% for each Fri (5) and Sat (6) night
  let weekendPremium = 0;
  for (let i = 0; i < nights; i++) {
    const nightDate = addDays(checkInDay, i);
    const day = getDay(nightDate); // 0=Sun, 5=Fri, 6=Sat
    if (day === 5 || day === 6) {
      weekendPremium += baseRatePerNight * rules.weekend_premium.premium;
    }
  }
  if (weekendPremium > 0) {
    runningTotal += weekendPremium;
    adjustments.push({
      rule: "weekend_premium",
      amount: weekendPremium,
      percent: rules.weekend_premium.premium * 100,
    });
  }

  return {
    baseTotal: baseRatePerNight * nights,
    adjustments,
    finalPrice: Math.round(runningTotal * 100) / 100,
    nights,
  };
}

export const PRICING_STRATEGIES = {
  base_rate: {
    type: "fixed" as const,
    variables: ["room_type", "season", "day_of_week"],
  },
  rules: {
    min_stay_discount: { threshold: 7, discount: 0.15 },
    early_bird: { days_before: 60, discount: 0.1 },
    last_minute: { days_before: 3, discount: 0.2 },
    weekend_premium: { days: ["fri", "sat"] as const, premium: 0.25 },
    length_of_stay: [
      { nights: 3, discount: 0.15 },
      { nights: 5, discount: 0.2 },
      { nights: 7, discount: 0.25 },
    ],
  },
  dynamic_adjustment: {
    type: "ai_optimized" as const,
    factors: [
      "competitor_rates",
      "demand_forecast",
      "historical_occupancy",
    ],
    update_frequency: "daily" as const,
  },
} as const;

export type PricingRuleKey = keyof typeof PRICING_STRATEGIES.rules;
