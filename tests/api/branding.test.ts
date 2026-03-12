/**
 * Branding API Tests
 * Tests for /api/branding endpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, PUT } from "@/app/api/branding/route";
import { NextRequest } from "next/server";

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { email: "test@example.com", id: "test-user-id" },
    })
  ),
}));

// Mock Prisma
const mockBranding = {
  id: "test-branding-id",
  userId: "test-user-id",
  logoUrl: null,
  logoSmall: null,
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  accentColor: "#60A5FA",
  fontFamily: "Inter",
  removeAgentFlowBranding: false,
  customDomain: null,
  customCSS: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

vi.mock("@/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(({ where }) =>
        where.email === "test@example.com" ? Promise.resolve(mockUser) : Promise.resolve(null)
      ),
    },
    branding: {
      findUnique: vi.fn(({ where }) =>
        where.userId === "test-user-id"
          ? Promise.resolve(mockBranding)
          : Promise.resolve(null)
      ),
      upsert: vi.fn(({ create, update }) =>
        Promise.resolve({
          ...mockBranding,
          ...update,
          ...create,
        })
      ),
    },
  },
}));

describe("Branding API", () => {
  describe("GET /api/branding", () => {
    it("should return branding for authenticated user", async () => {
      const request = new NextRequest("http://localhost/api/branding");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.branding).toBeDefined();
      expect(data.branding.userId).toBe("test-user-id");
    });

    it("should return default branding if none exists", async () => {
      const { prisma } = await import("@/database");
      vi.mocked(prisma.branding.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost/api/branding");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.branding).toBeDefined();
      expect(data.branding.primaryColor).toBe("#3B82F6");
    });

    it("should return 401 for unauthenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost/api/branding");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/branding", () => {
    it("should update branding successfully", async () => {
      const requestBody = {
        primaryColor: "#FF5733",
        secondaryColor: "#C70039",
        accentColor: "#900C3F",
        fontFamily: "Roboto",
        removeAgentFlowBranding: true,
      };

      const request = new NextRequest("http://localhost/api/branding", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.branding).toBeDefined();
      expect(data.branding.primaryColor).toBe("#FF5733");
      expect(data.branding.removeAgentFlowBranding).toBe(true);
    });

    it("should reject invalid color format", async () => {
      const requestBody = {
        primaryColor: "invalid-color",
      };

      const request = new NextRequest("http://localhost/api/branding", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid color");
    });

    it("should create branding if it doesn't exist", async () => {
      const { prisma } = await import("@/database");
      vi.mocked(prisma.branding.findUnique).mockResolvedValueOnce(null);

      const requestBody = {
        primaryColor: "#28a745",
        secondaryColor: "#218838",
        accentColor: "#1e7e34",
      };

      const request = new NextRequest("http://localhost/api/branding", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.branding).toBeDefined();
      expect(data.branding.primaryColor).toBe("#28a745");
    });
  });
});
