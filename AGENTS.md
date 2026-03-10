# AGENTS.md - AgentFlow Pro

## 🤖 AI Agent Guidelines

### Primary Agent Behavior

1. Vedno uporabi `/samodejno` za začetek delovnih seans
2. Uporabi Memory MCP ob začetku vsake seje
3. Small steps pristop (max 1 file naenkrat)
4. Git commit po vsaki večji spremembi
5. Testiraj pred commitom (avtomatsko: Husky pre-commit zažene `npm run precommit`; če pade, popravi in ponovi)

### MCP Usage Rules

| MCP | When to Use |
|-----|-------------|
| Memory | Ob začetku seje, ob odločitvah, ob koncu task-a |
| GitHub | Vse code operacije, PR creation |
| Playwright | E2E testing, browser automation |
| **Screenshot** | Pri debugiranju UI/login: `npm run capture:login` (zahteva dev server), nato preberi `screenshots/capture.png` |
| Firecrawl | Web scraping za research |
| Context7 | Sveže API dokumentacije |
| Vercel | Frontend deployment |
| Docker | Agent containerization |
| Sentry | Error tracking |
| Sequential Thinking | Kompleksne odločitve |

### /samodejno Workflow

1. Preberi project-brief.md
2. Preberi tasks.md
2.5. Za roadmap/prioritete/naloge iz raziskave: preberi docs/RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md
3. Search memory bank za kontekst
4. Izvedi naslednji task iz tasks.md
5. Update progress.md
6. Git commit + push
7. Repeat

### Pogled na UI (Agent mora SAM zagnati – uporabnik tega NE dela)

**Ob napakah pri prijavi, registraciji ali drugih UI težavah agent SAM:**
1. Zaženi `npm run capture:login` (ali `npm run capture:page -- <URL>`)
2. Preberi `agentflow-pro/screenshots/capture.png` z read_file
3. Analiziraj vsebino slike za diagnozo

Zahteva: dev server teče, `playwright install` narejen. Screenshot orodje je na voljo agentu, ne uporabniku.

### Review Points (Vprašaj Uporabnika)

- Brisanje obstoječih datotek
- Sprememba database sheme
- Novi API keys
- Večji refactoring
- Production deploy

### Communication Style

- Bodite concise in direct
- Explain reasoning before code
- Suggest improvements
- Flag potential issues early

---

## 🎨 UI/UX Guidelines (Updated 2026-03-10)

### Navigation Structure

**Main Navigation (Desktop & Mobile):**
- Max 5 primary items: Pregled, Koledar, Ustvari, Vsebina, Nastavitve
- Secondary items grouped under "Več orodij" section
- Mobile menu: flattened (no nested submenus), scrollable if needed

### Localization

**Language:** Slovenian (primary market)
- All user-facing text in Slovenian
- Exception: Brand names (Booking.com, Airbnb, Google)
- Login/Register → Prijava/Registracija
- Dashboard → Pregled
- Settings → Nastavitve

### Empty States

**Every widget needs an empty state when:**
- No data exists (summary === null or total === 0)
- User hasn't completed onboarding
- API returns empty array

**Empty state structure:**
1. Emoji icon (large, 48px+)
2. Heading (what's missing)
3. Description (why + benefit)
4. CTA buttons (1-2 primary actions)

**Example:**
```tsx
if (!summary || summary.totalRevenue === 0) {
  return (
    <div className="text-center p-8">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-bold mb-2">Še nimate podatkov</h3>
      <p className="text-sm text-gray-500 mb-6">
        Ko boste ustvarili prve rezervacije...
      </p>
      <a href="/calendar?open=new" className="px-4 py-2 bg-blue-600...">
        + Dodaj rezervacijo
      </a>
    </div>
  );
}
```

### Progress Bars

**Use inline styles (not CSS classes):**
```tsx
// ✅ CORRECT
<div style={{ width: `${percentage}%` }} />

// ❌ WRONG
<div className={`progress-width-${Math.round(percentage / 5) * 5}`} />
```

### Error Handling

**Login page errors:**
- OAuth errors → amber background with helpful tip
- Credentials errors → red background
- Always show dismiss button (X)
- Provide recovery action (retry, check .env, etc.)

### Accessibility

**Minimum requirements:**
- Touch targets: 44x44px minimum
- aria-label on icon-only buttons
- Keyboard navigation (Tab, Escape, Enter)
- Focus indicators (ring-2 ring-blue-500)
- Color contrast: WCAG AA (4.5:1 for text)

### Card Variants

**Three tiers:**
- **Primary (P0 features):** `bg-blue-50 border-blue-200`
- **Secondary (P1 features):** `bg-white border-gray-200`
- **Tertiary (P2 features):** `bg-gray-50 border-gray-100`

### Component Patterns

**Button hierarchy:**
1. Primary: `bg-blue-600 hover:bg-blue-700 text-white`
2. Secondary: `bg-gray-100 hover:bg-gray-200 text-gray-700`
3. Tertiary: `border border-gray-300 text-gray-700`

**Input fields:**
- Border: `border-gray-300 dark:border-gray-600`
- Focus: `focus:ring-2 focus:ring-blue-500`
- Error: `border-red-500`

**Icons:**
- Use emoji for user-facing features (🏠 📅 ✍️)
- Use Lucide icons for system functions (Home, Settings)
- Size: 20px (w-5 h-5) for navigation, 24px (w-6 h-6) for headers

### Dark Mode

**All components must support dark mode:**
- Text: `text-gray-900 dark:text-white`
- Backgrounds: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-700`

### Mobile-First

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

**Mobile menu:**
- Hamburger button (top right)
- Full-width overlay
- Scrollable if content exceeds 70vh
- Bottom nav for tourism users (4 items)

### Testing

**UI testing checklist:**
- [ ] Login flow (email + Google)
- [ ] Empty states display correctly
- [ ] Navigation works on mobile + desktop
- [ ] Dark mode toggles properly
- [ ] Keyboard navigation works
- [ ] Touch targets are 44px minimum

### Screenshot Debugging

**When UI issue reported:**
1. Agent runs: `npm run capture:login` or `npm run capture:page -- <URL>`
2. Read: `screenshots/capture.png`
3. Analyze visual elements
4. Propose fix based on screenshot

**Requires:**
- Dev server running on port 3002
- Playwright installed (`npx playwright install`)
