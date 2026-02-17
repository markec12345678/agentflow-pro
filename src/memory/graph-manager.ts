/**
 * Graph Manager - orchestrates entity, relation, observation managers
 */

import type { GraphSnapshot } from "./graph-schema";
import type { MemoryBackend } from "./memory-backend";
import { EntityManager } from "./entity-manager";
import { RelationManager } from "./relation-manager";
import { ObservationManager } from "./observation-manager";

export interface AgentExecution {
  agentId: string;
  input: unknown;
  output: unknown;
}

export interface SyncResult {
  agentType: string;
  [key: string]: unknown;
}

export class GraphManager {
  readonly entities: EntityManager;
  readonly relations: RelationManager;
  readonly observations: ObservationManager;

  constructor(private readonly backend: MemoryBackend) {
    this.entities = new EntityManager(backend);
    this.relations = new RelationManager(backend);
    this.observations = new ObservationManager(backend);
  }

  recordAgentExecution(agentId: string, input: unknown, output: unknown): void {
    this.entities.createEntity(agentId, "Agent", []);
    this.observations.addObservations(agentId, [
      `input: ${JSON.stringify(input)}`,
      `output: ${JSON.stringify(output)}`,
    ]);
  }

  getContextForSession(sessionId: string): GraphSnapshot & { sessionId: string } {
    const graph = this.backend.readGraph();
    const { entities, relations } = this.backend.searchNodes(sessionId);
    const sessionEntities = entities.filter(
      (e) => e.name === sessionId || e.observations?.some((o) => o.includes(sessionId))
    );
    const sessionRelations = relations.filter(
      (r) => r.from === sessionId || r.to === sessionId
    );
    return {
      sessionId,
      entities: sessionEntities.length > 0
        ? sessionEntities.map((e) => ({
          name: e.name,
          entityType: e.entityType,
          observations: e.observations ?? [],
        }))
        : graph.entities,
      relations: sessionRelations.length > 0
        ? sessionRelations.map((r) => ({
          from: r.from,
          to: r.to,
          relationType: r.relationType,
        }))
        : graph.relations,
    };
  }

  syncFromAgent(agentType: string, result: SyncResult): void {
    this.entities.createEntity(agentType, "Agent", []);
    this.observations.addObservations(agentType, [
      `sync: ${JSON.stringify(result)}`,
    ]);
  }
}
