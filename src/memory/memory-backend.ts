/**
 * MemoryBackend - abstraction for knowledge graph storage
 * 
 * Implementations:
 * - InMemoryBackend: in-app storage for dev/tests
 * - RedisMemoryBackend: Working memory with TTL (<1ms latency)
 * - McpMemoryBackend: (optional) uses Memory MCP server
 * - PostgresMemoryBackend: Persistent episodic memory
 * - PgvectorMemoryBackend: Semantic memory with vector search
 * 
 * Based on research showing hybrid memory architecture improves
 * token efficiency and context continuity vs pure RAG approaches.
 */

import type { GraphSnapshot } from "./graph-schema";

export interface CreateEntityInput {
  name: string;
  entityType: string;
  observations: string[];
}

export interface AddObservationsInput {
  entityName: string;
  contents: string[];
}

export interface CreateRelationInput {
  from: string;
  to: string;
  relationType: string;
}

export interface DeleteRelationInput {
  from: string;
  to: string;
  relationType: string;
}

export interface DeleteObservationsInput {
  entityName: string;
  contents?: string[];
}

export interface MemoryBackend {
  createEntities(entities: CreateEntityInput[]): void;
  addObservations(obs: AddObservationsInput[]): void;
  deleteObservations(obs: DeleteObservationsInput[]): void;
  createRelations(relations: CreateRelationInput[]): void;
  deleteRelations(relations: DeleteRelationInput[]): void;
  searchNodes(query: string): { entities: CreateEntityInput[]; relations: CreateRelationInput[] };
  readGraph(): GraphSnapshot;
}

/** In-memory implementation for dev/tests */
export class InMemoryBackend implements MemoryBackend {
  private entities = new Map<string, CreateEntityInput>();
  private relations: CreateRelationInput[] = [];

  createEntities(entities: CreateEntityInput[]): void {
    for (const e of entities) {
      const existing = this.entities.get(e.name);
      const observations = existing
        ? [...new Set([...existing.observations, ...(e.observations ?? [])])]
        : e.observations ?? [];
      this.entities.set(e.name, {
        name: e.name,
        entityType: e.entityType,
        observations,
      });
    }
  }

  addObservations(obs: AddObservationsInput[]): void {
    for (const o of obs) {
      const e = this.entities.get(o.entityName);
      if (!e) continue;
      e.observations = [...new Set([...e.observations, ...o.contents])];
    }
  }

  deleteObservations(obs: DeleteObservationsInput[]): void {
    for (const o of obs) {
      const e = this.entities.get(o.entityName);
      if (!e) continue;
      if (o.contents == null || o.contents.length === 0) {
        e.observations = [];
      } else {
        const set = new Set(o.contents);
        e.observations = e.observations.filter((x) => !set.has(x));
      }
    }
  }

  createRelations(relations: CreateRelationInput[]): void {
    for (const r of relations) {
      const dup = this.relations.some(
        (x) => x.from === r.from && x.to === r.to && x.relationType === r.relationType
      );
      if (!dup) this.relations.push(r);
    }
  }

  deleteRelations(relations: DeleteRelationInput[]): void {
    for (const r of relations) {
      this.relations = this.relations.filter(
        (x) => !(x.from === r.from && x.to === r.to && x.relationType === r.relationType)
      );
    }
  }

  searchNodes(query: string): { entities: CreateEntityInput[]; relations: CreateRelationInput[] } {
    const q = query.toLowerCase();
    const entities: CreateEntityInput[] = [];
    for (const [, e] of this.entities) {
      if (
        e.name.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        (e.observations ?? []).some((o) => o.toLowerCase().includes(q))
      ) {
        entities.push(e);
      }
    }
    const relations = this.relations.filter(
      (r) =>
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q) ||
        r.relationType.toLowerCase().includes(q)
    );
    return { entities, relations };
  }

  readGraph(): GraphSnapshot {
    const entities = Array.from(this.entities.values()).map((e) => ({
      name: e.name,
      entityType: e.entityType,
      observations: e.observations ?? [],
    }));
    const relations = this.relations.map((r) => ({
      from: r.from,
      to: r.to,
      relationType: r.relationType,
    }));
    return { entities, relations };
  }
}
