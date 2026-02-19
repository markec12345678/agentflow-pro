/**
 * Tourism LandingPages API integration tests
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
    landingPage: {
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

const samplePage = {
  id: "page-1",
  userId: "user-1",
  title: "Apartma Kolpa",
  slug: "apartma-kolpa",
  content: { sl: { sections: {}, seoTitle: "Test", seoDescription: "Desc" } },
  template: "tourism-basic",
  languages: ["sl", "en"],
  isPublished: false,
  publishedUrl: null,
  seoTitle: "Apartma Kolpa | Bela Krajina",
  seoDescription: "Odkrijte...",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Tourism LandingPages API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue(samplePage);
    mockFindFirst.mockResolvedValue(samplePage);
    mockUpdate.mockResolvedValue({ ...samplePage, title: "Updated" });
    mockDelete.mockResolvedValue({});
  });

  describe("GET /api/tourism/landing-pages", () => {
    async function getList(url = "http://localhost/api/tourism/landing-pages") {
      const mod = await import("@/app/api/tourism/landing-pages/route");
      const req = new NextRequest(url);
      return mod.GET(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getList();
      expect(res.status).toBe(401);
    });

    it("returns pages when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindMany.mockResolvedValue([samplePage]);
      const res = await getList();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("pages");
      expect(json.pages).toHaveLength(1);
      expect(json.pages[0].title).toBe("Apartma Kolpa");
    });
  });

  describe("POST /api/tourism/landing-pages", () => {
    async function createPage(body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/landing-pages/route");
      const req = new NextRequest("http://localhost/api/tourism/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.POST(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await createPage({ title: "Test", content: {} });
      expect(res.status).toBe(401);
    });

    it("returns 400 when title is missing", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createPage({ content: {} });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/title/i);
    });

    it("returns 400 when content is not object", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createPage({ title: "Test", content: "invalid" });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/content/i);
    });

    it("creates page and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createPage({
        title: "Apartma Kolpa",
        content: { sl: { sections: {} }, en: { sections: {} } },
        template: "tourism-basic",
        languages: ["sl", "en"],
      });
      expect(res.status).toBe(200);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          title: "Apartma Kolpa",
          template: "tourism-basic",
        }),
      });
    });
  });

  describe("GET /api/tourism/landing-pages/[id]", () => {
    async function getOne(id: string) {
      const mod = await import("@/app/api/tourism/landing-pages/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/landing-pages/${id}`);
      return mod.GET(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getOne("page-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when page not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await getOne("page-missing");
      expect(res.status).toBe(404);
    });

    it("returns page when found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(samplePage);
      const res = await getOne("page-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.page.title).toBe("Apartma Kolpa");
    });
  });

  describe("PATCH /api/tourism/landing-pages/[id]", () => {
    async function patchOne(id: string, body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/landing-pages/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/landing-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.PATCH(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await patchOne("page-1", { title: "New" });
      expect(res.status).toBe(401);
    });

    it("returns 404 when page not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await patchOne("page-missing", { title: "New" });
      expect(res.status).toBe(404);
    });

    it("updates page and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(samplePage);
      mockUpdate.mockResolvedValue({ ...samplePage, title: "Updated" });
      const res = await patchOne("page-1", { title: "Updated" });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/tourism/landing-pages/[id]", () => {
    async function deleteOne(id: string) {
      const mod = await import("@/app/api/tourism/landing-pages/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/landing-pages/${id}`, {
        method: "DELETE",
      });
      return mod.DELETE(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await deleteOne("page-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when page not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await deleteOne("page-missing");
      expect(res.status).toBe(404);
    });

    it("deletes page and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(samplePage);
      const res = await deleteOne("page-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("success", true);
    });
  });
});
