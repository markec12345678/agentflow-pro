/**
 * In-memory user store for E2E / dev (no DB)
 */

const users = new Map<string, { password: string; id: string }>();

// Pre-seed E2E user
users.set("e2e@test.com", { password: "e2e-secret", id: "e2e-user-1" });
users.set("test@test.com", { password: "test", id: "test-user-1" });

export function registerUser(email: string, password: string): { id: string } | null {
  if (users.has(email)) return null;
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  users.set(email, { password, id });
  return { id };
}

export function getUser(email: string, password: string): { id: string } | null {
  const u = users.get(email);
  if (!u || u.password !== password) return null;
  return { id: u.id };
}
