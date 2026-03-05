/**
 * Tourism Inquiries API unit/integration tests
 */
import { NextRequest } from "next/server";

const mockGetServerSession = jest.fn();
const mockGetUserId = jest.fn();
const mockGetPropertyForUser = jest.fn();
const mockGetPropertyIdsForUser = jest.fn();
const mockCheckRateLimitByIp = jest.fn();
const mockInquiryFindMany = jest.fn();
const mockInquiryCount = jest.fn();
const mockInquiryCreate = jest.fn();
const mockInquiryFindUnique = jest.fn();
const mockInquiryUpdate = jest.fn();
const mockPropertyFindUnique = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("@/lib/auth-users", () => ({
  getUserId: (session: unknown) => mockGetUserId(session),
}));

jest.mock("@/lib/tourism/property-access", () => ({
  getPropertyForUser: (...args: unknown[]) => mockGetPropertyForUser(...args),
  getPropertyIdsForUser: (...args: unknown[]) => mockGetPropertyIdsForUser(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimitByIp: (...args: unknown[]) => mockCheckRateLimitByIp(...args),
}));

jest.mock("@/database/schema", () => ({
  prisma: {
    inquiry: {
      findMany: (...args: unknown[]) => mockInquiryFindMany(...args),
      count: (...args: unknown[]) => mockInquiryCount(...args),
      create: (...args: unknown[]) => mockInquiryCreate(...args),
      findUnique: (...args: unknown[]) => mockInquiryFindUnique(...args),
      update: (...args: unknown[]) => mockInquiryUpdate(...args),
    },
    property: {
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
    },
  },
}));

const authSession = { user: { userId: "user-1", email: "user@test.com" } };
const sampleInquiry = {
  id: "inq-1",
  propertyId: "prop-1",
  name: "Janez Novak",
  email: "janez@test.com",
  phone: null,
  message: "Pozdravljeni, zanima me razpoložljivost.",
  type: "general",
  status: "new",
  source: "form",
  checkIn: null,
  checkOut: null,
  guestCount: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Tourism Inquiries API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserId.mockImplementation((s) => (s ? "user-1" : null));
    mockCheckRateLimitByIp.mockReturnValue({ allowed: true });
    mockGetPropertyIdsForUser.mockResolvedValue(["prop-1", "prop-2"]);
    mockGetPropertyForUser.mockResolvedValue({ id: "prop-1" });
    mockPropertyFindUnique.mockResolvedValue({ id: "prop-1" });
    mockInquiryFindMany.mockResolvedValue([]);
    mockInquiryCount.mockResolvedValue(0);
    mockInquiryCreate.mockResolvedValue({ ...sampleInquiry, status: "new" });
    mockInquiryFindUnique.mockResolvedValue(sampleInquiry);
    mockInquiryUpdate.mockResolvedValue({ ...sampleInquiry, status: "read" });
  });

  describe("GET /api/tourism/inquiries", () => {
    async function getInquiries(url = "http://localhost/api/tourism/inquiries") {
      const mod = await import("@/app/api/tourism/inquiries/route");
      const req = new NextRequest(url);
      return mod.GET(req);
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockGetUserId.mockReturnValue(null);
      const res = await getInquiries();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toMatchObject({ error: "Authentication required" });
    });

    it("returns inquiries when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockInquiryFindMany.mockResolvedValue([sampleInquiry]);
      mockInquiryCount.mockResolvedValue(1);
      const res = await getInquiries();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.inquiries).toHaveLength(1);
      expect(json.total).toBe(1);
      expect(json.inquiries[0].name).toBe("Janez Novak");
    });

    it("filters by status when provided", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      const res = await getInquiries("http://localhost/api/tourism/inquiries?status=new");
      expect(res.status).toBe(200);
      expect(mockInquiryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "new" }),
        })
      );
    });
  });

  describe("POST /api/tourism/inquiries (public)", () => {
    async function createInquiry(body: Record<string, unknown>, headers?: Record<string, string>) {
      const mod = await import("@/app/api/tourism/inquiries/route");
      const req = new NextRequest("http://localhost/api/tourism/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
      return mod.POST(req);
    }

    it("returns 429 when rate limited", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockGetUserId.mockReturnValue(null);
      mockCheckRateLimitByIp.mockReturnValue({ allowed: false, retryAfter: 60 });
      const res = await createInquiry({
        propertyId: "prop-1",
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message with enough characters",
      });
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toMatch(/too many/i);
    });

    it("returns 400 when validation fails", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const res = await createInquiry({
        propertyId: "prop-1",
        name: "A",
        email: "invalid",
        message: "short",
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 404 when property does not exist", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockPropertyFindUnique.mockResolvedValue(null);
      const res = await createInquiry({
        propertyId: "nonexistent",
        name: "Test User",
        email: "test@example.com",
        message: "This is a valid message with enough characters",
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toMatch(/property/i);
    });

    it("returns 201 when created successfully (public)", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockGetUserId.mockReturnValue(null);
      mockInquiryCreate.mockResolvedValue({ id: "inq-new", status: "new" });
      const res = await createInquiry({
        propertyId: "prop-1",
        name: "Test User",
        email: "test@example.com",
        message: "This is a valid message with enough characters",
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe("inq-new");
      expect(json.status).toBe("new");
      expect(mockInquiryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: "form",
            name: "Test User",
            email: "test@example.com",
          }),
        })
      );
    });
  });

  describe("POST /api/tourism/inquiries (authenticated)", () => {
    async function createInquiryAuth(body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/inquiries/route");
      const req = new NextRequest("http://localhost/api/tourism/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.POST(req);
    }

    it("creates with source manual when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockInquiryCreate.mockResolvedValue({ id: "inq-manual", status: "new" });
      const res = await createInquiryAuth({
        propertyId: "prop-1",
        name: "Staff User",
        email: "staff@test.com",
        message: "Manually added inquiry with enough text",
      });
      expect(res.status).toBe(201);
      expect(mockInquiryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ source: "manual" }),
        })
      );
    });

    it("returns 403 when user has no access to property", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockGetPropertyForUser.mockResolvedValue(null);
      const res = await createInquiryAuth({
        propertyId: "prop-other",
        name: "Test",
        email: "test@test.com",
        message: "Valid message with enough characters here",
      });
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/tourism/inquiries/[id]", () => {
    async function patchInquiry(id: string, body: Record<string, unknown>) {
      const mod = await import("@/app/api/tourism/inquiries/[id]/route");
      const req = new NextRequest("http://localhost/api/tourism/inquiries/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return mod.PATCH(req, { params: Promise.resolve({ id }) });
    }

    it("returns 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockGetUserId.mockReturnValue(null);
      const res = await patchInquiry("inq-1", { status: "read" });
      expect(res.status).toBe(401);
    });

    it("returns 404 when inquiry not found", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockInquiryFindUnique.mockResolvedValue(null);
      const res = await patchInquiry("nonexistent", { status: "read" });
      expect(res.status).toBe(404);
    });

    it("returns 403 when user has no access to property", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockGetPropertyForUser.mockResolvedValue(null);
      const res = await patchInquiry("inq-1", { status: "read" });
      expect(res.status).toBe(403);
    });

    it("updates status successfully", async () => {
      mockGetServerSession.mockResolvedValue(authSession);
      mockInquiryUpdate.mockResolvedValue({ ...sampleInquiry, status: "replied" });
      const res = await patchInquiry("inq-1", { status: "replied" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("replied");
      expect(mockInquiryUpdate).toHaveBeenCalledWith({
        where: { id: "inq-1" },
        data: { status: "replied" },
      });
    });
  });
});
