/**
 * Unit tests for /api/cron/pms-sync-all
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockPmsConnectionFindMany = vi.fn();
const mockGetReservations = vi.fn();
const mockSyncToAgentFlow = vi.fn();
const mockGetPmsAdapter = vi.fn();

vi.mock("@/database/schema", () => ({
  prisma: {
    pmsConnection: {
      findMany: (...args: unknown[]) => mockPmsConnectionFindMany(...args),
    },
  },
}));

vi.mock("@/lib/tourism/mews-adapter", () => ({
  getPmsAdapter: (name: string) => mockGetPmsAdapter(name),
}));

const cronAuthHeaders = { "x-vercel-cron": "1" };

describe("GET /api/cron/pms-sync-all", () => {
  function createMockAdapter() {
    return {
      getReservations: mockGetReservations,
      syncToAgentFlow: mockSyncToAgentFlow,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    mockPmsConnectionFindMany.mockResolvedValue([]);
    mockGetPmsAdapter.mockReturnValue(createMockAdapter());
    mockGetReservations.mockResolvedValue([]);
    mockSyncToAgentFlow.mockResolvedValue({
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
    });
  });

  async function callPmsSyncAll(headers?: Record<string, string>) {
    const mod = await import("@/app/api/cron/pms-sync-all/route");
    const req = new NextRequest("http://localhost/api/cron/pms-sync-all", {
      headers: headers ?? {},
    });
    return mod.GET(req);
  }

  it("returns 401 when CRON_SECRET is set and auth header is missing", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callPmsSyncAll({});
    expect(res.status).toBe(401);
    expect(mockPmsConnectionFindMany).not.toHaveBeenCalled();
  });

  it("succeeds when x-vercel-cron header is present", async () => {
    process.env.CRON_SECRET = "secret123";
    mockPmsConnectionFindMany.mockResolvedValue([]);
    const res = await callPmsSyncAll({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockPmsConnectionFindMany).toHaveBeenCalled();
  });

  it("returns empty results when no PmsConnections exist", async () => {
    mockPmsConnectionFindMany.mockResolvedValue([]);

    const res = await callPmsSyncAll(cronAuthHeaders);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      success: true,
      processed: 0,
      totalSynced: 0,
      results: [],
    });
  });

  it("syncs all connections and aggregates results", async () => {
    mockPmsConnectionFindMany.mockResolvedValue([
      {
        id: "conn-1",
        propertyId: "prop-1",
        provider: "mews",
        credentials: {
          accessToken: "at1",
          clientToken: "ct1",
        },
        property: { id: "prop-1", name: "Hotel A" },
      },
      {
        id: "conn-2",
        propertyId: "prop-2",
        provider: "mews",
        credentials: {
          accessToken: "at2",
          clientToken: "ct2",
        },
        property: { id: "prop-2", name: "Hotel B" },
      },
    ]);
    mockGetReservations
      .mockResolvedValueOnce([{ externalId: "r1", checkIn: new Date(), checkOut: new Date() }])
      .mockResolvedValueOnce([]);
    mockSyncToAgentFlow
      .mockResolvedValueOnce({ synced: 1, created: 1, updated: 0, errors: [] })
      .mockResolvedValueOnce({ synced: 0, created: 0, updated: 0, errors: [] });

    const res = await callPmsSyncAll({});
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toMatchObject({
      success: true,
      processed: 2,
      totalSynced: 1,
      results: [
        { propertyId: "prop-1", synced: 1, created: 1, updated: 0, fetched: 1, errors: [] },
        { propertyId: "prop-2", synced: 0, created: 0, updated: 0, fetched: 0, errors: [] },
      ],
    });
    expect(mockGetPmsAdapter).toHaveBeenCalledWith("mews");
    expect(mockGetReservations).toHaveBeenCalledTimes(2);
    expect(mockSyncToAgentFlow).toHaveBeenCalledTimes(2);
  });

  it("reports missing credentials for connection without tokens", async () => {
    mockPmsConnectionFindMany.mockResolvedValue([
      {
        id: "conn-1",
        propertyId: "prop-1",
        provider: "mews",
        credentials: {},
        property: { id: "prop-1" },
      },
    ]);

    const res = await callPmsSyncAll({});
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toMatchObject({
      propertyId: "prop-1",
      synced: 0,
      errors: ["Missing credentials in PmsConnection"],
    });
    expect(mockGetReservations).not.toHaveBeenCalled();
  });

  it("reports unknown provider", async () => {
    mockPmsConnectionFindMany.mockResolvedValue([
      {
        id: "conn-1",
        propertyId: "prop-1",
        provider: "unknown",
        credentials: { accessToken: "at", clientToken: "ct" },
        property: { id: "prop-1" },
      },
    ]);
    mockGetPmsAdapter.mockReturnValue(null);

    const res = await callPmsSyncAll(cronAuthHeaders);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toMatchObject({
      propertyId: "prop-1",
      errors: ["Unknown PMS provider: unknown"],
    });
    expect(mockGetReservations).not.toHaveBeenCalled();
  });

  it("continues on per-connection error and reports in results", async () => {
    mockPmsConnectionFindMany.mockResolvedValue([
      {
        id: "conn-1",
        propertyId: "prop-1",
        provider: "mews",
        credentials: { accessToken: "at", clientToken: "ct" },
        property: { id: "prop-1" },
      },
    ]);
    mockGetReservations.mockRejectedValue(new Error("Mews API timeout"));

    const res = await callPmsSyncAll({});
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.results[0]).toMatchObject({
      propertyId: "prop-1",
      synced: 0,
      errors: ["Mews API timeout"],
    });
  });

  it("returns 500 on unexpected top-level error", async () => {
    mockPmsConnectionFindMany.mockRejectedValue(new Error("Prisma connection failed"));

    const res = await callPmsSyncAll(cronAuthHeaders);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toMatchObject({ error: "PMS sync-all failed" });
  });
});
