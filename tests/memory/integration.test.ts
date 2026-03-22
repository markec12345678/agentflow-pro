/**
 * Integration tests - full flow
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { InMemoryBackend } from "@/memory/memory-backend";
import { GraphManager } from "@/memory/graph-manager";
import { SessionManager } from "@/memory/session-manager";
import { ContextLoader } from "@/memory/context-loader";
import { SyncService } from "@/memory/sync-service";

describe("Memory integration", () => {
  let backend: InMemoryBackend;
  let graph: GraphManager;
  let sessions: SessionManager;
  let loader: ContextLoader;
  let sync: SyncService;

  beforeEach(() => {
    backend = new InMemoryBackend();
    graph = new GraphManager(backend);
    sessions = new SessionManager();
    loader = new ContextLoader(graph, sessions);
    sync = new SyncService(graph);
  });

  it("loads context on start with no session", () => {
    const ctx = loader.loadContextOnStart();
    expect(ctx.graph.entities).toEqual([]);
    expect(ctx.sessions).toEqual([]);
    expect(ctx.recentObservations).toEqual([]);
    expect(ctx.session).toBeUndefined();
  });

  it("loads context with session and creates if missing", () => {
    const ctx = loader.loadContextOnStart("sess-1");
    expect(ctx.session).toBeDefined();
    expect(ctx.session?.id).toBe("sess-1");
    expect(sessions.getSession("sess-1")).toBeDefined();
  });

  it("full flow: sync -> graph -> context", () => {
    sync.syncAgentAction("research", "search", { q: "x" }, { urls: [] });
    graph.entities.createEntity("wf-1", "Workflow", []);
    graph.relations.createRelation("research", "wf-1", "executes");
    sessions.createSession("s1");

    const ctx = loader.loadContextOnStart("s1");
    expect(ctx.graph.entities.length).toBeGreaterThanOrEqual(2);
    expect(ctx.sessions).toHaveLength(1);
    expect(ctx.session?.id).toBe("s1");
  });

  it("getContextForSession returns session-scoped graph", () => {
    graph.entities.createEntity("session-abc", "User", ["test"]);
    graph.observations.addObservations("session-abc", ["obs1"]);
    const ctx = graph.getContextForSession("session-abc");
    expect(ctx.sessionId).toBe("session-abc");
    expect(ctx.entities.length).toBeGreaterThanOrEqual(1);
  });
});
