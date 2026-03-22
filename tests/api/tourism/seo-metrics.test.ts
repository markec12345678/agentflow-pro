/**
 * Tourism SEO Metrics API integration tests
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockFindMany = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

vi.mock("@/database/schema", () => ({
  prisma: {
    seoMetric: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

const authSession = {
  user: { userId: "user-1", email: "user@test.com" },
};

const sampleMetrics = [
  {
    id: "m1",
    userId: "user-1",
    keyword: "apartmaji bela krajina",
    position: 8,
    searchVolume: 320,
    difficulty: 35,
  },
];

describe("GET /api/tourism/seo-metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  async function getMetrics() {
    const mod = await import("@/app/api/tourism/seo-metrics/route");
    const _req = new NextRequest("http://localhost/api/tourism/seo-metrics");
    return mod.GET();
  }

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await getMetrics();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized|auth/i);
  });

  it("returns empty metrics when authenticated and no data", async () => {
    mockGetServerSession.mockResolvedValue(authSession);
    mockFindMany.mockResolvedValue([]);
    const res = await getMetrics();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("metrics");
    expect(json.metrics).toEqual([]);
  });

  it("returns metrics when data exists", async () => {
    mockGetServerSession.mockResolvedValue(authSession);
    mockFindMany.mockResolvedValue(sampleMetrics);
    const res = await getMetrics();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.metrics).toHaveLength(1);
    expect(json.metrics[0].keyword).toBe("apartmaji bela krajina");
  });
});
