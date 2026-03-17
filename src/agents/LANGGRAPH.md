# LangGraph.js Integracija

## Pregled

AgentFlow Pro zdaj uporablja **LangGraph.js** za standardizacijo agentnih workflow-ov. LangGraph omogoča:

- ✅ State machine-based agent flows
- ✅ Cycle detection in loop handling
- ✅ Conditional routing
- ✅ Multi-agent collaboration
- ✅ Human-in-the-loop support

## Namestitev

```bash
npm install @langchain/langgraph @langchain/core @langchain/openai
```

## Struktura

```
src/agents/
├── graphs/              # LangGraph definicije
│   └── research-agent.ts
├── nodes/               # Reusable node komponente
│   └── common-nodes.ts
├── edges/               # Flow control edges
│   └── common-edges.ts
└── orchestrator.ts      # Legacy/custom agent sistem
```

## Uporaba

### 1. Kreiraj Graph

```typescript
import { researchGraph } from '@/agents/graphs/research-agent';

// Invoke graph
const result = await researchGraph.invoke({
  query: "Kakšni so turistični trendi za Slovenijo 2025?",
  researchType: "trends",
  messages: [],
  searchResults: [],
  extractedContent: [],
  analysis: null,
  currentStep: "start",
  retryCount: 0,
  confidence: 0,
  summary: "",
  insights: [],
  recommendations: [],
  sources: [],
  createdAt: new Date().toISOString()
});

console.log(result);
```

### 2. Definiraj Node

```typescript
import { llmCallNode } from '@/agents/nodes/common-nodes';

async function myNode(state: any) {
  return await llmCallNode(state, {
    systemPrompt: "You are a helpful assistant",
    userPromptFn: (ctx) => `Process: ${ctx.query}`,
    outputKey: "result"
  });
}
```

### 3. Definiraj Edge

```typescript
import { createConditionalEdge } from '@/agents/edges/common-edges';

const routeEdge = createConditionalEdge(
  (state) => state.confidence > 0.7,
  'complete',  // true path
  'retry'      // false path
);
```

### 4. Sestavi Graph

```typescript
import { StateGraph, END } from '@langchain/langgraph';

const workflow = new StateGraph<MyState>({
  channels: {
    query: { reducer: (a, b) => b },
    messages: { reducer: (a, b) => [...a, ...b] },
    // ... define all state channels
  }
});

// Add nodes
workflow.addNode('plan', planNode);
workflow.addNode('search', searchNode);
workflow.addNode('analyze', analyzeNode);

// Set entry and edges
workflow.setEntryPoint('plan');
workflow.addEdge('plan', 'search');
workflow.addEdge('search', 'analyze');
workflow.addEdge('analyze', END);

// Compile
const graph = workflow.compile();
```

## Research Agent Graph

### State Flow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       v
┌─────────────┐
│    Plan     │ ──► Break query into search strategies
└──────┬──────┘
       │
       v
┌─────────────┐
│   Search    │ ──► Execute web searches
└──────┬──────┘
       │
       v
┌─────────────┐
│   Extract   │ ──► Extract content from URLs
└──────┬──────┘
       │
       v
┌─────────────┐
│   Analyze   │ ──► Identify themes & trends
└──────┬──────┘
       │
       v
┌─────────────┐
│  Synthesize │ ──► Create final report
└──────┬──────┘
       │
       v
┌─────────────┐
│   Verify    │ ──► Quality check
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   v       v
┌─────┐ ┌──────┐
│ END │ │ RETRY│
└─────┘ └──────┘
```

### State Interface

```typescript
interface ResearchState {
  // Input
  query: string;
  researchType: 'market' | 'competitor' | 'trends' | 'general';
  
  // Working memory
  messages: Array<{ role: string; content: string }>;
  searchResults: SearchResult[];
  extractedContent: ExtractedContent[];
  analysis: AnalysisResult | null;
  
  // Flow control
  currentStep: string;
  retryCount: number;
  confidence: number;
  
  // Output
  summary: string;
  insights: string[];
  recommendations: string[];
  sources: Source[];
  
  // Metadata
  createdAt: string;
  completedAt?: string;
  error?: string;
}
```

## Common Nodes

### LLM Call Node

```typescript
import { llmCallNode } from '@/agents/nodes/common-nodes';

const result = await llmCallNode(state, {
  systemPrompt: "You are an expert analyst",
  userPromptFn: (ctx) => `Analyze: ${ctx.query}`,
  model: "gpt-4o-mini",
  temperature: 0.3,
  outputKey: "analysis"
});
```

### Tool Call Node

```typescript
import { toolCallNode } from '@/agents/nodes/common-nodes';

const result = await toolCallNode(state, {
  toolName: "webSearch",
  toolFn: async (query) => await searchWeb(query),
  inputExtractor: (ctx) => ctx.query,
  outputKey: "searchResults"
});
```

### Quality Check Node

```typescript
import { qualityCheckNode } from '@/agents/nodes/common-nodes';

const result = await qualityCheckNode(state, {
  qualityThreshold: 0.7,
  qualityMetric: (ctx) => ctx.confidence,
  passPath: "complete",
  failPath: "retry",
  maxRetries: 2
});
```

## Common Edges

### Conditional Edge

```typescript
import { createConditionalEdge } from '@/agents/edges/common-edges';

const route = createConditionalEdge(
  (state) => state.confidence > 0.7,
  'complete',
  'retry'
);
```

### Quality-based Edge

```typescript
import { createQualityEdge } from '@/agents/edges/common-edges';

const qualityRoute = createQualityEdge(
  0.7,    // threshold
  'pass', // high quality path
  'retry' // low quality path
);
```

### Retry Edge

```typescript
import { createRetryEdge } from '@/agents/edges/common-edges';

const retryRoute = createRetryEdge(
  'retry_search',  // retry path
  'fail',          // fail path
  3                // max retries
);
```

## Testing

```typescript
import { researchGraph } from '@/agents/graphs/research-agent';

describe('Research Agent', () => {
  it('should execute research flow', async () => {
    const result = await researchGraph.invoke({
      query: "Test query",
      researchType: "general",
      messages: [],
      searchResults: [],
      extractedContent: [],
      analysis: null,
      currentStep: "start",
      retryCount: 0,
      confidence: 0,
      summary: "",
      insights: [],
      recommendations: [],
      sources: [],
      createdAt: new Date().toISOString()
    });
    
    expect(result.summary).toBeDefined();
    expect(result.insights).toHaveLength(3);
    expect(result.sources).toBeDefined();
  });
});
```

## Migracija iz Custom Agentov

### Pred (Custom)

```typescript
import { Agent } from '@/orchestrator/Orchestrator';

const agent = new Agent({
  id: 'research-agent',
  type: 'Research',
  execute: async (input) => {
    // Custom logic
  }
});
```

### Po (LangGraph)

```typescript
import { StateGraph } from '@langchain/langgraph';
import { researchGraph } from '@/agents/graphs/research-agent';

const result = await researchGraph.invoke(state);
```

## Prednosti

| Feature | Custom | LangGraph |
|---------|--------|-----------|
| State Management | Manual | Built-in |
| Cycle Detection | ❌ | ✅ |
| Conditional Routing | Manual | Built-in |
| Human-in-the-loop | ❌ | ✅ |
| Multi-agent | Manual | Built-in |
| Visualization | ❌ | ✅ (LangGraph Studio) |

## Next Steps

1. ✅ Research Agent Graph
2. ⏳ Content Agent Graph
3. ⏳ Code Agent Graph
4. ⏳ Deploy Agent Graph
5. ⏳ Multi-agent Collaboration

## Viri

- [LangGraph.js Docs](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js Docs](https://js.langchain.com/)
- [Examples](https://github.com/langchain-ai/langgraphjs/tree/main/examples)
