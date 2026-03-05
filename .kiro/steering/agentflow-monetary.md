---
inclusion: fileMatch
fileMatchPattern: ['src/api/stripe/**/*', 'src/web/components/pricing/**/*']
---

# AgentFlow Monetization Rules

## Stripe Integration

- Nikoli ne hardcode-aj API keys
- Uporabi environment variables
- Implementiraj webhook signature verification
- Handle payment failures gracefully

## Usage Tracking

- Track vsak agent run
- Update usage counter v real-time
- Enforce plan limits
- Send warnings at 80% usage

## Subscription Management

- Handle upgrades/downgrades
- Handle cancellations
- Implement proration
- Send email notifications
