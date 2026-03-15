# Agent Development

Building custom agents for AgentFlow Pro.

## Agent Structure

Agents live in `src/agents/`. Each agent has:
- A main agent class (e.g. `ResearchAgent.ts`)
- API clients (Firecrawl, Context7, GitHub, etc.)
- Config in `config.ts`

## Creating a New Agent

1. Add a folder under `src/agents/[agent-name]/`
2. Implement the agent interface used by the Orchestrator
3. Register in `src/orchestrator/Orchestrator.ts`
4. Add MCP integration if needed (see [.cursor/MCP_REQUIRED.md](../.cursor/MCP_REQUIRED.md))

## Related

- [Project Structure](./PROJECT-STRUCTURE.md) – codebase layout
- [API Documentation](./api.md) – public API
- [Features](./FEATURES.md) – platform capabilities
