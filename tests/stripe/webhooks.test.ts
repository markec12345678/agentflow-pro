/**
 * Stripe webhook tests
 */

import {
  handleStripeWebhook,
  extractCheckoutMetadata,
  extractSubscriptionMetadata,
} from "@/stripe/webhooks";

jest.mock("@/stripe/config", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: jest.fn((payload: string, sig: string, _secret: string) => {
        if (!payload || !sig) throw new Error("Invalid");
        return {
          id: "evt_test",
          type: "checkout.session.completed",
          data: { object: {} },
        };
      }),
    },
  }),
}));

describe("extractCheckoutMetadata", () => {
  it("returns userId and planId when present", () => {
    const session = {
      metadata: { userId: "u1", planId: "pro" },
    } as unknown as Parameters<typeof extractCheckoutMetadata>[0];
    expect(extractCheckoutMetadata(session)).toEqual({
      userId: "u1",
      planId: "pro",
    });
  });

  it("returns null when metadata missing", () => {
    expect(extractCheckoutMetadata({ metadata: {} } as never)).toBeNull();
    expect(extractCheckoutMetadata({} as never)).toBeNull();
  });
});

describe("extractSubscriptionMetadata", () => {
  it("returns userId and planId when present", () => {
    const sub = {
      metadata: { userId: "u1", planId: "enterprise" },
    } as unknown as Parameters<typeof extractSubscriptionMetadata>[0];
    expect(extractSubscriptionMetadata(sub)).toEqual({
      userId: "u1",
      planId: "enterprise",
    });
  });

  it("returns null when metadata missing", () => {
    expect(extractSubscriptionMetadata({ metadata: {} } as never)).toBeNull();
  });
});

describe("handleStripeWebhook", () => {
  it("constructs event and returns it", async () => {
    const event = await handleStripeWebhook(
      "payload",
      "sig",
      {}
    );
    expect(event.type).toBe("checkout.session.completed");
    expect(event.id).toBe("evt_test");
  });

  it("calls handler when provided", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await handleStripeWebhook("payload", "sig", {
      "checkout.session.completed": handler,
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
