/**
 * Integration tests for /api/cron/smart-alerts-errors
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockAlertEventCount = vi.fn();
const mockAlertEventFindFirst = vi.fn();
const mockAlertEventDeleteMany = vi.fn();
const mockTriggerAlert = vi.fn();

vi.mock("@/database/schema", () => ({
  prisma: {
    alertEvent: {
      count: (...args: unknown[]) => mockAlertEventCount(...args),
      findFirst: (...args: unknown[]) => mockAlertEventFindFirst(...args),
      deleteMany: (...args: unknown[]) => mockAlertEventDeleteMany(...args),
    },
  },
}));

vi.mock("@/alerts/smartAlerts", () => ({
  triggerAlert: (...args: unknown[]) => mockTriggerAlert(...args),
}));

const originalEnv = process.env;

describe("GET /api/cron/smart-alerts-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockAlertEventCount.mockResolvedValue(0);
    mockAlertEventFindFirst.mockResolvedValue(null);
    mockAlertEventDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function callSmartAlertsErrors(headers?: Record<string, string>) {
    const mod = await import("@/app/api/cron/smart-alerts-errors/route");
    const req = new NextRequest(
      "http://localhost/api/cron/smart-alerts-errors",
      { headers: headers ?? {} }
    );
    return mod.GET(req);
  }

  it("returns 401 when CRON_SECRET is set and auth header is missing", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callSmartAlertsErrors({});
    expect(res.status).toBe(401);
    expect(mockAlertEventCount).not.toHaveBeenCalled();
  });

  it("succeeds with x-vercel-cron when count < 3", async () => {
    delete process.env.CRON_SECRET;
    mockAlertEventCount.mockResolvedValue(2);

    const res = await callSmartAlertsErrors({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockTriggerAlert).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json).toMatchObject({ success: true, count: 2, triggered: 0 });
  });

  it("triggers alert when count >= 3", async () => {
    delete process.env.CRON_SECRET;
    mockAlertEventCount.mockResolvedValue(5);
    mockAlertEventFindFirst.mockResolvedValue({
      metadata: { message: "ECONNREFUSED" },
    });

    const res = await callSmartAlertsErrors({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockTriggerAlert).toHaveBeenCalledWith("system_error", {
      count: 5,
      lastError: "ECONNREFUSED",
    });
    const json = await res.json();
    expect(json).toMatchObject({ count: 5, triggered: 1 });
  });

  it("returns 500 on error", async () => {
    delete process.env.CRON_SECRET;
    mockAlertEventCount.mockRejectedValue(new Error("DB failed"));

    const res = await callSmartAlertsErrors({ "x-vercel-cron": "1" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toMatchObject({ error: "Smart alerts errors cron failed" });
  });
});
