/**
 * Graph tests - entity create/read, relations
 */

import { InMemoryBackend } from "@/memory/memory-backend";
import { EntityManager } from "@/memory/entity-manager";
import { RelationManager } from "@/memory/relation-manager";
import { ObservationManager } from "@/memory/observation-manager";

describe("Graph", () => {
  let backend: InMemoryBackend;
  let entities: EntityManager;
  let relations: RelationManager;
  let observations: ObservationManager;

  beforeEach(() => {
    backend = new InMemoryBackend();
    entities = new EntityManager(backend);
    relations = new RelationManager(backend);
    observations = new ObservationManager(backend);
  });

  describe("EntityManager", () => {
    it("creates and retrieves entity", () => {
      entities.createEntity("research-agent", "Agent", ["Firecrawl enabled"]);
      const e = entities.getEntity("research-agent");
      expect(e).toBeDefined();
      expect(e?.name).toBe("research-agent");
      expect(e?.entityType).toBe("Agent");
      expect(e?.observations).toContain("Firecrawl enabled");
    });

    it("lists all entities", () => {
      entities.createEntity("a1", "Agent", []);
      entities.createEntity("w1", "Workflow", []);
      const list = entities.listEntities();
      expect(list).toHaveLength(2);
      expect(list.map((e) => e.name)).toContain("a1");
      expect(list.map((e) => e.name)).toContain("w1");
    });

    it("returns undefined for unknown entity", () => {
      expect(entities.getEntity("unknown")).toBeUndefined();
    });
  });

  describe("RelationManager", () => {
    beforeEach(() => {
      entities.createEntity("agent-1", "Agent", []);
      entities.createEntity("workflow-1", "Workflow", []);
    });

    it("creates and gets relations", () => {
      relations.createRelation("agent-1", "workflow-1", "executes");
      const list = relations.getRelations();
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ from: "agent-1", to: "workflow-1", relationType: "executes" });
    });

    it("filters relations by from, to, type", () => {
      relations.createRelation("agent-1", "workflow-1", "executes");
      relations.createRelation("user-1", "workflow-1", "owns");
      expect(relations.getRelations("agent-1")).toHaveLength(1);
      expect(relations.getRelations(undefined, "workflow-1")).toHaveLength(2);
      expect(relations.getRelations(undefined, undefined, "executes")).toHaveLength(1);
    });

    it("deletes relation", () => {
      relations.createRelation("agent-1", "workflow-1", "executes");
      relations.deleteRelation("agent-1", "workflow-1", "executes");
      expect(relations.getRelations()).toHaveLength(0);
    });
  });

  describe("ObservationManager", () => {
    beforeEach(() => {
      entities.createEntity("agent-1", "Agent", []);
    });

    it("adds and gets observations", () => {
      observations.addObservations("agent-1", ["obs1", "obs2"]);
      expect(observations.getObservations("agent-1")).toContain("obs1");
      expect(observations.getObservations("agent-1")).toContain("obs2");
    });

    it("deletes specific observations", () => {
      observations.addObservations("agent-1", ["a", "b", "c"]);
      observations.deleteObservations("agent-1", ["b"]);
      const obs = observations.getObservations("agent-1");
      expect(obs).toContain("a");
      expect(obs).not.toContain("b");
      expect(obs).toContain("c");
    });

    it("deletes all observations when contents omitted", () => {
      observations.addObservations("agent-1", ["a", "b"]);
      observations.deleteObservations("agent-1");
      expect(observations.getObservations("agent-1")).toHaveLength(0);
    });
  });
});
