/**
 * auth-users.ts - getUserId, registerUser, getUser
 */
import type { Session } from "next-auth";
import bcrypt from "bcryptjs";
import { getUserId, registerUser, getUser } from "@/lib/auth-users";

const mockPrismaUserFindUnique = jest.fn();
const mockPrismaUserCreate = jest.fn();

jest.mock("@/database/schema", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockPrismaUserFindUnique(...args),
      create: (...args: unknown[]) => mockPrismaUserCreate(...args),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$hashed"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("auth-users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe("getUserId", () => {
    it("returns null for null session", () => {
      expect(getUserId(null)).toBeNull();
    });

    it("returns userId when present on session.user", () => {
      const session: Session = {
        user: { userId: "usr-1", email: "u@b.com" },
        expires: "2025",
      } as Session;
      expect(getUserId(session)).toBe("usr-1");
    });

    it("falls back to email when userId not present", () => {
      const session: Session = {
        user: { email: "u@b.com" },
        expires: "2025",
      } as Session;
      expect(getUserId(session)).toBe("u@b.com");
    });

    it("returns null when no userId or email", () => {
      const session: Session = { user: {}, expires: "2025" } as Session;
      expect(getUserId(session)).toBeNull();
    });
  });

  describe("registerUser", () => {
    it("returns null when user exists", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({ id: "existing" });
      const result = await registerUser("u@b.com", "pass");
      expect(result).toBeNull();
    });

    it("returns null when password is empty", async () => {
      const result = await registerUser("u@b.com", "   ");
      expect(result).toBeNull();
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it("creates user and returns id", async () => {
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockResolvedValue({ id: "new-1" });
      const result = await registerUser(" U@B.COM ", "pass");
      expect(result).toEqual({ id: "new-1" });
      expect(mockPrismaUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "u@b.com" }),
        })
      );
    });

    it("returns null on duplicate (P2002)", async () => {
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockRejectedValue({ code: "P2002" });
      const result = await registerUser("u@b.com", "pass");
      expect(result).toBeNull();
    });
  });

  describe("getUser", () => {
    it("returns null when user not found", async () => {
      mockPrismaUserFindUnique.mockResolvedValue(null);
      const result = await getUser("u@b.com", "pass");
      expect(result).toBeNull();
    });

    it("returns null when user has no passwordHash", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({ id: "u1", passwordHash: null });
      const result = await getUser("u@b.com", "pass");
      expect(result).toBeNull();
    });

    it("returns null when password invalid", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await getUser("u@b.com", "wrong");
      expect(result).toBeNull();
    });

    it("returns user id when valid", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" });
      const result = await getUser(" U@B.COM ", " pass ");
      expect(result).toEqual({ id: "u1" });
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: "u@b.com" },
        select: { id: true, passwordHash: true },
      });
    });
  });
});
