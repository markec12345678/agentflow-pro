---
inclusion: fileMatch
fileMatchPattern: ['src/workflows/**/*', 'src/orchestrator/**/*']
---

# AgentFlow Workflow Rules

## Workflow Execution

- Validiraj workflow pred execution
- Implementiraj timeout za vsak agent run
- Shrani execution history v database
- Omogoči pause/resume za dolge workflow-e

## Conditional Logic

- Support IF/ELSE/ELSEIF
- Support AND/OR operators
- Support nested conditions
- Support variable interpolation

## Parallel Execution

- Detect independent tasks
- Run parallel ko je mogoče
- Merge results ob koncu
- Handle race conditions
