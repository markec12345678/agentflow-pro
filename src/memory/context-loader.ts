/**
 * Context Loader - fetches graph, sessions, recent observations for agent init
 */

import type { CreateEntityInput } from "./memory-backend";
import type { GraphManager } from "./graph-manager";
import type { SessionManager } from "./session-manager";
import type { SessionData } from "./session-manager";

export interface LoadedContext {
  graph: { entities: CreateEntityInput[] };
  sessions: SessionData[];
  recentObservations: string[];
  session?: SessionData;
}

export class ContextLoader {
  constructor(
    private readonly graph: GraphManager,
    private readonly sessions: SessionManager
  ) { }

  loadContextOnStart(sessionId?: string): LoadedContext {
    const entities = this.graph.entities.listEntities();
    const sessions = this.sessions.listSessions();
    const allObservations: string[] = [];
    for (const e of entities) {
      const obs = this.graph.observations.getObservations(e.name);
      allObservations.push(...obs);
    }
    const recentObservations = allObservations.slice(-50);

    let session: SessionData | undefined;
    if (sessionId) {
      session = this.sessions.getSession(sessionId);
      if (!session) {
        session = this.sessions.createSession(sessionId);
      }
    }

    return {
      graph: { entities },
      sessions,
      recentObservations,
      ...(session && { session }),
    };
  }
}
