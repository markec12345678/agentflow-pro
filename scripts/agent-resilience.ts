/**
 * AgentFlow Pro - Agent Resilience Testing
 * Circuit breaker patterns, failure recovery, load testing
 */

import { Orchestrator } from '../orchestrator/Orchestrator';
import type { Agent, Task } from '../orchestrator/Orchestrator';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
  resetTimeout: number;
}

export interface AgentMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastFailureTime: Date | null;
  circuitBreakerTrips: number;
}

export interface ResilienceTestResult {
  agentType: string;
  testType: string;
  success: boolean;
  responseTime: number;
  error?: string;
  metrics: AgentMetrics;
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private successCount = 0;
  private circuitBreakerTrips = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>, agentType: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() < this.config.recoveryTimeout) {
        throw new Error(`Circuit breaker OPEN for ${agentType}`);
      }
      this.attemptReset();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === 'HALF_OPEN' && this.successCount >= this.config.halfOpenMaxCalls) {
      this.state = 'CLOSED';
      this.successCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.circuitBreakerTrips++;
    } else if (this.state === 'CLOSED') {
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }
  }

  private attemptReset(): void {
    if (Date.now() - this.lastFailureTime!.getTime() >= this.config.resetTimeout) {
      this.state = 'HALF_OPEN';
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  getState(): string {
    return this.state;
  }

  getMetrics(): { state: string; failureCount: number; successCount: number; trips: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      trips: this.circuitBreakerTrips
    };
  }
}

export class AgentResilienceTester {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private metrics: Map<string, AgentMetrics> = new Map();

  constructor(private orchestrator: Orchestrator) {
    this.initializeCircuitBreakers();
  }

  private initializeCircuitBreakers(): void {
    const agentTypes = ['research', 'content', 'reservation', 'communication'];
    
    agentTypes.forEach(agentType => {
      this.circuitBreakers.set(agentType, new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxCalls: 3,
        resetTimeout: 120000
      }));
      
      this.metrics.set(agentType, {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageResponseTime: 0,
        lastFailureTime: null,
        circuitBreakerTrips: 0
      });
    });
  }

  async testAgentResilience(agentType: string, input: unknown): Promise<ResilienceTestResult> {
    const startTime = Date.now();
    const circuitBreaker = this.circuitBreakers.get(agentType)!;
    const metrics = this.metrics.get(agentType)!;

    try {
      metrics.totalCalls++;
      
      const result = await circuitBreaker.execute(async () => {
        return await this.orchestrator.queueTask(agentType as any, input);
      }, agentType);

      const responseTime = Date.now() - startTime;
      const resultObj = result as { status?: string; error?: string } | string;
      const success = typeof resultObj === 'object' && resultObj !== null
        ? resultObj.status === 'completed'
        : true;

      if (success) {
        metrics.successfulCalls++;
        metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
      } else {
        metrics.failedCalls++;
        metrics.lastFailureTime = new Date();
      }

      return {
        agentType,
        testType: 'agent_execution',
        success,
        responseTime,
        error: typeof resultObj === 'object' && resultObj !== null ? resultObj.error : undefined,
        metrics: { ...metrics }
      };
    } catch (error) {
      metrics.failedCalls++;
      metrics.lastFailureTime = new Date();
      
      return {
        agentType,
        testType: 'agent_execution',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: { ...metrics }
      };
    }
  }

  async testConcurrentLoad(agentType: string, concurrency: number): Promise<ResilienceTestResult[]> {
    const promises: Promise<ResilienceTestResult>[] = [];
    const inputs = this.generateTestInputs(agentType, concurrency);

    for (let i = 0; i < concurrency; i++) {
      promises.push(this.testAgentResilience(agentType, inputs[i]));
    }

    const results = await Promise.all(promises);
    return results;
  }

  async testMemoryUsage(agentType: string, iterations: number): Promise<ResilienceTestResult> {
    const initialMemory = process.memoryUsage();
    const promises: Promise<ResilienceTestResult>[] = [];

    for (let i = 0; i < iterations; i++) {
      const input = this.generateTestInputs(agentType, 1)[0];
      promises.push(this.testAgentResilience(agentType, input));
    }

    await Promise.all(promises);
    const finalMemory = process.memoryUsage();

    return {
      agentType,
      testType: 'memory_usage',
      success: true,
      responseTime: 0,
      metrics: {
        totalCalls: iterations,
        successfulCalls: iterations,
        failedCalls: 0,
        averageResponseTime: 0,
        lastFailureTime: null,
        circuitBreakerTrips: 0,
        memoryUsage: {
          initial: initialMemory,
          final: finalMemory,
          delta: {
            rss: finalMemory.rss - initialMemory.rss,
            heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
            heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
          }
        }
      } as any
    };
  }

  private generateTestInputs(agentType: string, count: number): unknown[] {
    const inputs: unknown[] = [];
    
    switch (agentType) {
      case 'research':
        for (let i = 0; i < count; i++) {
          inputs.push({
            query: `Test query ${i + 1}`,
            urls: [`https://test-url-${i + 1}.com`]
          });
        }
        break;
        
      case 'content':
        for (let i = 0; i < count; i++) {
          inputs.push({
            topic: `Test topic ${i + 1}`,
            format: 'blog',
            brandVoiceSummary: 'Professional test content'
          });
        }
        break;
        
      case 'reservation':
        for (let i = 0; i < count; i++) {
          inputs.push({
            action: 'check_availability',
            propertyId: `test-property-${i + 1}`,
            checkIn: new Date(),
            checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
            guests: 2
          });
        }
        break;
        
      case 'communication':
        for (let i = 0; i < count; i++) {
          inputs.push({
            action: 'send_message',
            messageType: 'pre_arrival',
            language: 'en',
            customMessage: `Test message ${i + 1}`
          });
        }
        break;
    }
    
    return inputs;
  }

  getMetrics(): Map<string, AgentMetrics> {
    return this.metrics;
  }

  getCircuitBreakerStates(): Map<string, string> {
    const states = new Map<string, string>();
    this.circuitBreakers.forEach((breaker, agentType) => {
      states.set(agentType, breaker.getState());
    });
    return states;
  }

  generateResilienceReport(): string {
    let report = '# AgentFlow Pro - Resilience Test Report\n\n';
    
    report += '## Circuit Breaker States\n\n';
    this.getCircuitBreakerStates().forEach((state, agentType) => {
      report += `**${agentType}**: ${state}\n`;
    });
    
    report += '\n## Agent Metrics\n\n';
    this.getMetrics().forEach((metrics, agentType) => {
      report += `**${agentType}**:\n`;
      report += `- Total Calls: ${metrics.totalCalls}\n`;
      report += `- Success Rate: ${((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(1)}%\n`;
      report += `- Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms\n`;
      report += `- Circuit Breaker Trips: ${metrics.circuitBreakerTrips}\n`;
      if (metrics.lastFailureTime) {
        report += `- Last Failure: ${metrics.lastFailureTime.toISOString()}\n`;
      }
      report += '\n';
    });
    
    return report;
  }

  async runFullResilienceTest(): Promise<void> {
    console.log('Starting full resilience test...');
    
    // Test individual agents
    const agentTypes = ['research', 'content', 'reservation', 'communication'];
    
    for (const agentType of agentTypes) {
      console.log(`Testing ${agentType} agent resilience...`);
      
      // Test normal operation
      await this.testAgentResilience(agentType, this.generateTestInputs(agentType, 1)[0]);
      
      // Test concurrent load
      await this.testConcurrentLoad(agentType, 10);
      
      // Test memory usage
      await this.testMemoryUsage(agentType, 50);
    }
    
    // Test system-wide resilience
    console.log('Testing system-wide resilience...');
    await this.testConcurrentLoad('research', 25);
    await this.testConcurrentLoad('content', 25);
    await this.testConcurrentLoad('reservation', 25);
    await this.testConcurrentLoad('communication', 25);
    
    // Generate report
    const report = this.generateResilienceReport();
    console.log(report);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('resilience-test-report.md', report);
    
    console.log('Resilience test completed. Report saved to resilience-test-report.md');
  }
}

export default AgentResilienceTester;
