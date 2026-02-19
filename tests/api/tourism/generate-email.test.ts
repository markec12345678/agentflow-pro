/**
 * Tourism Generate Email API integration tests
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
}));

jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

jest.mock("@/lib/mock-mode", () => ({
  get mockMode() {
    return mockModeValue;
  },
}));

async function importHandler() {
  const mod = await import("@/app/api/tourism/generate-email/route");
  return mod.POST;
}

const authSession = {
  user: { userId: "e2e-user-1", email: "e2e@test.com" },
};

describe("POST /api/tourism/generate-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModeValue = true;
    mockGetUserApiKeys.mockResolvedValue({});
    mockGetOpenAiApiKey.mockReturnValue("");
  });

  function createRequest(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/tourism/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest({ prompt: "Test prompt" });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns 400 when prompt is missing", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({});
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/prompt/i);
  });

  it("returns 200 with content in mock mode", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      prompt: "Napiši welcome email. Jezik: {jezik}. Nastanitev: {name}.",
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("content");
    expect(json.content).toContain("[MOCK]");
  });

  it("substitutes variables server-side when variables passed", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      prompt: "Nastanitev: {name}. Lokacija: {location}.",
      variables: { name: "Apartma Kolpa", location: "Bela Krajina" },
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.content).toContain("Apartma Kolpa");
    expect(json.content).toContain("Bela Krajina");
  });
});
