/**
 * Relation Manager - CRUD for graph relations
 */

import type { RelationType } from "./graph-schema";
import type { CreateRelationInput, MemoryBackend } from "./memory-backend";

export interface RelationFilter {
  from?: string;
  to?: string;
  type?: RelationType;
}

export class RelationManager {
  constructor(private readonly backend: MemoryBackend) { }

  createRelation(from: string, to: string, type: RelationType): void {
    this.backend.createRelations([{ from, to, relationType: type }]);
  }

  getRelations(from?: string, to?: string, type?: RelationType): CreateRelationInput[] {
    const { relations } = this.backend.readGraph();
    return relations.filter((r) => {
      if (from != null && r.from !== from) return false;
      if (to != null && r.to !== to) return false;
      if (type != null && r.relationType !== type) return false;
      return true;
    }) as CreateRelationInput[];
  }

  deleteRelation(from: string, to: string, type: RelationType): void {
    this.backend.deleteRelations([{ from, to, relationType: type }]);
  }
}
