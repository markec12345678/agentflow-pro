/**
 * Integration tests for /api/cron/smart-alerts
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockPropertyFindMany = vi.fn();
const mockGetOccupancyForProperty = vi.fn();
const mockTriggerAlert = vi.fn();
const mockRunEscalationCheck = vi.fn();

vi.mock("@/database/schema", () => ({
  prisma: {
    property: {
      findMany: (...args: unknown[]) => mockPropertyFindMany(...args),
    },
  },
}));

vi.mock("@/lib/tourism/occupancy", () => ({
  getOccupancyForProperty: (...args: unknown[]) =>
    mockGetOccupancyForProperty(...args),
}));

vi.mock("@/alerts/smartAlerts", () => ({
  triggerAlert: (...args: unknown[]) => mockTriggerAlert(...args),
  runEscalationCheck: (...args: unknown[]) => mockRunEscalationCheck(...args),
}));

const originalEnv = process.env;

describe("GET /api/cron/smart-alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockPropertyFindMany.mockResolvedValue([{ id: "prop-1" }]);
    mockGetOccupancyForProperty.mockResolvedValue({
      today: { occupancyPercent: 80 },
    });
    mockRunEscalationCheck.mockResolvedValue(0);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function callSmartAlerts(headers?: Record<string, string>) {
    const mod = await import("@/app/api/cron/smart-alerts/route");
    const req = new NextRequest("http://localhost/api/cron/smart-alerts", {
      headers: headers ?? {},
    });
    return mod.GET(req);
  }

  it("returns 401 when CRON_SECRET is set and auth header is missing", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callSmartAlerts({});
    expect(res.status).toBe(401);
    expect(mockPropertyFindMany).not.toHaveBeenCalled();
  }, 15000);

  it("succeeds with x-vercel-cron header", async () => {
    delete process.env.CRON_SECRET;
    const res = await callSmartAlerts({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockPropertyFindMany).toHaveBeenCalled();
    const json = await res.json();
    expect(json).toMatchObject({ success: true, checked: 1, triggered: 0 });
  }, 15000);

  it("calls triggerAlert when occupancy >= 95", async () => {
    delete process.env.CRON_SECRET;
    mockGetOccupancyForProperty.mockResolvedValue({
      today: { occupancyPercent: 97 },
    });

    const res = await callSmartAlerts({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockTriggerAlert).toHaveBeenCalledWith("occupancy", {
      propertyId: "prop-1",
      value: 97,
    });
    const json = await res.json();
    expect(json).toMatchObject({ triggered: 1 });
  });

  it("calls runEscalationCheck and returns escalated count", async () => {
    delete process.env.CRON_SECRET;
    mockRunEscalationCheck.mockResolvedValue(2);

    const res = await callSmartAlerts({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockRunEscalationCheck).toHaveBeenCalled();
    const json = await res.json();
    expect(json).toMatchObject({ escalated: 2 });
  });

  it("returns 500 on error", async () => {
    delete process.env.CRON_SECRET;
    mockPropertyFindMany.mockRejectedValue(new Error("DB failed"));

    const res = await callSmartAlerts({ "x-vercel-cron": "1" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toMatchObject({ error: "Smart alerts cron failed" });
  });
});
