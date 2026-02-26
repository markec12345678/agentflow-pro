/**
 * Tourism Generate Content API integration tests
 */
import { NextRequest } from "next/server";

const mockGetServerSession = jest.fn();
const mockGetUserApiKeys = jest.fn();
const mockGetOpenAiApiKey = jest.fn();
const mockGenerateText = jest.fn();
let mockModeValue = true;

jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("@/lib/user-keys", () => ({
  getUserApiKeys: (...args: unknown[]) => mockGetUserApiKeys(...args),
}));

jest.mock("@/config/env", () => ({
  getOpenAiApiKey: () => mockGetOpenAiApiKey(),
  getLlmApiKey: () => ({ apiKey: mockGetOpenAiApiKey() || "mock-key", model: "gpt-4o-mini" }),
}));

jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

jest.mock("@/lib/mock-mode", () => ({
  get mockMode() {
    return mockModeValue;
  },
  isMockMode: () => mockModeValue,
}));

async function importHandler() {
  const mod = await import("@/app/api/tourism/generate-content/route");
  return mod.POST;
}

const authSession = {
  user: { userId: "e2e-user-1", email: "e2e@test.com" },
};

describe("POST /api/tourism/generate-content", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModeValue = true;
    mockGetUserApiKeys.mockResolvedValue({});
    mockGetOpenAiApiKey.mockReturnValue("");
  });

  function createRequest(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/tourism/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest({ topic: "Booking.com opis" });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns 400 when topic and prompt are missing", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({});
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/topic|prompt/i);
  });

  it("returns 200 with posts in mock mode when topic provided", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      topic: "Apartma Bela Krajina – Booking opis",
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("posts");
    expect(Array.isArray(json.posts)).toBe(true);
    expect(json.posts[0].fullContent).toContain("[MOCK]");
  });

  it("returns 200 when prompt provided instead of topic", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      prompt: "Napiši Airbnb opis za apartma v Črnomlju.",
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.posts.length).toBeGreaterThan(0);
  });
});
