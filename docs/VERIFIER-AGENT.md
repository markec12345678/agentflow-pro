# Verifier Agent - Documentation

## Overview

The **Verifier Agent** is a critical component for ensuring AI agent reliability and preventing hallucinations in AgentFlow Pro. Based on research showing that modular verification increases reliability from ~70% to ~95%, this agent performs comprehensive checks on all agent outputs before they reach the user.

## Features

### Core Capabilities

| Capability | Description | Impact |
|------------|-------------|--------|
| **Plan Alignment Check** | Verifies output matches the original plan goals and requirements | Prevents scope drift |
| **Factual Accuracy** | Cross-references claims with provided sources | Detects hallucinations |
| **Consistency Check** | Ensures internal consistency throughout output | Catches contradictions |
| **Completeness Check** | Validates all requirements and sections are present | Ensures thoroughness |
| **Quality Assessment** | Checks for errors, appropriate length, formatting | Maintains standards |
| **Hallucination Detection** | Identifies unsupported claims and fabrications | Builds trust |
| **Confidence Scoring** | Provides 0-1 confidence score with weighted metrics | Enables decision-making |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Execution                        │
│  (Content, Research, Code, Deploy, etc.)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Verifier Agent                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1. Plan Alignment Check                         │   │
│  │     - Goal matching                              │   │
│  │     - Requirements validation                    │   │
│  │     - Success criteria evaluation                │   │
│  │     - Constraint compliance                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  2. Factual Accuracy Check                       │   │
│  │     - Claim extraction                           │   │
│  │     - Source cross-reference                     │   │
│  │     - Confidence assessment                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  3. Consistency Check                            │   │
│  │     - Statement extraction                       │   │
│  │     - Contradiction detection                    │   │
│  │     - Logical flow validation                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  4. Completeness Check                           │   │
│  │     - Expected sections detection                │   │
│  │     - Missing content identification             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  5. Quality Check                                │   │
│  │     - Empty content detection                    │   │
│  │     - Length appropriateness                     │   │
│  │     - Error pattern detection                    │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Verification Report                         │
│  - Overall confidence score (0-1)                       │
│  - Pass/fail determination                              │
│  - Human review flag                                    │
│  - Detailed issue list with severity                    │
│  - Actionable recommendations                           │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { getVerifierAgent, VerificationPlan } from '@/agents/verification/VerifierAgent';

// Initialize verifier
const verifier = getVerifierAgent();

// Define verification plan
const plan: VerificationPlan = {
  id: 'workflow-123',
  goal: 'Generate a comprehensive market analysis report',
  requirements: [
    'Include market size data',
    'Analyze top 3 competitors',
    'Provide growth projections'
  ],
  successCriteria: [
    'Report is at least 500 words',
    'Includes numerical data',
    'Has clear recommendations'
  ],
  constraints: [
    'Must not contain confidential information',
    'Must cite at least 2 sources'
  ],
  sources: [
    'https://example.com/market-report',
    'https://example.com/competitors'
  ]
};

// Define execution details
const execution = {
  agentId: 'content-agent-1',
  agentType: 'content',
  input: { topic: 'Market Analysis' },
  output: { content: 'Generated content...' },
  executionTime: 1500
};

// Define result
const result = {
  success: true,
  result: 'Generated market analysis content...',
  sources: ['https://example.com/market-report']
};

// Run verification
const report = await verifier.verify(plan, execution, result);

// Check results
console.log(`Confidence: ${report.overallConfidence.toFixed(2)}`);
console.log(`Passed: ${report.passed}`);
console.log(`Requires Human Review: ${report.requiresHumanReview}`);
console.log(`Issues Found: ${report.issues.length}`);

if (!report.passed) {
  console.log('Recommendations:', report.recommendations);
}
```

### Custom Configuration

```typescript
import { getVerifierAgent, VerificationConfig } from '@/agents/verification/VerifierAgent';

const customConfig: Partial<VerificationConfig> = {
  // Raise confidence threshold for critical workflows
  minConfidenceThreshold: 0.9,
  
  // Lower threshold for human review trigger
  humanReviewThreshold: 0.7,
  
  // Disable specific checks for faster verification
  checks: {
    planAlignment: true,
    factualAccuracy: true,
    consistency: true,
    completeness: false, // Skip for simple tasks
    quality: true,
  },
  
  // Configure retry behavior
  retry: {
    maxRetries: 5,
    retryOnConfidenceBelow: 0.6,
  }
};

const verifier = getVerifierAgent(customConfig);
```

## Verification Report Structure

### Report Fields

```typescript
interface VerificationReport {
  // Metadata
  id: string;                    // Unique report ID
  planId: string;                // Associated plan ID
  executionId: string;           // Agent execution ID
  timestamp: Date;               // Verification timestamp
  
  // Overall Assessment
  overallConfidence: number;     // 0-1 weighted confidence score
  passed: boolean;               // Meets minimum threshold?
  requiresHumanReview: boolean;  // Below human review threshold?
  
  // Detailed Scores (0-1 each)
  scores: {
    planAlignment: number;       // Goal/requirements match
    factualAccuracy: number;     // Claims supported by sources
    consistency: number;         // Internal consistency
    completeness: number;        // All sections present
    quality: number;             // Format, length, errors
  };
  
  // Issues Found
  issues: VerificationIssue[];
  
  // Evidence
  evidence: {
    matchedRequirements: string[];    // Requirements met
    missedRequirements: string[];     // Requirements missing
    supportedClaims: ClaimEvidence[]; // Claims with sources
    unsupportedClaims: ClaimEvidence[]; // Unsupported claims
    inconsistencies: Inconsistency[]; // Contradictions found
  };
  
  // Recommendations
  recommendations: {
    action: 'accept' | 'revise' | 'retry' | 'human_review';
    reason: string;
    suggestedChanges?: string[];
  };
  
  // Metadata
  metadata: {
    verifierVersion: string;
    verificationDuration: number;  // ms
    checksPerformed: string[];
  };
}
```

### Issue Severity Levels

| Severity | Description | Action |
|----------|-------------|--------|
| **Critical** | Fundamental flaws (empty result, major constraint violation) | Immediate human review |
| **High** | Significant issues (missing requirements, contradictions) | Revise or retry |
| **Medium** | Moderate problems (some missing sections, weak sources) | Consider revision |
| **Low** | Minor issues (slightly short, formatting) | Optional improvement |

## Integration with Orchestrator

The Verifier Agent is automatically integrated into the workflow orchestrator:

```typescript
// src/agents/orchestrator.ts
import { VerifierAgent, getVerifierAgent } from './verification/VerifierAgent';

// Create verifier
const verifier = getVerifierAgent({
  minConfidenceThreshold: 0.8,
  humanReviewThreshold: 0.6,
});

// Create orchestrator with verifier
const orchestrator = new AgentOrchestrator(agents, {
  verifier,
  enableVerification: true,
});

// Execute workflow (verification runs automatically)
const result = await orchestrator.executeWorkflow(workflow);

// Check verification results
if (result.verificationReport) {
  console.log(`Verification: ${result.verificationReport.passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Confidence: ${result.verificationReport.overallConfidence.toFixed(2)}`);
  
  if (result.requiresHumanReview) {
    // Flag for human review
    await flagForHumanReview(result);
  }
}
```

## Confidence Scoring Algorithm

The overall confidence score is calculated using weighted averages:

```typescript
const weights = {
  planAlignment: 0.30,    // 30% - Most important
  factualAccuracy: 0.25,  // 25% - Critical for trust
  consistency: 0.20,      // 20% - Logical coherence
  completeness: 0.15,     // 15% - Thoroughness
  quality: 0.10,          // 10% - Presentation
};

const weightedSum =
  scores.planAlignment * weights.planAlignment +
  scores.factualAccuracy * weights.factualAccuracy +
  scores.consistency * weights.consistency +
  scores.completeness * weights.completeness +
  scores.quality * weights.quality;

// Normalized to 0-1 range
overallConfidence = Math.max(0, Math.min(1, weightedSum));
```

## Decision Matrix

Based on confidence score, the verifier recommends:

| Confidence Score | Action | Description |
|------------------|--------|-------------|
| **≥ 0.8** | `accept` | High quality, auto-approve |
| **0.6 - 0.8** | `revise` | Good but needs improvements |
| **0.3 - 0.6** | `retry` | Significant issues, retry agent |
| **< 0.3** | `human_review` | Critical issues, human intervention required |

## Best Practices

### 1. Set Appropriate Thresholds

```typescript
// Critical workflows (legal, medical, financial)
const strictVerifier = getVerifierAgent({
  minConfidenceThreshold: 0.95,
  humanReviewThreshold: 0.85,
});

// Standard workflows (content, research)
const standardVerifier = getVerifierAgent({
  minConfidenceThreshold: 0.8,
  humanReviewThreshold: 0.6,
});

// Experimental workflows (ideation, brainstorming)
const lenientVerifier = getVerifierAgent({
  minConfidenceThreshold: 0.6,
  humanReviewThreshold: 0.4,
});
```

### 2. Provide Clear Requirements

```typescript
// ❌ Vague requirements
const badPlan = {
  requirements: ['Make it good', 'Be comprehensive'],
};

// ✅ Specific, verifiable requirements
const goodPlan = {
  requirements: [
    'Include market size in USD',
    'List top 3 competitors with market share percentages',
    'Provide 5-year CAGR projection',
    'Cite at least 3 industry sources'
  ],
};
```

### 3. Include Source URLs

```typescript
// ❌ No sources
const badResult = {
  result: 'The market is growing fast.',
};

// ✅ With sources
const goodResult = {
  result: 'The market is growing at 15% CAGR according to Industry Report 2024.',
  sources: ['https://example.com/industry-report-2024'],
};
```

### 4. Handle Low Confidence Appropriately

```typescript
const report = await verifier.verify(plan, execution, result);

switch (report.recommendations.action) {
  case 'accept':
    // Proceed with delivery
    await deliverToUser(report);
    break;
    
  case 'revise':
    // Send back to agent with suggestions
    await reviseWithSuggestions(result, report.recommendations.suggestedChanges);
    break;
    
  case 'retry':
    // Retry agent execution
    await retryAgentExecution(execution.agentId);
    break;
    
  case 'human_review':
    // Escalate to human
    await escalateToHuman(report);
    break;
}
```

## Testing

Run the Verifier Agent tests:

```bash
# Run all tests
npm test

# Run only verifier tests
npm test -- tests/agents/verification.test.ts

# Run with coverage
npm test -- --coverage --testNamePattern="VerifierAgent"
```

## Performance Considerations

| Factor | Impact | Optimization |
|--------|--------|--------------|
| **Content Length** | Linear scaling | Set appropriate length thresholds |
| **Number of Claims** | O(n) verification | Limit claims to verify per execution |
| **Source Count** | O(n*m) cross-reference | Cache source content |
| **Check Configuration** | Fewer checks = faster | Disable non-critical checks for simple tasks |

Typical verification duration: **50-200ms** for standard content.

## Future Enhancements

### Planned Features

1. **External API Integration**
   - Real-time fact-checking via Google Search API
   - Integration with fact-checking databases
   
2. **Domain-Specific Validators**
   - Legal compliance checker
   - Medical accuracy validator
   - Financial regulation checker

3. **ML-Powered Verification**
   - NLI (Natural Language Inference) for contradiction detection
   - Embedding-based similarity for requirement matching
   - Classification models for issue severity

4. **Knowledge Base Integration**
   - Connect to Memory MCP for cross-session fact verification
   - Historical claim tracking
   - Pattern recognition for recurring issues

## Troubleshooting

### Common Issues

**Issue: Verification always fails**
- **Cause**: Thresholds set too high
- **Fix**: Lower `minConfidenceThreshold` to 0.7-0.8

**Issue: Too many false positives**
- **Cause**: Factual accuracy check without sources
- **Fix**: Provide `sources` array or disable `factualAccuracy` check

**Issue: Verification too slow**
- **Cause**: Too many claims to verify
- **Fix**: Limit claim extraction or cache source content

**Issue: Contradictions not detected**
- **Cause**: Simple keyword-based detection
- **Fix**: Enhance with NLI model (future enhancement)

## Related Documentation

- [Agent Orchestrator](./ORCHESTRATOR.md) - How verifier integrates with workflow execution
- [Agent Registry](./AGENT-REGISTRY.md) - Agent capability tracking
- [Memory System](./MEMORY.md) - Knowledge graph for fact verification
- [Testing Guide](./TESTING.md) - How to write verification tests

## Changelog

### v1.0.0 (2026-03-17)
- ✅ Initial implementation
- ✅ Plan alignment checking
- ✅ Factual accuracy verification
- ✅ Consistency checking
- ✅ Completeness validation
- ✅ Quality assessment
- ✅ Confidence scoring
- ✅ Human review flagging
- ✅ Comprehensive test suite (28 tests)
