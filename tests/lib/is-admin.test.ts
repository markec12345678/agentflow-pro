import { isAdminEmail } from "@/lib/is-admin";

jest.mock("@/config/env", () => ({
  getAdminEmails: () => ["admin@test.com", "super@test.com"],
}));

describe("isAdminEmail", () => {
  it("returns true for admin email", () => {
    expect(isAdminEmail("admin@test.com")).toBe(true);
    expect(isAdminEmail("ADMIN@TEST.COM")).toBe(true);
    expect(isAdminEmail(" super@test.com ")).toBe(true);
  });

  it("returns false for non-admin", () => {
    expect(isAdminEmail("user@test.com")).toBe(false);
  });

  it("returns false for null/undefined/empty", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});
