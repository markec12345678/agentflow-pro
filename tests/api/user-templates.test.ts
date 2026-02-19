/**
 * UserTemplate API integration tests
 */
import { NextRequest } from "next/server";

const mockGetServerSession = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("@/database/schema", () => ({
  prisma: {
    userTemplate: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

const authSession = {
  user: { userId: "user-1", email: "user@test.com" },
};

const sampleTemplate = {
  id: "tpl-1",
  userId: "user-1",
  name: "Test Template",
  category: "tourism",
  basePrompt: "booking-description",
  customVars: { lokacija: "Bela Krajina" },
  propertyId: null,
  content: null,
  language: null,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("UserTemplate API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue(sampleTemplate);
    mockFindFirst.mockResolvedValue(sampleTemplate);
    mockUpdate.mockResolvedValue({ ...sampleTemplate, name: "Updated" });
    mockDelete.mockResolvedValue({});
  });

  describe("GET /api/user/templates", () => {
    async function getList(url = "http://localhost/api/user/templates") {
      const mod = await import("@/app/api/user/templates/route");
      const req = new NextRequest(url);
      return mod.GET(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getList();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/auth/i);
    });

    it("returns templates when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindMany.mockResolvedValue([sampleTemplate]);
      const res = await getList();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("templates");
      expect(json.templates).toHaveLength(1);
      expect(json.templates[0].name).toBe("Test Template");
    });

    it("filters by category when provided", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      await getList("http://localhost/api/user/templates?category=tourism");
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "tourism" }),
        })
      );
    });
  });

  describe("POST /api/user/templates", () => {
    async function createTemplate(body: Record<string, unknown>) {
      const mod = await import("@/app/api/user/templates/route");
      const req = new NextRequest("http://localhost/api/user/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.POST(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await createTemplate({
        name: "Test",
        category: "tourism",
        basePrompt: "booking-description",
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 when name, category or basePrompt missing", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createTemplate({
        name: "",
        category: "tourism",
        basePrompt: "booking-description",
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/name|category|basePrompt/i);
    });

    it("creates template and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createTemplate({
        name: "Apartma Bela Krajina",
        category: "tourism",
        basePrompt: "booking-description",
        customVars: { lokacija: "Bela Krajina", tip: "apartma" },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("template");
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          name: "Apartma Bela Krajina",
          category: "tourism",
          basePrompt: "booking-description",
          customVars: { lokacija: "Bela Krajina", tip: "apartma" },
        }),
      });
    });
  });

  describe("GET /api/user/templates/[id]", () => {
    async function getOne(id: string) {
      const mod = await import("@/app/api/user/templates/[id]/route");
      const req = new NextRequest(`http://localhost/api/user/templates/${id}`);
      return mod.GET(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getOne("tpl-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when template not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await getOne("tpl-missing");
      expect(res.status).toBe(404);
    });

    it("returns template when found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleTemplate);
      const res = await getOne("tpl-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.template.name).toBe("Test Template");
    });
  });

  describe("PATCH /api/user/templates/[id]", () => {
    async function patchOne(id: string, body: Record<string, unknown>) {
      const mod = await import("@/app/api/user/templates/[id]/route");
      const req = new NextRequest(`http://localhost/api/user/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.PATCH(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await patchOne("tpl-1", { name: "New Name" });
      expect(res.status).toBe(401);
    });

    it("returns 404 when template not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await patchOne("tpl-missing", { name: "New" });
      expect(res.status).toBe(404);
    });

    it("updates template and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleTemplate);
      mockUpdate.mockResolvedValue({ ...sampleTemplate, name: "Updated Name" });
      const res = await patchOne("tpl-1", { name: "Updated Name" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.template.name).toBe("Updated Name");
    });
  });

  describe("DELETE /api/user/templates/[id]", () => {
    async function deleteOne(id: string) {
      const mod = await import("@/app/api/user/templates/[id]/route");
      const req = new NextRequest(`http://localhost/api/user/templates/${id}`, {
        method: "DELETE",
      });
      return mod.DELETE(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await deleteOne("tpl-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when template not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await deleteOne("tpl-missing");
      expect(res.status).toBe(404);
    });

    it("deletes template and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleTemplate);
      const res = await deleteOne("tpl-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("success", true);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "tpl-1" } });
    });
  });
});
