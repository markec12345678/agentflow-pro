/**
 * AgentFlow Pro - Load Testing Suite
 * Performance testing at scale (1000+ concurrent users)
 */

import { chromium, devices } from 'playwright';
import { test, expect } from '@playwright/test';

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  targetEndpoint: string;
  thinkTime: number; // milliseconds between requests
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
}

export class LoadTester {
  private config: LoadTestConfig;
  private results: LoadTestResult;
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      memoryUsage: {
        initial: process.memoryUsage(),
        final: process.memoryUsage(),
        peak: process.memoryUsage()
      },
      cpuUsage: {
        average: 0,
        peak: 0
      }
    };
  }

  async runLoadTest(): Promise<LoadTestResult> {
    console.log(`Starting load test: ${this.config.concurrentUsers} concurrent users for ${this.config.duration}s`);
    
    this.startTime = Date.now();
    const initialMemory = process.memoryUsage();
    
    // Launch browser instances
    const browsers = await this.launchBrowsers();
    
    try {
      // Create user contexts
      const userContexts = await this.createUserContexts(browsers);
      
      // Execute load test
      await this.executeLoadTest(userContexts);
      
      this.endTime = Date.now();
      const finalMemory = process.memoryUsage();
      
      // Calculate results
      this.results = this.calculateResults(initialMemory, finalMemory);
      
      // Generate report
      this.generateReport();
      
      return this.results;
    } finally {
      // Clean up browsers
      await this.cleanup(browsers);
    }
  }

  private async launchBrowsers(): Promise<any[]> {
    const browsers = [];
    const browserCount = Math.min(this.config.concurrentUsers, 10); // Limit to 10 browser instances
    
    for (let i = 0; i < browserCount; i++) {
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      browsers.push(browser);
    }
    
    return browsers;
  }

  private async createUserContexts(browsers: any[]): Promise<any[]> {
    const contexts = [];
    const usersPerBrowser = Math.ceil(this.config.concurrentUsers / browsers.length);
    
    for (let i = 0; i < browsers.length; i++) {
      const browser = browsers[i];
      const context = await browser.newContext({
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        bypassCSP: true
      });
      
      // Create multiple contexts per browser
      for (let j = 0; j < usersPerBrowser; j++) {
        contexts.push(context);
      }
    }
    
    return contexts;
  }

  private async executeLoadTest(contexts: any[]): Promise<void> {
    const promises = [];
    const rampUpInterval = this.config.rampUpTime * 1000 / this.config.concurrentUsers;
    
    // Ramp up users gradually
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      
      const promise = this.simulateUser(context, i * rampUpInterval);
      promises.push(promise);
      
      // Add delay between user starts
      if (i < contexts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, rampUpInterval));
      }
    }
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.config.duration * 1000));
    
    // Wait for all requests to complete
    await Promise.allSettled(promises);
  }

  private async simulateUser(context: any, delay: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const page = await context.newPage();
    
    try {
      // Navigate to target endpoint
      await page.goto(this.config.targetEndpoint, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Simulate user interactions
      const startTime = Date.now();
      let requestCount = 0;
      
      while (Date.now() - startTime < this.config.duration * 1000) {
        try {
          // Make requests with think time
          await this.makeRequest(page);
          requestCount++;
          
          // Think time between requests
          await new Promise(resolve => setTimeout(resolve, this.config.thinkTime));
        } catch (error) {
          this.results.errors.push(`User request failed: ${error}`);
        }
      }
      
      this.results.totalRequests += requestCount;
      
    } catch (error) {
      this.results.errors.push(`User simulation failed: ${error}`);
    } finally {
      await page.close();
    }
  }

  private async makeRequest(page: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test different endpoints
      const endpoints = [
        '/api/tourism/complete',
        '/api/billing/complete',
        '/api/auth',
        '/api/health'
      ];
      
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      const response = await page.evaluate(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            timestamp: Date.now()
          })
        });
        
        return {
          status: response.status,
          responseTime: Date.now() - startTime,
          success: response.ok
        };
      }, endpoint);
      
      if (response.success) {
        this.results.successfulRequests++;
      } else {
        this.results.failedRequests++;
      }
      
      this.results.averageResponseTime = 
        (this.results.averageResponseTime + response.responseTime) / 2;
      
    } catch (error) {
      this.results.failedRequests++;
      this.results.errors.push(`Request failed: ${error}`);
    }
  }

  private calculateResults(initialMemory: NodeJS.MemoryUsage, finalMemory: NodeJS.MemoryUsage): LoadTestResult {
    const duration = (this.endTime - this.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / duration;
    
    // Calculate memory usage
    this.results.memoryUsage = {
      initial: initialMemory,
      final: finalMemory,
      peak: {
        rss: Math.max(initialMemory.rss, finalMemory.rss),
        heapUsed: Math.max(initialMemory.heapUsed, finalMemory.heapUsed),
        heapTotal: Math.max(initialMemory.heapTotal, finalMemory.heapTotal)
      }
    };
    
    return { ...this.results };
  }

  private generateReport(): void {
    const report = `
# AgentFlow Pro - Load Test Report

## Test Configuration
- **Concurrent Users**: ${this.config.concurrentUsers}
- **Duration**: ${this.config.duration}s
- **Ramp-up Time**: ${this.config.rampUpTime}s
- **Target Endpoint**: ${this.config.targetEndpoint}
- **Think Time**: ${this.config.thinkTime}ms

## Test Results
- **Total Requests**: ${this.results.totalRequests}
- **Successful Requests**: ${this.results.successfulRequests}
- **Failed Requests**: ${this.results.failedRequests}
- **Success Rate**: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(1)}%
- **Average Response Time**: ${this.results.averageResponseTime.toFixed(0)}ms
- **Requests Per Second**: ${this.results.requestsPerSecond.toFixed(1)}

## Memory Usage
- **Initial RSS**: ${(this.results.memoryUsage.initial.rss / 1024 / 1024).toFixed(2)}MB
- **Final RSS**: ${(this.results.memoryUsage.final.rss / 1024 / 1024).toFixed(2)}MB
- **Peak RSS**: ${(this.results.memoryUsage.peak.rss / 1024 / 1024).toFixed(2)}MB
- **Initial Heap**: ${(this.results.memoryUsage.initial.heapUsed / 1024 / 1024).toFixed(2)}MB
- **Final Heap**: ${(this.results.memoryUsage.final.heapUsed / 1024 / 1024).toFixed(2)}MB
- **Peak Heap**: ${(this.results.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(2)}MB

## Errors
${this.results.errors.map(error => `- ${error}`).join('\n')}

## Performance Analysis
### Response Time Analysis
- **Excellent**: <200ms
- **Good**: 200-500ms
- **Acceptable**: 500-1000ms
- **Poor**: >1000ms

### Throughput Analysis
- **Target**: ${this.config.concurrentUsers} users
- **Achieved**: ${this.results.requestsPerSecond.toFixed(1)} req/s
- **Efficiency**: ${((this.results.requestsPerSecond / this.config.concurrentUsers) * 100).toFixed(1)}%

### Memory Analysis
- **Memory Growth**: ${((this.results.memoryUsage.final.rss - this.results.memoryUsage.initial.rss) / 1024 / 1024).toFixed(2)}MB
- **Memory Efficiency**: ${this.results.memoryUsage.peak.heapUsed > 500 * 1024 * 1024 ? 'Poor' : 'Good'}

## Recommendations
${this.generateRecommendations()}
    `;
    
    console.log(report);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('load-test-report.md', report);
  }

  private generateRecommendations(): string {
    const recommendations = [];
    
    if (this.results.averageResponseTime > 1000) {
      recommendations.push('- Optimize database queries and add caching');
    }
    
    if (this.results.requestsPerSecond < this.config.concurrentUsers) {
      recommendations.push('- Increase server resources and optimize API endpoints');
    }
    
    if ((this.results.memoryUsage.final.rss - this.results.memoryUsage.initial.rss) > 100 * 1024 * 1024) {
      recommendations.push('- Investigate memory leaks and optimize garbage collection');
    }
    
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    if (successRate < 99) {
      recommendations.push('- Improve error handling and retry mechanisms');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Performance is within acceptable limits');
    }
    
    return recommendations.join('\n');
  }

  private async cleanup(browsers: any[]): Promise<void> {
    for (const browser of browsers) {
      await browser.close();
    }
  }
}

// Load test configurations
export const LOAD_TEST_CONFIGS = {
  light: {
    concurrentUsers: 100,
    duration: 300, // 5 minutes
    rampUpTime: 30,
    targetEndpoint: 'http://localhost:3000/api/tourism/complete',
    thinkTime: 1000 // 1 second between requests
  },
  
  medium: {
    concurrentUsers: 500,
    duration: 600, // 10 minutes
    rampUpTime: 60,
    targetEndpoint: 'http://localhost:3000/api/billing/complete',
    thinkTime: 500 // 500ms between requests
  },
  
  heavy: {
    concurrentUsers: 1000,
    duration: 1800, // 30 minutes
    rampUpTime: 120,
    targetEndpoint: 'http://localhost:3000/api/auth',
    thinkTime: 200 // 200ms between requests
  },
  
  stress: {
    concurrentUsers: 2000,
    duration: 3600, // 1 hour
    rampUpTime: 300,
    targetEndpoint: 'http://localhost:3000/api/health',
    thinkTime: 100 // 100ms between requests
  }
};

// Main load test runner
export async function runLoadTests(): Promise<void> {
  console.log('Starting AgentFlow Pro load tests...');
  
  for (const [name, config] of Object.entries(LOAD_TEST_CONFIGS)) {
    console.log(`\nRunning ${name} load test...`);
    const tester = new LoadTester(config);
    await tester.runLoadTest();
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\nAll load tests completed. Reports saved to load-test-report.md');
}

export default LoadTester;
