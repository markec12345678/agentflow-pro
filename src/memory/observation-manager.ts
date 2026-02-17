/**
 * Observation Manager - CRUD for entity observations
 */

import type { MemoryBackend } from "./memory-backend";

export class ObservationManager {
  constructor(private readonly backend: MemoryBackend) { }

  addObservations(entityName: string, contents: string[]): void {
    this.backend.addObservations([{ entityName, contents }]);
  }

  getObservations(entityName: string): string[] {
    const snapshot = this.backend.readGraph();
    const entity = snapshot.entities.find((e) => e.name === entityName);
    return entity?.observations ?? [];
  }

  deleteObservations(entityName: string, contents?: string[]): void {
    this.backend.deleteObservations([{ entityName, contents }]);
  }
}
