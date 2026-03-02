# Interface Comparison: AgentFlow Pro vs. Competition

*Automated analysis with UI capture and web research – February 2025*

---

## 1. Our Interface (AgentFlow Pro)

### Login / Sign in
| Element | Status |
|--------|--------|
| Layout | Clean, white card, centered |
| Google login | **Not configured** – shows "Google (not configured)" |
| Email/password | ✓ |
| Forgot password | ✓ link |
| Register link | ✓ |
| Autocomplete | ✓ `email`, `current-password` |
| Value proposition banner | ✓ No card required, 7-day trial, Cancel anytime |
| Social proof | "247 tourism providers this week" |

### Missing from ours
- **Show password** toggle
- **Remember me** checkbox
- Inline password validation (strength)
- Magic link / passkeys
- MFA options

### Workflow Builder
- ReactFlow canvas with nodes (Trigger, Action, Agent, Condition)
- Visually similar to n8n/Zapier
- MiniMap, Controls

---

## 2. Competition

### Zapier
- **Login:** SSO, Google, email – all working
- **UI 2024:** Purple accent, simplified tabs (Setup, Configure, Test)
- **Workflow:** Drag & drop, dynamic variables (/), custom fields
- **Strength:** Huge integration library, enterprise SSO

### n8n
- **Login:** Self-hosted, can work without login (open source)
- **UI:** Visual editor with:
  - Left side: What's New, Help, workflow management
  - Canvas: drag nodes, connect
  - Right side: Parameters panel for node configuration
- **Insights:** Dashboard with metrics (executions, failure rate, time saved)
- **Strength:** Open source, local deployment, workflow graph

### Make (Integromat)
- **Login:** Standard SaaS login
- **UI:** Purple-pink gradient, visual flow builder
- **Brand:** "Create without limits", domino logo (chain reaction)
- **Strength:** Visual no-code, team collaboration

---

## 3. Comparison – Who is Better at What

| Criteria | AgentFlow Pro | Zapier | n8n | Make |
|----------|---------------|--------|-----|------|
| **Login UX** | Basic ✓ | ★★★★ | ★★★ | ★★★★ |
| **Google login** | ✗ not configured | ✓ | ✓ | ✓ |
| **Value proposition** | ★★★★ banner | ★★★ | ★★ | ★★★ |
| **Workflow visual** | ★★★★ ReactFlow | ★★★★ | ★★★★★ | ★★★★ |
| **Tourism focus** | ★★★★★ | ★★ | ★★ | ★★ |
| **Insights/Analytics** | ★★ | ★★★ | ★★★★ | ★★★ |
| **AI agents** | ★★★★★ | ★★★ | ★★ | ★★ |

---

## 4. What We Need to Do (Priority)

### High Priority
1. **Google login – configure**  
   Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`. Button appears when configured.

2. ~~**Show password toggle**~~ ✅ **DONE**  
   Eye icon for password field – added to login and register.

3. ~~**Hide Google button if not configured**~~ ✅ **DONE**  
   Google button only shows when provider is configured; otherwise email form only.

### Medium Priority
4. **Remember me** checkbox – longer session  
5. **Consistent language** – Sign in / or with email vs. Slovene (Pozabljeno geslo?) – either all EN or all SL  
6. **Inline password validation** – show password strength in real-time during registration  
7. **Trust signals** – e.g. "Your data is secure" or lock icon

### Low Priority
8. **Magic link** – passwordless login via email  
9. **MFA** – 2FA for enterprise users  
10. **Insights dashboard** – like n8n: executions, failure rate, time saved

---

## 5. Best Practices (Authgear, web.dev)

- **88% of users** don't return after bad login UX
- **7.5% MAU** can be lost on password reset flow
- Social login reduces friction by ~30–40%
- Show password + autocomplete = password manager friendly
- Error messages: constructive, friendly, with suggestion for next step

---

## 6. Conclusion

**AgentFlow Pro has:**
- ✓ Clean, modern login
- ✓ Good value proposition banner
- ✓ Appropriate workflow builder (ReactFlow)
- ✓ Focus on tourism and AI agents (differentiator)

**Competition is better at:**
- Functional Google/SSO login
- Show password, Remember me
- Insights and analytics (n8n)
- Maturity auth flow (Zapier, Make)

**Most urgent step:** Configure Google login + hide/graceful handling when not configured.
