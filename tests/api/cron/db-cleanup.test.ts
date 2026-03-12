/**
 * Unit tests for /api/cron/db-cleanup
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockSessionDeleteMany = vi.fn();
const mockVerificationTokenDeleteMany = vi.fn();

vi.mock("@/database/schema", () => ({
  prisma: {
    session: {
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
    verificationToken: {
      deleteMany: (...args: unknown[]) => mockVerificationTokenDeleteMany(...args),
    },
  },
}));

const originalEnv = process.env;

describe("GET /api/cron/db-cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockSessionDeleteMany.mockResolvedValue({ count: 0 });
    mockVerificationTokenDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function callDbCleanup(headers?: Record<string, string>) {
    const mod = await import("@/app/api/cron/db-cleanup/route");
    const req = new NextRequest("http://localhost/api/cron/db-cleanup", {
      headers: headers ?? {},
    });
    return mod.GET(req);
  }

  it("returns 401 when CRON_SECRET is set and auth header is missing", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callDbCleanup({});
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
    expect(mockSessionDeleteMany).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is set and Bearer token is wrong", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callDbCleanup({
      authorization: "Bearer wrong-token",
    });
    expect(res.status).toBe(401);
    expect(mockSessionDeleteMany).not.toHaveBeenCalled();
  });

  it("succeeds when x-vercel-cron header is present", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callDbCleanup({ "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(mockSessionDeleteMany).toHaveBeenCalled();
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalled();
  });

  it("succeeds when Bearer CRON_SECRET is correct", async () => {
    process.env.CRON_SECRET = "secret123";
    const res = await callDbCleanup({
      authorization: "Bearer secret123",
    });
    expect(res.status).toBe(200);
    expect(mockSessionDeleteMany).toHaveBeenCalled();
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalled();
  });

  it("succeeds when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const res = await callDbCleanup({});
    expect(res.status).toBe(200);
    expect(mockSessionDeleteMany).toHaveBeenCalled();
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalled();
  });

  it("deletes expired sessions and tokens with correct where clause", async () => {
    delete process.env.CRON_SECRET;
    mockSessionDeleteMany.mockResolvedValue({ count: 5 });
    mockVerificationTokenDeleteMany.mockResolvedValue({ count: 2 });

    const res = await callDbCleanup({});
    expect(res.status).toBe(200);

    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { expires: { lt: expect.any(Date) } },
    });
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalledWith({
      where: { expires: { lt: expect.any(Date) } },
    });

    const json = await res.json();
    expect(json).toMatchObject({
      success: true,
      deleted: {
        sessions: 5,
        verificationTokens: 2,
      },
    });
  });

  it("returns 500 on database error", async () => {
    delete process.env.CRON_SECRET;
    mockSessionDeleteMany.mockRejectedValue(new Error("DB connection failed"));

    const res = await callDbCleanup({});
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toMatchObject({ error: "DB cleanup failed" });
  });
});
