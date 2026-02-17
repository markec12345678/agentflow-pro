/**
 * Sync Service - syncs agent actions into the graph
 * Called from Orchestrator or agent hooks
 */

import type { GraphManager } from "./graph-manager";

export interface SyncAgentActionParams {
  agentType: string;
  action: string;
  input: unknown;
  output: unknown;
}

export class SyncService {
  constructor(private readonly graph: GraphManager) { }

  syncAgentAction(agentType: string, action: string, input: unknown, output: unknown): void {
    this.graph.syncFromAgent(agentType, {
      agentType,
      action,
      input,
      output,
      timestamp: new Date().toISOString(),
    });
  }
}
