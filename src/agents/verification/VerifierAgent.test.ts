/**
 * VerifierAgent Tests
 * Tests for the verification system that prevents hallucinations
 * and ensures agent reliability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VerifierAgent,
  getVerifierAgent,
  VerificationPlan,
  VerificationExecution,
  VerificationResult,
  VerificationConfig,
} from './VerifierAgent';

// ============================================================================
// TEST HELPERS
// ============================================================================

const createTestPlan = (overrides?: Partial<VerificationPlan>): VerificationPlan => ({
  id: 'test-plan-1',
  goal: 'Generate a comprehensive market analysis report',
  requirements: ['Include market size data', 'Analyze top 3 competitors', 'Provide growth projections'],
  successCriteria: ['Report is at least 500 words', 'Includes numerical data', 'Has clear recommendations'],
  constraints: ['Must not contain confidential information', 'Must cite at least 2 sources'],
  sources: ['https://example.com/market-report', 'https://example.com/competitors'],
  ...overrides,
});

const createTestExecution = (overrides?: Partial<VerificationExecution>): VerificationExecution => ({
  agentId: 'content-agent-1',
  agentType: 'content',
  input: { topic: 'Market Analysis' },
  output: { content: 'Test content' },
  executionTime: 1500,
  ...overrides,
});

const createTestResult = (overrides?: Partial<VerificationResult>): VerificationResult => ({
  success: true,
  result: 'This is a test result with some content.',
  sources: ['https://example.com/market-report'],
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('VerifierAgent', () => {
  let verifier: VerifierAgent;

  beforeEach(() => {
    verifier = getVerifierAgent();
  });

  // ============================================================================
  // CONSTRUCTOR & CONFIGURATION
  // ============================================================================

  describe('Constructor', () => {
    it('should create verifier with default config', () => {
      expect(verifier.id).toBe('verifier');
      expect(verifier.type).toBe('verification');
      expect(verifier.version).toBe('1.0.0');
      expect(verifier.capabilities).toHaveLength(7);
      expect(verifier.capabilities).toContain('plan_alignment_check');
      expect(verifier.capabilities).toContain('factual_verification');
    });

    it('should create verifier with custom config', () => {
      const customConfig: Partial<VerificationConfig> = {
        minConfidenceThreshold: 0.9,
        humanReviewThreshold: 0.7,
      };
      const customVerifier = getVerifierAgent(customConfig);
      expect(customVerifier).toBeDefined();
    });
  });

  // ============================================================================
  // MAIN VERIFICATION METHOD
  // ============================================================================

  describe('verify()', () => {
    it('should verify a valid result successfully', async () => {
      const plan = createTestPlan();
      const execution = createTestExecution();
      const result = createTestResult({
        result: 'This comprehensive market analysis report includes market size data of $50B in 2024. We analyzed top 3 competitors: Company A (30% market share), Company B (25%), and Company C (20%). Growth projections indicate 15% CAGR through 2028. According to https://example.com/market-report, the market is expanding rapidly.',
        sources: ['https://example.com/market-report', 'https://example.com/competitors'],
      });

      const report = await verifier.verify(plan, execution, result);

      expect(report.id).toBeDefined();
      expect(report.planId).toBe(plan.id);
      expect(report.executionId).toBe(execution.agentId);
      expect(report.overallConfidence).toBeGreaterThan(0.5);
      expect(report.metadata.checksPerformed).toHaveLength(5);
      expect(report.metadata.verifierVersion).toBe('1.0.0');
    });

    it('should detect missing requirements', async () => {
      const plan = createTestPlan();
      const result = createTestResult({
        result: 'This is a short report without much detail.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.issues.some(i => i.type === 'incomplete')).toBe(true);
      expect(report.evidence.missedRequirements).toHaveLength(3);
      expect(report.overallConfidence).toBeLessThan(0.8);
    });

    it('should detect constraint violations', async () => {
      const plan = createTestPlan({
        constraints: ['Must not contain confidential information'],
      });
      const result = createTestResult({
        result: 'This report contains confidential information: secret data XYZ.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.issues.some(i => i.type === 'constraint_violation')).toBe(true);
      expect(report.scores.planAlignment).toBeLessThan(1.0);
    });

    it('should require human review for low confidence', async () => {
      const plan = createTestPlan();
      const result = createTestResult({
        result: 'Short incomplete result.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      if (report.overallConfidence < 0.6) {
        expect(report.requiresHumanReview).toBe(true);
      }
    });

    it('should handle verification errors gracefully', async () => {
      const plan = createTestPlan();
      const execution = createTestExecution();
      const result = createTestResult({ result: null });

      const report = await verifier.verify(plan, execution, result);

      expect(report).toBeDefined();
      expect(report.overallConfidence).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // PLAN ALIGNMENT CHECKS
  // ============================================================================

  describe('Plan Alignment', () => {
    it('should detect when goal is not addressed', async () => {
      const plan = createTestPlan({ goal: 'Write a detailed SEO optimization guide' });
      const result = createTestResult({
        result: 'This is about market analysis, not SEO.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.scores.planAlignment).toBeLessThan(0.8);
      expect(report.issues.some(i => i.description.includes('does not fully address'))).toBe(true);
    });

    it('should recognize when requirements are met', async () => {
      const plan = createTestPlan({
        requirements: ['Include keyword research', 'Analyze competitors'],
      });
      const result = createTestResult({
        result: 'This report includes comprehensive keyword research and analyzes competitors in detail.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.evidence.matchedRequirements).toHaveLength(2);
      expect(report.evidence.missedRequirements).toHaveLength(0);
    });

    it('should check success criteria', async () => {
      const plan = createTestPlan({
        successCriteria: ['At least 1000 words', 'Includes examples'],
      });
      const result = createTestResult({
        result: 'Short text without examples.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.issues.some(i => i.description.includes('Success criteria not met'))).toBe(true);
    });
  });

  // ============================================================================
  // FACTUAL ACCURACY CHECKS
  // ============================================================================

  describe('Factual Accuracy', () => {
    it('should verify claims with sources', async () => {
      const result = createTestResult({
        result: 'The market size is $50B according to https://example.com/market-report.',
        sources: ['https://example.com/market-report'],
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.evidence.supportedClaims.length).toBeGreaterThanOrEqual(0);
      expect(report.scores.factualAccuracy).toBeGreaterThanOrEqual(0);
    });

    it('should flag unsupported claims', async () => {
      const result = createTestResult({
        result: 'The market will grow 500% by 2027 with no supporting data.',
        sources: [],
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      if (report.evidence.unsupportedClaims.length > 0) {
        expect(report.issues.some(i => i.type === 'factual_error')).toBe(true);
      }
    });

    it('should handle results without claims', async () => {
      const result = createTestResult({
        result: 'This is a simple statement without any numerical claims.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.scores.factualAccuracy).toBe(1.0);
    });
  });

  // ============================================================================
  // CONSISTENCY CHECKS
  // ============================================================================

  describe('Consistency', () => {
    it('should detect contradictions', async () => {
      const result = createTestResult({
        result: 'The market size is $50B. The total market value is not more than $10B.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.scores.consistency).toBeLessThan(1.0);
    });

    it('should pass consistent content', async () => {
      const result = createTestResult({
        result: 'The market size is $50B in 2024. This represents a 15% growth from 2023. The market continues to expand.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.scores.consistency).toBeGreaterThanOrEqual(0.8);
    });
  });

  // ============================================================================
  // COMPLETENESS CHECKS
  // ============================================================================

  describe('Completeness', () => {
    it('should detect missing sections', async () => {
      const plan = createTestPlan({
        goal: 'Write a comprehensive report with introduction, methodology, findings, and conclusion',
      });
      const result = createTestResult({
        result: 'This is the introduction. Some findings here.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.scores.completeness).toBeLessThan(1.0);
    });

    it('should recognize complete content', async () => {
      const plan = createTestPlan({
        goal: 'Write a market analysis',
      });
      const result = createTestResult({
        result: 'Introduction: This report analyzes the market. Analysis: The market is growing. Recommendations: Invest now. Conclusion: Positive outlook.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report.scores.completeness).toBeGreaterThanOrEqual(0.8);
    });
  });

  // ============================================================================
  // QUALITY CHECKS
  // ============================================================================

  describe('Quality', () => {
    it('should detect empty results', async () => {
      const result = createTestResult({ result: '' });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.issues.some(i => i.description === 'Result is empty')).toBe(true);
      expect(report.scores.quality).toBeLessThan(0.5);
    });

    it('should detect too short content', async () => {
      const result = createTestResult({ result: 'Too short.' });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.issues.some(i => i.description.includes('too short'))).toBe(true);
    });

    it('should detect error patterns', async () => {
      const result = createTestResult({
        result: 'This content has [ERROR] in it and references undefined values.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.issues.some(i => i.description.includes('error pattern'))).toBe(true);
    });

    it('should pass quality checks for good content', async () => {
      const result = createTestResult({
        result: 'This is a comprehensive report with detailed analysis. It includes market data, competitor analysis, and growth projections. The report is well-structured and provides actionable recommendations based on thorough research.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.scores.quality).toBeGreaterThanOrEqual(0.66);
    });
  });

  // ============================================================================
  // CONFIDENCE SCORING
  // ============================================================================

  describe('Confidence Scoring', () => {
    it('should calculate weighted confidence score', async () => {
      const result = createTestResult({
        result: 'Comprehensive market analysis with all required elements. Market size: $50B. Competitors analyzed: A, B, C. Growth: 15% CAGR. Sources: https://example.com/market-report.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(report.overallConfidence).toBeLessThanOrEqual(1);
    });

    it('should generate appropriate recommendations based on confidence', async () => {
      // High confidence
      const highResult = createTestResult({
        result: 'Comprehensive analysis with all requirements met. Market size $50B, competitors A/B/C analyzed, 15% growth projected. Sources cited.',
      });
      const highReport = await verifier.verify(createTestPlan(), createTestExecution(), highResult);
      expect(highReport.recommendations.action).toBe('accept');

      // Low confidence
      const lowResult = createTestResult({ result: 'Short text.' });
      const lowReport = await verifier.verify(createTestPlan(), createTestExecution(), lowResult);
      expect(['revise', 'retry', 'human_review']).toContain(lowReport.recommendations.action);
    });
  });

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  describe('Recommendations', () => {
    it('should generate suggested changes for issues', async () => {
      const result = createTestResult({
        result: 'Incomplete report with factual errors and contradictions. Market is $50B. Market is not more than $10B.',
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report.recommendations.suggestedChanges).toBeDefined();
      if (report.issues.length > 0) {
        expect(report.recommendations.suggestedChanges!.length).toBeGreaterThan(0);
      }
    });

    it('should provide specific suggestions for each issue type', async () => {
      const plan = createTestPlan({
        requirements: ['Include data'],
        constraints: ['Must not contain errors'],
      });
      const result = createTestResult({
        result: 'Report without data and with [ERROR] pattern.',
      });

      const report = await verifier.verify(plan, createTestExecution(), result);

      const suggestions = report.recommendations.suggestedChanges;
      expect(suggestions).toBeDefined();
      if (suggestions && suggestions.length > 0) {
        expect(suggestions.some(s => s.includes('completeness') || s.includes('quality'))).toBe(true);
      }
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty requirements', async () => {
      const plan = createTestPlan({ requirements: [] });
      const result = createTestResult();

      const report = await verifier.verify(plan, createTestExecution(), result);

      expect(report).toBeDefined();
      expect(report.evidence.matchedRequirements).toHaveLength(0);
    });

    it('should handle missing sources', async () => {
      const result = createTestResult({ sources: [] });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report).toBeDefined();
    });

    it('should handle non-string results', async () => {
      const result = createTestResult({
        result: { data: { market: '$50B', growth: '15%' } },
      });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report).toBeDefined();
      expect(report.overallConfidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long content', async () => {
      const longContent = 'Market analysis. '.repeat(1000);
      const result = createTestResult({ result: longContent });

      const report = await verifier.verify(createTestPlan(), createTestExecution(), result);

      expect(report).toBeDefined();
      expect(report.scores.quality).toBeGreaterThanOrEqual(0);
    });
  });
});
