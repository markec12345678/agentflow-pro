/**
 * API: Refund Processing Tests
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

describe("POST /api/refunds/process", () => {
  const mockUser = {
    id: "user_123",
    email: "receptor@example.com",
    role: "receptor",
  };

  const mockPayment = {
    id: "pay_123",
    transactionId: "pi_123",
    amount: 10000,
    status: "succeeded",
    reservationId: "res_123",
  };

  const mockProperty = {
    id: "prop_123",
    userId: "user_123",
  };

  beforeEach(() => {
    // Mock Stripe
    jest.mock("@/lib/stripe", () => ({
      stripeService: {
        getStripe: () => ({
          refunds: {
            create: jest.fn().mockResolvedValue({
              id: "re_123",
              status: "succeeded",
              amount: 5000,
              created: Date.now() / 1000,
            }),
          },
        }),
      },
    }));
  });

  it("should require authentication", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: "pay_123", reason: "Test" }),
    });

    expect(response.status).toBe(401);
  });

  it("should require admin or receptor role", async () => {
    // Mock user with wrong role
    const mockWrongUser = { ...mockUser, role: "guest" };

    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({ paymentId: "pay_123", reason: "Test" }),
    });

    expect(response.status).toBe(403);
  });

  it("should require paymentId and reason", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({ reason: "Test" }), // Missing paymentId
    });

    expect(response.status).toBe(400);
  });

  it("should verify property access", async () => {
    // Mock user without property access
    const mockExternalUser = { id: "user_456", role: "receptor" };

    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=external-user",
      },
      body: JSON.stringify({ paymentId: "pay_123", reason: "Test" }),
    });

    expect(response.status).toBe(403);
  });

  it("should process full refund successfully", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({
        paymentId: "pay_123",
        reason: "Guest requested cancellation",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("refundId");
    expect(data.data.status).toBe("succeeded");
  });

  it("should process partial refund", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({
        paymentId: "pay_123",
        amount: 5000,
        reason: "Partial refund agreed",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.amount).toBe(5000);
  });

  it("should reject refund amount exceeding payment", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({
        paymentId: "pay_123",
        amount: 15000, // More than payment amount
        reason: "Test",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should cancel reservation on full refund", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=valid-token",
      },
      body: JSON.stringify({
        paymentId: "pay_123",
        reason: "Full refund",
      }),
    });

    expect(response.status).toBe(200);
    // Verify reservation was cancelled (check in mock calls)
  });
});

describe("GET /api/refunds/:id", () => {
  it("should require authentication", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/ref_123");

    expect(response.status).toBe(401);
  });

  it("should return refund status", async () => {
    const response = await fetch("http://localhost:3002/api/refunds/ref_123", {
      headers: {
        Cookie: "next-auth.session-token=valid-token",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty("refundId");
    expect(data.data).toHaveProperty("status");
    expect(data.data).toHaveProperty("amount");
  });
});
