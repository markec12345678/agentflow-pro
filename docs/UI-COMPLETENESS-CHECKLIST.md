# UI Completeness Checklist

Pre-launch verification. Check each item before going live.

## Navigation

| Item | Status | Notes |
|------|--------|-------|
| Vse glavne strani dostopne iz navbarja | OK | Nav links to Workflows, Apps, Pricing, Solutions, Dashboard, Generate, Prompts, Content, Chat, Memory, Profile, Settings |
| Mobile menu prikazuje vse opcije | OK | Hamburger with collapsible panel, same links |
| Breadcrumbs delujejo za globoke strani | OK | Breadcrumbs in dashboard layout |

## Tourism Layer Visibility

| Item | Status | Notes |
|------|--------|-------|
| Tourism kategorija vidna v prompt selectorju | OK | CATEGORY_LABELS includes tourism; PromptSelector shows it |
| Vsi 5 tourism promptov imajo svoje input forme | OK | VariableForm renders inputs (jezik, lokacija, etc.) |
| Language dropdown vključuje SL, EN, DE, IT, HR | OK | VARIABLE_OPTIONS.jezik in prompts.ts |
| Tourism case study viden na homepage | OK | case-studies.ts tourism-destination-content; homepage Customer Stories |

## Core Features Access

| Item | Status | Notes |
|------|--------|-------|
| Workflow builder: vsi 4 agenti dostopni | OK | Research, Content, Code, Deploy as agent types |
| Chat: prompt categories razširljiv dropdown | OK | PromptSelector with All, Blog, Social, Email, Tourism |
| Memory: zgodovina shranjenih generacij | OK | Memory (Knowledge Graph), My Content (saved posts via /api/content/history) |
| Settings: API keys, billing, profile | OK | API keys, profile exist; Billing links to Pricing |

## Mobile Responsiveness

| Item | Status | Notes |
|------|--------|-------|
| Hero sekcija berljiva na <768px | OK | Tailwind md: breakpoints, text-4xl md:text-6xl |
| Prompt form inputs stackajo vertikalno | OK | VariableForm sm:grid-cols-2; cards md:grid-cols-2 |
| CTA gumbi dovolj veliki za tap | OK | globals.css min-height: 44px for buttons/links at max-width 768px |

## Accessibility

| Item | Status | Notes |
|------|--------|-------|
| Vsi interaktivni elementi imajo aria-labels | OK | PromptSelector, Nav, FeatureTour; skip link added |
| Kontrast barv ustreza WCAG AA | Unverified | Tailwind palette; run contrast checker if needed |
| Keyboard navigation deluje | OK | Default focus; skip-to-content link; focus-visible where added |
