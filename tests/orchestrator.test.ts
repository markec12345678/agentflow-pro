/**
 * AgentFlow Pro - Unit Tests
 * Core functionality unit tests
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { Orchestrator } from '../src/orchestrator/Orchestrator';

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.getRegisteredAgents()).toEqual([]);
  });

  it('should handle task queue operations', async () => {
    // Mock agent for testing
    const mockAgent = {
      id: 'test-agent',
      type: 'research' as const,
      name: 'Test Agent',
      execute: vi.fn().mockResolvedValue({ result: 'test' }) as (input: unknown) => Promise<unknown>
    };

    orchestrator.registerAgent(mockAgent);

    const taskId = await orchestrator.queueTask('research' as const, { data: 'test' });
    expect(taskId).toBeDefined();

    const task = orchestrator.getTask(taskId);
    expect(task?.status).toBe('completed');
    expect(task?.result).toEqual({ result: 'test' });
    expect(orchestrator.getRegisteredAgents()).toEqual(['research']);
  });

  it('returns failed status when agent throws', async () => {
    const mockAgent = {
      id: 'fail-agent',
      type: 'content' as const,
      name: 'Fail Agent',
      execute: vi.fn().mockRejectedValue(new Error('Agent error')) as (input: unknown) => Promise<unknown>,
    };
    orchestrator.registerAgent(mockAgent);

    const taskId = await orchestrator.queueTask('content' as const, {});
    const task = orchestrator.getTask(taskId);
    expect(task?.status).toBe('failed');
    expect(task?.error).toBe('Agent error');
  });

  it('marks task failed when agent not registered', async () => {
    const taskId = await orchestrator.queueTask('research' as const, {});
    const task = orchestrator.getTask(taskId);
    expect(task?.status).toBe('failed');
    expect(task?.error).toContain('not registered');
  });

  it('getTask returns undefined for unknown id', () => {
    expect(orchestrator.getTask('unknown-id')).toBeUndefined();
  });
});
