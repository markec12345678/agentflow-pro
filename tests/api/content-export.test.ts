/**
 * Content Export API integration tests
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockBlogPostFindMany = vi.fn();
const mockContentHistoryFindMany = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

vi.mock("@/database/schema", () => ({
  prisma: {
    blogPost: {
      findMany: (...args: unknown[]) => mockBlogPostFindMany(...args),
    },
    contentHistory: {
      findMany: (...args: unknown[]) => mockContentHistoryFindMany(...args),
    },
  },
}));

async function importHandler() {
  const mod = await import("@/app/api/content/export/route");
  return mod.GET;
}

describe("GET /api/content/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBlogPostFindMany.mockResolvedValue([
      {
        id: "post-1",
        title: "Test Post",
        topic: "Testing",
        fullContent: "# Test\n\nContent here.",
        metaTitle: "Test Post",
        metaDescription: "A test post",
        pipelineStage: "published",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);
    mockContentHistoryFindMany.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/content/export");
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authentication");
  });

  it("returns 200 with markdown format, Content-Type text/markdown, .md filename", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { userId: "e2e-user-1", email: "e2e@test.com" },
    });

    const req = new NextRequest(
      "http://localhost/api/content/export?format=markdown"
    );
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/markdown/i);
    expect(res.headers.get("Content-Disposition")).toContain(".md");
    const body = await res.text();
    expect(body).toContain("# Test Post");
    expect(body).toContain("Content here.");
  });

  it("returns 200 with json format, valid JSON { items: [...] }", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { userId: "e2e-user-1", email: "e2e@test.com" },
    });

    const req = new NextRequest(
      "http://localhost/api/content/export?format=json"
    );
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(res.headers.get("Content-Disposition")).toContain(".json");
    const json = await res.json();
    expect(json).toHaveProperty("items");
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.items.length).toBeGreaterThan(0);
    expect(json.items[0]).toHaveProperty("id", "post-1");
    expect(json.items[0]).toHaveProperty("title", "Test Post");
  });
});
