/**
 * Sync Service tests
 */

import { InMemoryBackend } from "@/memory/memory-backend";
import { GraphManager } from "@/memory/graph-manager";
import { SyncService } from "@/memory/sync-service";

describe("SyncService", () => {
  let backend: InMemoryBackend;
  let graph: GraphManager;
  let sync: SyncService;

  beforeEach(() => {
    backend = new InMemoryBackend();
    graph = new GraphManager(backend);
    sync = new SyncService(graph);
  });

  it("syncs agent action into graph", () => {
    sync.syncAgentAction("research", "search", { query: "test" }, { urls: [] });
    const entity = graph.entities.getEntity("research");
    expect(entity).toBeDefined();
    expect(entity?.entityType).toBe("Agent");
    const obs = graph.observations.getObservations("research");
    expect(obs.some((o) => o.includes("search"))).toBe(true);
    expect(obs.some((o) => o.includes("query"))).toBe(true);
  });

  it("adds observations on repeated sync", () => {
    sync.syncAgentAction("content", "write", {}, { text: "a" });
    sync.syncAgentAction("content", "write", {}, { text: "b" });
    const obs = graph.observations.getObservations("content");
    expect(obs.length).toBeGreaterThanOrEqual(2);
  });
});
