# Third-Party Integrations (Slack, Email)

## Slack

Workflows can post completion/error notifications to a Slack channel via **Incoming Webhook**.

### Setup

1. Slack → App → Incoming Webhooks → Add to Slack
2. Choose channel, copy Webhook URL (`https://hooks.slack.com/services/...`)
3. When creating/editing a workflow, set `slackWebhookUrl` in the workflow (via API or workflow editor)

### API

```json
PUT /api/workflows/:id
{
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...],
  "slackWebhookUrl": "https://hooks.slack.com/services/XXX/YYY/ZZZ"
}
```

---

## Email

Workflow completion/error notifications can be sent via **Resend**.

### Setup

1. [Resend](https://resend.com) → API Keys → Create
2. Add to `.env.local` and Vercel:
   - `RESEND_API_KEY` = `re_...`
   - `EMAIL_FROM` = `"AgentFlow Pro <notifications@yourdomain.com>"` (optional, default: notifications@agentflow.pro)
3. In workflow metadata, set `notificationEmail`:

```json
PUT /api/workflows/:id
{
  "metadata": {
    "notificationEmail": "you@example.com"
  }
}
```

### Events

- **Completed**: Subject "Workflow \"X\" completed"
- **Failed**: Subject "Workflow \"X\" failed" with error message

---

## HITL Escalation Notifications

When a chat response has low confidence (< 85% for inquiry_response), a `ChatEscalation` is created and staff can be notified.

### Slack

1. Create an Incoming Webhook (see Slack section above)
2. Add to `.env`: `SLACK_ESCALATION_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ`

### Email

1. Ensure `RESEND_API_KEY` and `EMAIL_FROM` are set
2. Add to `.env`: `ESCALATION_NOTIFY_EMAIL=staff@example.com`

Both are optional; if neither is set, escalations are only visible in the dashboard.
