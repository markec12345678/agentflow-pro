/**
 * Session Manager - CRUD for session metadata
 * Uses in-memory store; can be backed by backend or local JSON
 */

export interface SessionData {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export class SessionManager {
  private sessions = new Map<string, SessionData>();

  createSession(id?: string): SessionData {
    const sid = id ?? `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const session: SessionData = {
      id: sid,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(sid, session);
    return session;
  }

  getSession(id: string): SessionData | undefined {
    return this.sessions.get(id);
  }

  updateSession(id: string, data: Partial<Omit<SessionData, "id" | "createdAt">>): void {
    const session = this.sessions.get(id);
    if (!session) return;
    const updated = { ...session, ...data, updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
  }

  listSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }
}
