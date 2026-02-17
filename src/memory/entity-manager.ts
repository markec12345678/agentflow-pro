/**
 * Entity Manager - CRUD for graph entities
 */

import type { EntityType } from "./graph-schema";
import type { CreateEntityInput, MemoryBackend } from "./memory-backend";

export class EntityManager {
  constructor(private readonly backend: MemoryBackend) { }

  createEntity(name: string, entityType: EntityType, observations: string[] = []): void {
    this.backend.createEntities([{ name, entityType, observations }]);
  }

  getEntity(name: string): CreateEntityInput | undefined {
    const { entities } = this.backend.searchNodes("");
    return entities.find((e) => e.name === name);
  }

  listEntities(): CreateEntityInput[] {
    const { entities } = this.backend.searchNodes("");
    return entities;
  }
}
