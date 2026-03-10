/**
 * AgentFlow Pro - Geographic Performance Testing
 * Multi-region performance and latency testing
 */

import { chromium, devices } from 'playwright';
import { test, expect } from '@playwright/test';

export interface GeographicTestConfig {
  regions: Array<{
    name: string;
    endpoint: string;
    expectedLatency: number; // ms
  }>;
  testDuration: number; // seconds
  concurrentUsers: number;
  testScenarios: string[];
}

export interface GeographicTestResult {
  region: string;
  endpoint: string;
  averageLatency: number;
  expectedLatency?: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  errors: string[];
}

export interface GeographicPerformanceReport {
  overallStatus: 'excellent' | 'good' | 'acceptable' | 'poor';
  bestRegion: string;
  worstRegion: string;
  globalAverageLatency: number;
  recommendations: string[];
  results: GeographicTestResult[];
}

export class GeographicPerformanceTester {
  private config: GeographicTestConfig;
  private results: GeographicTestResult[] = [];

  constructor(config: GeographicTestConfig) {
    this.config = config;
  }

  async runGeographicTests(): Promise<string> {
    console.log('Starting geographic performance tests...');
    
    for (const region of this.config.regions) {
      console.log(`Testing ${region.name} region...`);
      const result = await this.testRegion(region);
      this.results.push(result);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const report = this.generateReport();
    console.log(report);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('geographic-performance-report.md', report);
    
    console.log('Geographic performance tests completed. Report saved to geographic-performance-report.md');
    
    return report;
  }

  private async testRegion(region: GeographicTestConfig['regions'][0]): Promise<GeographicTestResult> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const context = await browser.newContext({
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        bypassCSP: true
      });

      const page = await context.newPage();
      
      const testResults = {
        latencies: [] as number[],
        successes: 0,
        errors: 0,
        errorMessages: [] as string[],
        startTime: Date.now()
      };

      // Test different scenarios
      for (const scenario of this.config.testScenarios) {
        console.log(`Testing ${scenario} scenario in ${region.name}...`);
        
        await this.runTestScenario(page, region, scenario, testResults);
      }

      await context.close();
      
      // Calculate metrics
      const averageLatency = testResults.latencies.length > 0 
        ? testResults.latencies.reduce((sum, lat) => sum + lat, 0) / testResults.latencies.length
        : 0;
      
      const sortedLatencies = testResults.latencies.sort((a, b) => a - b);
      const p95Latency = sortedLatencies.length > 0 
        ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)]
        : 0;
      
      const p99Latency = sortedLatencies.length > 0 
        ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)]
        : 0;

      const totalTests = testResults.successes + testResults.errors;
      const successRate = totalTests > 0 ? (testResults.successes / totalTests) * 100 : 0;
      const errorRate = totalTests > 0 ? (testResults.errors / totalTests) * 100 : 0;
      
      const duration = (Date.now() - testResults.startTime) / 1000;
      const throughput = duration > 0 ? totalTests / duration : 0;

      return {
        region: region.name,
        endpoint: region.endpoint,
        averageLatency,
        p95Latency,
        p99Latency,
        successRate,
        errorRate,
        throughput,
        errors: testResults.errorMessages
      };

    } catch (error) {
      await browser.close();
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async runTestScenario(
    page: any,
    region: GeographicTestConfig['regions'][0],
    scenario: string,
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (scenario) {
        case 'api_health_check':
          await this.testAPIHealthCheck(page, region, results);
          break;
          
        case 'tourism_workflow':
          await this.testTourismWorkflow(page, region, results);
          break;
          
        case 'user_authentication':
          await this.testUserAuthentication(page, region, results);
          break;
          
        case 'booking_process':
          await this.testBookingProcess(page, region, results);
          break;
          
        case 'content_generation':
          await this.testContentGeneration(page, region, results);
          break;
          
        default:
          throw new Error(`Unknown test scenario: ${scenario}`);
      }
    } catch (error) {
      results.errors++;
      results.errorMessages.push(`${scenario}: ${error}`);
    }
  }

  private async testAPIHealthCheck(
    page: any,
    region: GeographicTestConfig['regions'][0],
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    await page.goto(`${region.endpoint}/api/health`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const latency = Date.now() - startTime;
    
    const healthStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        return response.ok;
      } catch {
        return false;
      }
    });
    
    if (healthStatus) {
      results.successes++;
      results.latencies.push(latency);
    } else {
      results.errors++;
      results.errorMessages.push(`Health check failed for ${region.name}`);
    }
  }

  private async testTourismWorkflow(
    page: any,
    region: GeographicTestConfig['regions'][0],
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    await page.goto(`${region.endpoint}/api/tourism/complete`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Fill out tourism workflow form
    await page.fill('[data-testid="destination-input"]', 'Ljubljana');
    await page.fill('[data-testid="language-select"]', 'en');
    await page.fill('[data-testid="content-type"]', 'blog');
    
    await page.click('[data-testid="generate-content-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="content-result"]', { timeout: 30000 });
    
    const latency = Date.now() - startTime;
    const success = await page.isVisible('[data-testid="content-result"]');
    
    if (success) {
      results.successes++;
      results.latencies.push(latency);
    } else {
      results.errors++;
      results.errorMessages.push(`Tourism workflow failed for ${region.name}`);
    }
  }

  private async testUserAuthentication(
    page: any,
    region: GeographicTestConfig['regions'][0],
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    await page.goto(`${region.endpoint}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    
    await page.click('[data-testid="login-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });
    
    const latency = Date.now() - startTime;
    const success = await page.isVisible('[data-testid="dashboard"]');
    
    if (success) {
      results.successes++;
      results.latencies.push(latency);
    } else {
      results.errors++;
      results.errorMessages.push(`Authentication failed for ${region.name}`);
    }
  }

  private async testBookingProcess(
    page: any,
    region: GeographicTestConfig['regions'][0],
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    await page.goto(`${region.endpoint}/booking`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Fill booking form
    await page.fill('[data-testid="check-in-date"]', '2026-07-01');
    await page.fill('[data-testid="check-out-date"]', '2026-07-03');
    await page.fill('[data-testid="guests-count"]', '2');
    
    await page.click('[data-testid="search-availability-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="availability-result"]', { timeout: 30000 });
    
    const latency = Date.now() - startTime;
    const success = await page.isVisible('[data-testid="availability-result"]');
    
    if (success) {
      results.successes++;
      results.latencies.push(latency);
    } else {
      results.errors++;
      results.errorMessages.push(`Booking process failed for ${region.name}`);
    }
  }

  private async testContentGeneration(
    page: any,
    region: GeographicTestConfig['regions'][0],
    results: any
  ): Promise<void> {
    const startTime = Date.now();
    
    await page.goto(`${region.endpoint}/content-generator`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Fill content generation form
    await page.fill('[data-testid="topic-input"]', 'Summer in Slovenia');
    await page.selectOption('[data-testid="format-select"]', 'blog');
    
    await page.click('[data-testid="generate-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="content-result"]', { timeout: 30000 });
    
    const latency = Date.now() - startTime;
    const success = await page.isVisible('[data-testid="content-result"]');
    
    if (success) {
      results.successes++;
      results.latencies.push(latency);
    } else {
      results.errors++;
      results.errorMessages.push(`Content generation failed for ${region.name}`);
    }
  }

  private generateReport(): string {
    const globalAverageLatency = this.results.length > 0 
      ? this.results.reduce((sum, result) => sum + result.averageLatency, 0) / this.results.length
      : 0;

    const bestRegion = this.results.reduce((best, current) => 
      current.averageLatency < best.averageLatency ? current : best
    );

    const worstRegion = this.results.reduce((worst, current) => 
      current.averageLatency > worst.averageLatency ? current : worst
    );

    let overallStatus: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (globalAverageLatency < 200) {
      overallStatus = 'excellent';
    } else if (globalAverageLatency < 500) {
      overallStatus = 'good';
    } else if (globalAverageLatency < 1000) {
      overallStatus = 'acceptable';
    } else {
      overallStatus = 'poor';
    }

    const recommendations = this.generateRecommendations();

    let report = `# AgentFlow Pro - Geographic Performance Report

## Overall Status: ${overallStatus.toUpperCase()}
## Global Average Latency: ${globalAverageLatency.toFixed(0)}ms
## Best Region: ${bestRegion.region} (${bestRegion.averageLatency.toFixed(0)}ms)
## Worst Region: ${worstRegion.region} (${worstRegion.averageLatency.toFixed(0)}ms)

## Regional Results

| Region | Avg Latency | P95 Latency | P99 Latency | Success Rate | Error Rate | Throughput |
|--------|---------------|---------------|---------------|-------------|------------|------------|
`;

    this.results.forEach(result => {
      report += `| ${result.region} | ${result.averageLatency.toFixed(0)}ms | ${result.p95Latency.toFixed(0)}ms | ${result.p99Latency.toFixed(0)}ms | ${result.successRate.toFixed(1)}% | ${result.errorRate.toFixed(1)}% | ${result.throughput.toFixed(1)} req/s |\n`;
    });

    report += `

## Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Results

`;

    this.results.forEach(result => {
      report += `### ${result.region}
- **Average Latency**: ${result.averageLatency.toFixed(0)}ms
- **P95 Latency**: ${result.p95Latency.toFixed(0)}ms
- **P99 Latency**: ${result.p99Latency.toFixed(0)}ms
- **Success Rate**: ${result.successRate.toFixed(1)}%
- **Error Rate**: ${result.errorRate.toFixed(1)}%
- **Throughput**: ${result.throughput.toFixed(1)} req/s
- **Errors**: ${result.errors.length}
${result.errors.length > 0 ? result.errors.map(error => `  - ${error}`).join('\n') : '  No errors'}

`;
    });

    report += `

## Performance Analysis
### Latency Analysis
- **Excellent**: <200ms
- **Good**: 200-500ms
- **Acceptable**: 500-1000ms
- **Poor**: >1000ms

### Success Rate Analysis
- **Excellent**: >99%
- **Good**: 95-99%
- **Acceptable**: 90-95%
- **Poor**: <90%

### Geographic Distribution
- **Optimal**: All regions <500ms average latency
- **Suboptimal**: Some regions >1000ms average latency
- **Critical**: Multiple regions >1000ms average latency

Report Generated: ${new Date().toISOString()}
`;

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    const globalAverageLatency = this.results.length > 0 
      ? this.results.reduce((sum, result) => sum + result.averageLatency, 0) / this.results.length
      : 0;

    if (globalAverageLatency > 1000) {
      recommendations.push('CRITICAL: Implement CDN for static assets');
      recommendations.push('CRITICAL: Add edge servers in high-latency regions');
      recommendations.push('CRITICAL: Optimize database queries and add caching');
    } else if (globalAverageLatency > 500) {
      recommendations.push('HIGH: Implement database connection pooling');
      recommendations.push('HIGH: Add response caching');
      recommendations.push('HIGH: Optimize API endpoints');
    } else if (globalAverageLatency > 200) {
      recommendations.push('MEDIUM: Implement geographic load balancing');
      recommendations.push('MEDIUM: Add performance monitoring');
      recommendations.push('MEDIUM: Optimize image and asset delivery');
    } else {
      recommendations.push('LOW: Continue monitoring and optimization');
      recommendations.push('LOW: Consider A/B testing for performance improvements');
      recommendations.push('LOW: Regular performance reviews and optimization');
    }

    // Regional recommendations
    this.results.forEach(result => {
      if (result.expectedLatency != null && result.averageLatency > result.expectedLatency * 2) {
        recommendations.push(`REGIONAL: ${result.region} - Investigate network infrastructure`);
        recommendations.push(`REGIONAL: ${result.region} - Consider regional CDN deployment`);
      }
    });

    return recommendations;
  }
}

// Default test configurations
export const GEOGRAPHIC_TEST_CONFIGS = {
  basic: {
    regions: [
      { name: 'US East', endpoint: 'https://us-east.agentflow-pro.com', expectedLatency: 200 },
      { name: 'US West', endpoint: 'https://us-west.agentflow-pro.com', expectedLatency: 250 },
      { name: 'Europe West', endpoint: 'https://eu-west.agentflow-pro.com', expectedLatency: 150 },
      { name: 'Europe East', endpoint: 'https://eu-east.agentflow-pro.com', expectedLatency: 180 },
      { name: 'Asia Pacific', endpoint: 'https://ap-southeast.agentflow-pro.com', expectedLatency: 300 }
    ],
    testDuration: 600, // 10 minutes
    concurrentUsers: 50,
    testScenarios: ['api_health_check', 'tourism_workflow', 'user_authentication']
  },
  
  comprehensive: {
    regions: [
      { name: 'US East', endpoint: 'https://us-east.agentflow-pro.com', expectedLatency: 200 },
      { name: 'US West', endpoint: 'https://us-west.agentflow-pro.com', expectedLatency: 250 },
      { name: 'US Central', endpoint: 'https://us-central.agentflow-pro.com', expectedLatency: 225 },
      { name: 'Europe West', endpoint: 'https://eu-west.agentflow-pro.com', expectedLatency: 150 },
      { name: 'Europe East', endpoint: 'https://eu-east.agentflow-pro.com', expectedLatency: 180 },
      { name: 'Europe Central', endpoint: 'https://eu-central.agentflow-pro.com', expectedLatency: 165 },
      { name: 'Asia Pacific', endpoint: 'https://ap-southeast.agentflow-pro.com', expectedLatency: 300 },
      { name: 'Asia East', endpoint: 'https://ap-east.agentflow-pro.com', expectedLatency: 280 }
    ],
    testDuration: 1800, // 30 minutes
    concurrentUsers: 100,
    testScenarios: ['api_health_check', 'tourism_workflow', 'user_authentication', 'booking_process', 'content_generation']
  }
};

export default GeographicPerformanceTester;
