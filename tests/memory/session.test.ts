/**
 * Session Manager tests - session CRUD
 */

import { SessionManager } from "@/memory/session-manager";

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it("creates session with optional id", () => {
    const s1 = manager.createSession("s1");
    expect(s1.id).toBe("s1");
    expect(s1.createdAt).toBeDefined();
    expect(s1.updatedAt).toBeDefined();

    const s2 = manager.createSession();
    expect(s2.id).toMatch(/^session-\d+-[a-z0-9]+$/);
  });

  it("gets session by id", () => {
    manager.createSession("s1");
    const s = manager.getSession("s1");
    expect(s).toBeDefined();
    expect(s?.id).toBe("s1");
  });

  it("returns undefined for unknown session", () => {
    expect(manager.getSession("unknown")).toBeUndefined();
  });

  it("updates session", async () => {
    const created = manager.createSession("s1");
    const before = created.updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    manager.updateSession("s1", { foo: "bar" });
    const updated = manager.getSession("s1")!;
    expect(updated.foo).toBe("bar");
    expect(updated.updatedAt).not.toBe(before);
  });

  it("lists sessions", () => {
    manager.createSession("s1");
    manager.createSession("s2");
    const list = manager.listSessions();
    expect(list).toHaveLength(2);
    expect(list.map((s) => s.id)).toContain("s1");
    expect(list.map((s) => s.id)).toContain("s2");
  });
});
