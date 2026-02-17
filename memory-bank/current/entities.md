# Entities

Entity types defined in `graph-schema.ts`:

- **Agent** – Research, Content, Code, Deploy agents
- **Workflow** – Research, Content, Code, Deploy workflows
- **Task** – Atomic work units
- **User** – Freelancers, small teams, enterprise
- **Deploy** – Deployment targets and results

## Examples

| Entity   | Type     | Observations                          |
| -------- | -------- | ------------------------------------- |
| research | Agent    | Firecrawl enabled, Brave search       |
| content  | Agent    | Context7 + LLM                        |
| wf-1     | Workflow | Research workflow                     |
| user-1   | User     | Freelancer                            |
| deploy-1 | Deploy   | Vercel production                     |
