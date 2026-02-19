/**
 * AgentFlow Pro - Agent Test Script
 * Run: npx tsx scripts/test-agents.ts
 * Or: npm run test:agents (if script added)
 */

import { createResearchAgent } from "../src/agents/research/ResearchAgent";
import { createContentAgent } from "../src/agents/content/ContentAgent";

async function testAgents() {
  console.log("Testing AI Agents...\n");

  // Test Research Agent
  console.log("Testing Research Agent...");
  const researchAgent = createResearchAgent();
  const researchResult = await researchAgent.execute({
    query: "AI trends 2026",
  });
  console.log("Research Agent result:", JSON.stringify(researchResult, null, 2));

  // Test Content Agent
  console.log("\nTesting Content Agent...");
  const contentAgent = createContentAgent();
  const contentResult = await contentAgent.execute({
    topic: "AI Automation",
    format: "blog",
  });
  console.log("Content Agent result:", JSON.stringify(contentResult, null, 2));

  console.log("\nAll agents tested!");
}

testAgents().catch(console.error);
