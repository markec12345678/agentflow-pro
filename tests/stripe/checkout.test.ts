/**
 * Stripe checkout tests
 */

import { createCheckoutSession } from "@/stripe/checkout";

jest.mock("@/stripe/config", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/test",
        }),
      },
    },
  }),
}));

describe("createCheckoutSession", () => {
  const params = {
    userId: "user_1",
    userEmail: "test@example.com",
    planId: "pro" as const,
    successUrl: "http://localhost:3000/success",
    cancelUrl: "http://localhost:3000/cancel",
  };

  it("throws when plan has no Stripe price", async () => {
    const orig = process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_PRO;
    await expect(createCheckoutSession(params)).rejects.toThrow(
      /No Stripe price configured/
    );
    if (orig) process.env.STRIPE_PRICE_PRO = orig;
  });

  it("returns url and sessionId when price is configured", async () => {
    process.env.STRIPE_PRICE_PRO = "price_123";
    const result = await createCheckoutSession(params);
    expect(result.url).toBe("https://checkout.stripe.com/test");
    expect(result.sessionId).toBe("cs_test_123");
  });
});
