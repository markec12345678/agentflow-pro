/**
 * Stripe plans tests
 */

import {
  PLANS,
  getPlanLimits,
  getStripePriceId,
  type PlanId,
} from "@/stripe/plans";

describe("PLANS", () => {
  it("has free, starter, pro, enterprise", () => {
    expect(PLANS.free).toBeDefined();
    expect(PLANS.starter).toBeDefined();
    expect(PLANS.pro).toBeDefined();
    expect(PLANS.enterprise).toBeDefined();
  });

  it("free has 20 runs and 60 credits", () => {
    expect(PLANS.free.priceMonthly).toBe(0);
    expect(PLANS.free.agentRunsLimit).toBe(20);
    expect(PLANS.free.creditsPerMonth).toBe(60);
  });

  it("starter is $29 with 100 runs", () => {
    expect(PLANS.starter.priceMonthly).toBe(29);
    expect(PLANS.starter.agentRunsLimit).toBe(100);
  });

  it("pro is $99 with 500 runs", () => {
    expect(PLANS.pro.priceMonthly).toBe(99);
    expect(PLANS.pro.agentRunsLimit).toBe(500);
  });

  it("enterprise is $499 with 5000 runs", () => {
    expect(PLANS.enterprise.priceMonthly).toBe(499);
    expect(PLANS.enterprise.agentRunsLimit).toBe(5000);
  });
});

describe("getPlanLimits", () => {
  it("returns agentRunsLimit for valid plan", () => {
    expect(getPlanLimits("starter").agentRunsLimit).toBe(100);
    expect(getPlanLimits("pro").agentRunsLimit).toBe(500);
    expect(getPlanLimits("enterprise").agentRunsLimit).toBe(5000);
  });

  it("returns default free limits for invalid plan", () => {
    expect(getPlanLimits("invalid" as PlanId).agentRunsLimit).toBe(20);
    expect(getPlanLimits("invalid" as PlanId).creditsPerMonth).toBe(60);
  });
});

describe("getStripePriceId", () => {
  it("returns undefined for free plan", () => {
    expect(getStripePriceId("free")).toBeUndefined();
  });

  it("returns env value or undefined for paid plans", () => {
    const id = getStripePriceId("starter");
    expect(typeof id === "string" || id === undefined).toBe(true);
  });

  it("getPlanLimits includes blogPostsLimit", () => {
    expect(getPlanLimits("starter").blogPostsLimit).toBe(3);
    expect(getPlanLimits("pro").blogPostsLimit).toBe(10);
  });
});
