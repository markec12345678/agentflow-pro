/**
 * Batch Translate API integration tests
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockTranslationJobCreate = vi.fn();
const mockTranslationJobUpdate = vi.fn();
const mockAgentRunCreate = vi.fn();
const mockGetUserApiKeys = vi.fn();
const mockGetOpenAiApiKey = vi.fn();
const mockGenerateText = vi.fn();

let mockModeValue = true;
vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

vi.mock("@/database/schema", () => ({
  prisma: {
    translationJob: {
      create: (...args: unknown[]) => mockTranslationJobCreate(...args),
      update: (...args: unknown[]) => mockTranslationJobUpdate(...args),
    },
    agentRun: {
      create: (...args: unknown[]) => mockAgentRunCreate(...args),
    },
  },
}));

vi.mock("@/lib/mock-mode", () => ({
  get mockMode() {
    return mockModeValue;
  },
  isMockMode: () => mockModeValue,
}));

vi.mock("@/lib/user-keys", () => ({
  getUserApiKeys: (...args: unknown[]) => mockGetUserApiKeys(...args),
}));

vi.mock("@/config/env", () => ({
  getOpenAiApiKey: () => mockGetOpenAiApiKey(),
  getLlmApiKey: () => ({ apiKey: mockGetOpenAiApiKey() || "mock-key", model: "gpt-4o-mini" }),
  getLlmFromUserKeys: (keys?: Record<string, string>) =>
    keys?.openai ? { apiKey: keys.openai, model: "gpt-4o-mini" } : { apiKey: mockGetOpenAiApiKey() || "", model: "gpt-4o-mini" },
}));

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));


async function importHandler() {
  const mod = await import("@/app/api/tourism/batch-translate/route");
  return mod.POST;
}

const authSession = {
  user: { userId: "e2e-user-1", email: "e2e@test.com" },
};

describe("POST /api/tourism/batch-translate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModeValue = true;
    mockGetUserApiKeys.mockResolvedValue({});
    mockAgentRunCreate.mockResolvedValue({} as never);
    mockGetOpenAiApiKey.mockReturnValue("");
    mockTranslationJobCreate.mockResolvedValue({
      id: "job-1",
      userId: "e2e-user-1",
      sourceContent: "Test",
      sourceLang: "sl",
      targetLangs: ["en", "de"],
      status: "processing",
    });
    mockTranslationJobUpdate.mockResolvedValue({});
  });

  function createRequest(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/tourism/batch-translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest({
      content: "Test",
      sourceLang: "sl",
      targetLangs: ["en", "de"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns 400 when content is missing", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      sourceLang: "sl",
      targetLangs: ["en"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/content/i);
  });

  it("returns 400 when targetLangs is empty or invalid", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      content: "Test content",
      sourceLang: "sl",
      targetLangs: [],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/targetLangs|invalid/i);
  });

  it("translates single content to multiple languages (mock mode)", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      content: "Dobrodošli v apartmaju.",
      sourceLang: "sl",
      targetLangs: ["en", "de", "it", "hr"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("jobId", "job-1");
    expect(json).toHaveProperty("translations");
    expect(Object.keys(json.translations)).toEqual(
      expect.arrayContaining(["en", "de", "it", "hr"])
    );
    expect(json.translations.en).toContain("[MOCK en]");
    expect(json.translations.de).toContain("[MOCK de]");
  });

  it("creates job with status processing, updates to completed", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      content: "Test",
      sourceLang: "sl",
      targetLangs: ["en"],
    });
    const handler = await importHandler();
    await handler(req);

    expect(mockTranslationJobCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "processing",
        sourceLang: "sl",
        targetLangs: ["en"],
      }),
    });
    expect(mockTranslationJobUpdate).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "completed",
        results: expect.any(Object),
        completedAt: expect.any(Date),
      }),
    });
  });

  it("when one language fails, returns partial results with Translation error", async () => {
    mockModeValue = false;
    mockGetOpenAiApiKey.mockReturnValue("fake-api-key");
    mockGetServerSession.mockResolvedValue(authSession);

    mockGenerateText.mockImplementation(async (opts: { prompt?: string }) => {
      const prompt = opts?.prompt ?? "";
      if (prompt.includes(" to de.")) {
        throw new Error("Simulated API failure for German");
      }
      const langMatch = prompt.match(/ to (\w+)\./);
      const lang = langMatch?.[1] ?? "unknown";
      return {
        text: `Translated to ${lang}`,
        usage: {
          promptTokens: 50,
          completionTokens: 20,
          totalTokens: 70,
        },
      };
    });

    const req = createRequest({
      content: "Test content",
      sourceLang: "sl",
      targetLangs: ["en", "de", "it"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.translations.en).toBe("Translated to en");
    expect(json.translations.de).toBe("[Translation error]");
    expect(json.translations.it).toBe("Translated to it");

    expect(mockTranslationJobUpdate).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "completed",
        results: expect.objectContaining({
          en: "Translated to en",
          de: "[Translation error]",
          it: "Translated to it",
        }),
      }),
    });
  });

  it("records AI usage via PrismaAiUsageLogger when translations succeed", async () => {
    mockModeValue = false;
    mockGetOpenAiApiKey.mockReturnValue("fake-key");
    mockGetServerSession.mockResolvedValue(authSession);

    mockGenerateText.mockResolvedValue({
      text: "Translated content",
      usage: {
        inputTokens: 50,
        outputTokens: 25,
        totalTokens: 75,
      },
    });

    const req = createRequest({
      content: "Test",
      sourceLang: "sl",
      targetLangs: ["en"],
    });
    const handler = await importHandler();
    await handler(req);

    expect(mockAgentRunCreate).toHaveBeenCalled();
    const createCall = mockAgentRunCreate.mock.calls[0][0];
    expect(createCall.data).toMatchObject({
      userId: "e2e-user-1",
      agentType: "translation",
      status: "completed",
      model: "gpt-4o-mini",
    });
  });
});
