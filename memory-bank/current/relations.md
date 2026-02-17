# Relations

Relation types defined in `graph-schema.ts`:

- **executes** – Agent executes Workflow
- **owns** – User owns Workflow
- **triggers** – Workflow triggers Agent
- **partOf** – Task/Workflow part of another entity

## Examples

| From   | To     | Type      |
| ------ | ------ | --------- |
| research | wf-1  | executes  |
| content  | wf-2  | executes  |
| user-1   | wf-1  | owns      |
| wf-1     | research | triggers |
