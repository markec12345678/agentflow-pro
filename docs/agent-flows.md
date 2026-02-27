# Agent Flows

Agent interaction patterns and orchestration.

## Orchestrator

The Orchestrator (`src/orchestrator/Orchestrator.ts`) queues tasks and routes them to the appropriate agent:

- **Research** → Firecrawl, Brave Search
- **Content** → Context7, OpenAI
- **Code** → GitHub
- **Deploy** → Vercel, Netlify

## Workflow Execution

Workflows are defined as graphs (nodes + edges) and executed by the WorkflowExecutor. Agents can be chained: Research → Content → Deploy.

## Tourism Multi-Agent

For tourism FAQs and content, see [GUEST-MULTI-AGENT.md](./GUEST-MULTI-AGENT.md).

## Related

- [Agent Development](./agent-development.md)
- [Project Structure](./PROJECT-STRUCTURE.md)
