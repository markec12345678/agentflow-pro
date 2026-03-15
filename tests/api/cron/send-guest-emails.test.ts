/**
 * API: Send Guest Emails Cron Test
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

describe("POST /api/cron/send-guest-emails", () => {
  const mockAuth = {
    user: { id: "user_123", email: "test@example.com" },
  };

  beforeEach(() => {
    // Mock prisma
    jest.mock("@/database/schema", () => ({
      prisma: {
        guestCommunication: {
          findMany: jest.fn(),
          update: jest.fn(),
        },
      },
    }));
  });

  it("should reject requests without cron secret", async () => {
    const response = await fetch(
      "http://localhost:3002/api/cron/send-guest-emails",
      {
        method: "POST",
        headers: {},
      },
    );

    expect(response.status).toBe(401);
  });

  it("should accept requests with valid cron secret", async () => {
    const response = await fetch(
      "http://localhost:3002/api/cron/send-guest-emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("success", true);
  });

  it("should return sent/failed/skipped counts", async () => {
    const response = await fetch(
      "http://localhost:3002/api/cron/send-guest-emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}`,
        },
      },
    );

    const data = await response.json();
    expect(data.data).toHaveProperty("sent");
    expect(data.data).toHaveProperty("failed");
    expect(data.data).toHaveProperty("skipped");
  });

  it("should handle empty queue", async () => {
    // Mock empty queue
    jest.mock("@/database/schema", () => ({
      prisma: {
        guestCommunication: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
        },
      },
    }));

    const response = await fetch(
      "http://localhost:3002/api/cron/send-guest-emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer test-secret`,
        },
      },
    );

    const data = await response.json();
    expect(data.data.sent).toBe(0);
    expect(data.data.failed).toBe(0);
    expect(data.data.skipped).toBe(0);
  });
});
