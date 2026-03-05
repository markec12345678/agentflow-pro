/**
 * Tourism Properties API integration tests
 */
import { NextRequest } from "next/server";

const mockGetServerSession = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockRoomFindMany = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("@/database/schema", () => ({
  prisma: {
    property: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    room: {
      findMany: (...args: unknown[]) => mockRoomFindMany(...args),
    },
  },
}));

const authSession = {
  user: { userId: "user-1", email: "user@test.com" },
};

const sampleProperty = {
  id: "prop-1",
  userId: "user-1",
  name: "Apartma Kolpa",
  location: "Bela Krajina",
  type: "apartma",
  capacity: 4,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Tourism Properties API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue(sampleProperty);
    mockFindFirst.mockResolvedValue(sampleProperty);
    mockFindUnique.mockResolvedValue({ _count: { rooms: 0, reservations: 0, guests: 0 } });
    mockUpdate.mockResolvedValue({ ...sampleProperty, name: "Updated" });
    mockDelete.mockResolvedValue({});
    mockRoomFindMany.mockResolvedValue([]);
  });

  describe("GET /api/tourism/properties", () => {
    async function getList() {
      const mod = await import("@/app/api/tourism/properties/route");
      return mod.GET();
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getList();
      expect(res.status).toBe(401);
    });

    it("returns properties when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindMany.mockResolvedValue([sampleProperty]);
      const res = await getList();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("properties");
      expect(json.properties).toHaveLength(1);
      expect(json.properties[0].name).toBe("Apartma Kolpa");
    });
  });

  describe("POST /api/tourism/properties", () => {
    async function createProperty(body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/properties/route");
      const req = new NextRequest("http://localhost/api/tourism/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.POST(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await createProperty({ name: "Test" });
      expect(res.status).toBe(401);
    });

    it("returns 400 when name is missing", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createProperty({});
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/name/i);
    });

    it("creates property and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await createProperty({
        name: "Apartma Kolpa",
        location: "Bela Krajina",
        type: "apartment", // Fixed: must match enum values
        capacity: 4,
      });
      expect(res.status).toBe(200);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          name: "Apartma Kolpa",
          location: "Bela Krajina",
          type: "apartment",
          capacity: 4,
        }),
      });
    });
  });

  describe("GET /api/tourism/properties/[id]", () => {
    async function getOne(id: string) {
      const mod = await import("@/app/api/tourism/properties/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/properties/${id}`);
      return mod.GET(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await getOne("prop-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when property not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await getOne("prop-missing");
      expect(res.status).toBe(404);
    });

    it("returns property when found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleProperty);
      const res = await getOne("prop-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.property.name).toBe("Apartma Kolpa");
    });
  });

  describe("PATCH /api/tourism/properties/[id]", () => {
    async function patchOne(id: string, body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/properties/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.PATCH(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await patchOne("prop-1", { name: "New" });
      expect(res.status).toBe(401);
    });

    it("returns 404 when property not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await patchOne("prop-missing", { name: "New" });
      expect(res.status).toBe(404);
    });

    it("updates property and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleProperty);
      mockUpdate.mockResolvedValue({ ...sampleProperty, name: "Updated" });
      const res = await patchOne("prop-1", { name: "Updated" });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/tourism/properties/[id]", () => {
    async function deleteOne(id: string) {
      const mod = await import("@/app/api/tourism/properties/[id]/route");
      const req = new NextRequest(`http://localhost/api/tourism/properties/${id}`, {
        method: "DELETE",
      });
      return mod.DELETE(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await deleteOne("prop-1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when property not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(null);
      const res = await deleteOne("prop-missing");
      expect(res.status).toBe(404);
    });

    it("deletes property and returns 200", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockFindFirst.mockResolvedValue(sampleProperty);
      const res = await deleteOne("prop-1");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("ok", true);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "prop-1" } });
    });
  });
});
