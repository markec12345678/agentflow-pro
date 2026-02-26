/**
 * Tourism Generate Landing API integration tests
 */
import { NextRequest } from "next/server";

const mockGetServerSession = jest.fn();
let mockModeValue = true;

jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("@/lib/mock-mode", () => ({
  get mockMode() {
    return mockModeValue;
  },
  isMockMode: () => mockModeValue,
}));

async function importHandler() {
  const mod = await import("@/app/api/tourism/generate-landing/route");
  return mod.POST;
}

const authSession = {
  user: { userId: "e2e-user-1", email: "e2e@test.com" },
};

describe("POST /api/tourism/generate-landing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModeValue = true;
  });

  function createRequest(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/tourism/generate-landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest({
      template: "tourism-basic",
      formData: { name: "Test" },
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication|required/i);
  });

  it("returns 400 when template is invalid", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      template: "invalid-template",
      formData: {},
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/template|invalid/i);
  });

  it("returns 200 with pages for valid template", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      template: "tourism-basic",
      formData: { name: "Apartma Kolpa", location: "Bela Krajina", type: "apartma" },
      languages: ["sl", "en"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("pages");
    expect(json.pages).toHaveProperty("sl");
    expect(json.pages).toHaveProperty("en");
    expect(json.pages.sl).toHaveProperty("sections");
    expect(json.pages.sl).toHaveProperty("seoTitle");
    expect(json.pages.sl).toHaveProperty("seoDescription");
  });

  it("luxury-retreat template includes story and gallery sections", async () => {
    mockGetServerSession.mockResolvedValue(authSession);

    const req = createRequest({
      template: "luxury-retreat",
      formData: { name: "Vila Lux", location: "Bled" },
      languages: ["sl"],
    });
    const handler = await importHandler();
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pages.sl.sections).toHaveProperty("story");
    expect(json.pages.sl.sections).toHaveProperty("gallery");
  });
});
