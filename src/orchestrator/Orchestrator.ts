/**
 * AgentFlow Pro - Orchestrator
 * Agent coordination, registration, task queue
 */

export type AgentType = "research" | "content" | "code" | "deploy" | "personalization" | "image" | "reservation" | "communication" | "verification";

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  execute: (input: unknown) => Promise<unknown>;
}

export interface Task {
  id: string;
  agentType: AgentType;
  input: unknown;
  status: "pending" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export class Orchestrator {
  private agents: Map<AgentType, Agent> = new Map();
  private taskQueue: Task[] = [];
  private maxConcurrent = 3;
  private runningCount = 0;

  registerAgent(agent: Agent): void {
    this.agents.set(agent.type, agent);
  }

  async queueTask(agentType: AgentType, input: unknown): Promise<string> {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      agentType,
      input,
      status: "pending",
    };
    this.taskQueue.push(task);
    await this.processQueue();
    return task.id;
  }

  private async processQueue(): Promise<void> {
    while (this.runningCount < this.maxConcurrent && this.taskQueue.length > 0) {
      const task = this.taskQueue.find((t) => t.status === "pending");
      if (!task) break;

      const agent = this.agents.get(task.agentType);
      if (!agent) {
        task.status = "failed";
        task.error = `Agent ${task.agentType} not registered`;
        continue;
      }

      this.runningCount++;
      task.status = "running";

      try {
        task.result = await agent.execute(task.input);
        task.status = "completed";
      } catch (err) {
        task.status = "failed";
        task.error = err instanceof Error ? err.message : String(err);
      } finally {
        this.runningCount--;
        await this.processQueue();
      }
    }
  }

  getTask(id: string): Task | undefined {
    return this.taskQueue.find((t) => t.id === id);
  }

  getRegisteredAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }
}
