/**
 * auth-options.ts – NextAuth config unit tests
 */
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const mockGetUser = jest.fn();
jest.mock("@/lib/auth-users", () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  getUserId: () => null,
  registerUser: async () => null,
}));

const mockPrismaUserUpsert = jest.fn();
const mockPrismaUserFindUnique = jest.fn();
const mockPrismaTeamMemberFindUnique = jest.fn();
const mockPrismaTeamMemberFindMany = jest.fn();

jest.mock("@/database/schema", () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => mockPrismaUserUpsert(...args),
      findUnique: (...args: unknown[]) => mockPrismaUserFindUnique(...args),
    },
    teamMember: {
      findUnique: (...args: unknown[]) => mockPrismaTeamMemberFindUnique(...args),
      findMany: (...args: unknown[]) => mockPrismaTeamMemberFindMany(...args),
    },
  },
}));

describe("authOptions", () => {
  const origEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...origEnv };
    mockPrismaTeamMemberFindMany.mockResolvedValue([]);
  });

  afterAll(() => {
    process.env = origEnv;
  });

  describe("structure", () => {
    it("has session strategy jwt and maxAge", () => {
      expect(authOptions.session).toEqual({
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
      });
    });

    it("has signIn page /login", () => {
      expect(authOptions.pages?.signIn).toBe("/login");
    });

    it("includes CredentialsProvider", () => {
      const creds = authOptions.providers?.find((p: { id?: string }) => p.id === "credentials");
      expect(creds).toBeDefined();
    });

    it("providers array has expected length", () => {
      const count = authOptions.providers?.length ?? 0;
      expect(count).toBeGreaterThanOrEqual(1); // at least Credentials
    });
  });

  describe("CredentialsProvider authorize", () => {
    let authorize: (credentials: { email?: string; password?: string }) => Promise<unknown>;

    beforeEach(() => {
      const creds = authOptions.providers?.find((p: { id?: string }) => p.id === "credentials") as {
        authorize?: (c: unknown) => Promise<unknown>;
        options?: { authorize?: (c: unknown) => Promise<unknown> };
      };
      // NextAuth Credentials() puts custom authorize in options; parseProviders merges it
      authorize = creds?.options?.authorize ?? creds?.authorize!;
    });

    it("returns null when email missing", async () => {
      expect(await authorize({ password: "p" })).toBeNull();
    });

    it("returns null when password missing", async () => {
      expect(await authorize({ email: "a@b.com" })).toBeNull();
    });

    it("returns null when getUser returns null", async () => {
      mockGetUser.mockResolvedValue(null);
      expect(await authorize({ email: "a@b.com", password: "pass" })).toBeNull();
    });

    it("returns user when getUser succeeds", async () => {
      mockGetUser.mockResolvedValue({ id: "usr-1" });
      const result = await authorize({ email: "a@b.com", password: "pass" });
      expect(result).toEqual({ id: "usr-1", email: "a@b.com", name: "a@b.com" });
    });

    it("returns null when getUser throws", async () => {
      mockGetUser.mockRejectedValue(new Error("db error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      expect(await authorize({ email: "a@b.com", password: "p" })).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("jwt callback", () => {
    const jwt = authOptions.callbacks?.jwt as (args: {
      token: JWT;
      user?: { id: string; email?: string; name?: string };
      account?: { provider?: string };
    }) => Promise<JWT>;

    it("adds userId when user provided without account", async () => {
      const token: JWT = {};
      const result = await jwt({
        token,
        user: { id: "usr-1", email: "u@b.com", name: "U" },
      });
      expect(result.userId).toBe("usr-1");
    });

    it("upserts user for Google provider and sets userId", async () => {
      mockPrismaUserUpsert.mockResolvedValue({ id: "db-usr" });
      const token: JWT = {};
      const result = await jwt({
        token,
        user: { id: "g-1", email: "g@b.com", name: "G" },
        account: { provider: "google" },
      });
      expect(mockPrismaUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "g@b.com" },
          create: expect.objectContaining({ email: "g@b.com" }),
        })
      );
      expect(result.userId).toBe("db-usr");
    });

    it("loads trialEndsAt and subscription from DB when userId present", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({
        id: "u1",
        trialEndsAt: new Date("2025-03-01"),
        activeTeamId: null,
        subscription: { stripeSubscriptionId: "sub_1", status: "active" },
      });
      const token: JWT = { userId: "u1" };
      const result = await jwt({ token });
      expect(result.trialEndsAt).toBe("2025-03-01T00:00:00.000Z");
      expect(result.subscriptionActive).toBe(true);
    });

    it("loads teamId and teamRole from membership", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({
        id: "u1",
        trialEndsAt: null,
        activeTeamId: "t1",
        subscription: null,
      });
      mockPrismaTeamMemberFindUnique.mockResolvedValue({ teamId: "t1", role: "admin" });
      const token: JWT = { userId: "u1" };
      const result = await jwt({ token });
      expect(result.teamId).toBe("t1");
      expect(result.teamRole).toBe("admin");
    });

    it("falls back to first membership when no activeTeamId", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({
        id: "u1",
        trialEndsAt: null,
        activeTeamId: null,
        subscription: null,
      });
      mockPrismaTeamMemberFindUnique.mockResolvedValue(null);
      mockPrismaTeamMemberFindMany.mockResolvedValue([
        { teamId: "t2", role: "member" },
        { teamId: "t1", role: "owner" },
      ]);
      const token: JWT = { userId: "u1" };
      const result = await jwt({ token });
      expect(result.teamId).toBe("t1");
      expect(result.teamRole).toBe("owner");
    });

    it("subscriptionActive false when canceled", async () => {
      mockPrismaUserFindUnique.mockResolvedValue({
        id: "u1",
        trialEndsAt: null,
        activeTeamId: null,
        subscription: { stripeSubscriptionId: "sub_1", status: "canceled" },
      });
      const token: JWT = { userId: "u1" };
      const result = await jwt({ token });
      expect(result.subscriptionActive).toBe(false);
    });
  });

  describe("session callback", () => {
    const sessionCb = authOptions.callbacks?.session as (args: {
      session: Session;
      token: JWT;
    }) => Session | Promise<Session>;

    it("adds userId, trialEndsAt, subscriptionActive, teamId, teamRole to session.user", async () => {
      const session: Session = {
        user: { email: "u@b.com", name: "U" },
        expires: "2025-12-31",
      };
      const token: JWT = {
        userId: "u1",
        trialEndsAt: "2025-03-01T00:00:00.000Z",
        subscriptionActive: true,
        teamId: "t1",
        teamRole: "admin",
      };
      const result = await Promise.resolve(sessionCb({ session, token }));
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      const u = result.user! as Session["user"] & {
        userId?: string;
        trialEndsAt?: string | null;
        subscriptionActive?: boolean;
        teamId?: string;
        teamRole?: string;
      };
      expect(u.userId).toBe("u1");
      expect(u.trialEndsAt).toBe("2025-03-01T00:00:00.000Z");
      expect(u.subscriptionActive).toBe(true);
      expect(u.teamId).toBe("t1");
      expect(u.teamRole).toBe("admin");
    });
  });
});
