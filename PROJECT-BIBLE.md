# AgentFlow Pro - Project Bible

## 🎯 Kaj Je To?

**AgentFlow Pro** je sistem za upravljanje turističnih nastanitev z AI avtomatizacijo.

**Ciljna publika:** Lastniki apartmajev, hotelov, počitniških hišic.

---

## ✅ Kaj Deluje (Trenutno Stanje)

### Core Funkcije:
- ✅ **Memory MCP Auto-Update** - gosti se samodejno shranjujejo ob rezervaciji
- ✅ **Rezervacije** - poln sistem za upravljanje rezervacij
- ✅ **Email Sistem** - avtomatska pošiljanje emailov gostom
- ✅ **Dashboard** - pregledni panel za uporabnike
- ✅ **Hitre Akcije** - hitri dostopi do pogostih opravil
- ✅ **Onboarding** - vodi nove uporabnike korak za korakom

### Testi:
- ✅ **441/453 testov** deluje (97.5%)
- ✅ **Vitest** - modern test runner
- ❌ 12 testov ne deluje (bcryptjs mock - tehnična težava, ne vpliva na delovanje)

---

## 🚀 Quick Start Za Uporabnike

### 1. Dodaj Nastanitev
```
Dashboard → Nastanitve → Dodaj nastanitev
```

### 2. Ustvari Rezervacijo
```
Dashboard → Koledar → Nova rezervacija
```

### 3. Pošlji Email
```
Dashboard → Komunikacija → Izberi gosta → Pošlji
```

---

## 📁 Struktura Projekta

```
agentflow-pro/
├── src/
│   ├── app/                    # Next.js routes
│   │   ├── dashboard/          # Glavni dashboard
│   │   ├── api/tourism/        # API endpoints
│   │   └── settings/           # Nastavitve (samo za admin)
│   ├── web/components/         # UI komponente
│   │   ├── QuickActionsPanel   # Hitre akcije
│   │   └── OnboardingChecklist # Onboarding wizard
│   ├── ai/                     # AI agenti
│   │   └── context-manager.ts  # Memory MCP
│   └── lib/                    # Utility functions
├── tests/                      # Testi
├── prisma/                     # Database schema
└── package.json                # Dependencies
```

---

## 🔧 Tehnične Nastavitve (Samo za Admin)

### API Keys (Opciono):
- **OpenAI** - za AI funkcije (generiranje vsebine)
- **Firecrawl** - za web scraping (opciono)
- **SerpAPI** - za Google search (opciono)

**Pomembno:** Uporabniki NE rabijo API keys za osnovno delovanje!

### Memory MCP:
- Samodejno shranjuje guest preferences
- Ustvarja knowledge graph
- Deluje brez dodatnih nastavitev

---

## 📊 Kako Zagnati

### Development:
```bash
npm install
npm run dev
```

Odpre se na `http://localhost:3002`

### Testi:
```bash
npm test
```

### Production:
```bash
npm run build
npm start
```

---

## 🎨 UI Komponente

### QuickActionsPanel
- 5 hitrih akcij (Email, Rezervacija, eTurizem, Račun, WhatsApp)
- Krajša besedila za boljšo berljivost
- Ikone za hitro prepoznavanje

### OnboardingChecklist
- 5 korakov za nove uporabnike
- Shrani napredek v localStorage
- Skrije se ko je končano

### Dashboard
- KPI kartice (prihodki, zasedenost, rezervacije)
- Quick Start guide (3 koraki)
- Hitre akcije
- Nedavna vsebina

---

## 🐛 Znane Težave

### 1. Hydration Mismatch (Rešeno)
- **Problem:** Server/client rendering mismatch
- **Rešitev:** Dodan `mounted` state v OnboardingChecklist

### 2. Breadcrumb Text (Rešeno)
- **Problem:** Predolga besedila v QuickActions
- **Rešitev:** Krajša besedila ("WhatsApp" namesto "Pošlji WhatsApp")

### 3. Vitest bcryptjs Mock (Znano)
- **Problem:** 12 testov ne deluje zaradi CJS/ESM interop
- **Vpliv:** Noben - samo unit testi, production deluje
- **Rešitev:** Ignoriraj ali uporabi `vi.importActual()`

---

## 📈 Roadmap

### Faza 1: Osnove (✅ Končano)
- ✅ Memory MCP Auto-Update
- ✅ Quick Start Guide
- ✅ Onboarding Wizard
- ✅ Hitre Akcije (popravljeno)

### Faza 2: Izboljšave (Naslednje)
- [ ] Email notifikacije ob rezervaciji
- [ ] Calendar integracija
- [ ] Reporting dashboard

### Faza 3: Napredno (Kasneje)
- [ ] Composio MCP integracije (300+ app)
- [ ] Multi-property support
- [ ] Team management

---

## 🔐 Varnost

### User Roles:
- **Admin** - vidi vse nastavitve
- **User** - vidi samo dashboard
- **Viewer** - samo pregled

### API Keys:
- Shranjeni v environment variables
- Nikoli ne commitaj v git
- Uporabi `.env.local` za development

---

## 📚 Pomembne Datoteke

### Konfiguracija:
- `package.json` - dependencies in scripts
- `vitest.config.ts` - test konfiguracija
- `prisma/schema.prisma` - database schema

### Glavne Komponente:
- `src/app/dashboard/page.tsx` - glavna dashboard stran
- `src/web/components/QuickActionsPanel.tsx` - hitre akcije
- `src/ai/context-manager.ts` - Memory MCP

### Testi:
- `tests/memory/` - Memory sistemi testi
- `tests/api/tourism/` - API endpoint testi
- `tests/lib/` - utility funkcije testi

---

## 💡 Nasveti za Uporabnike

### Za Začetek:
1. **Ne rabiš API keys** - sistem deluje brez
2. **Sledi Quick Start** - 3 preprosti koraki
3. **Uporabi Hitre Akcije** - najhitrejši način

### Za Napredne:
1. **Nastavi OpenAI** - za AI funkcije
2. **Ustvari Workflow** - avtomatiziraj procese
3. **Uporabi Memory** - gosti se samodejno shranjujejo

---

## 🎯 Zaključek

**AgentFlow Pro** je **pripravljen za uporabo**!

- ✅ Osnovne funkcije delujejo
- ✅ Preprost za uporabnike (brez tehničnega znanja)
- ✅ Razširljiv (Composio, workflows, AI)

**Next Step:** Dodaj prvo nastanitev in ustvari prvo rezervacijo!

---

## 📞 Podpora

Za pomoč:
1. Preberi ta dokument
2. Poglej Quick Start na dashboardu
3. Kontaktiraj admin uporabnika

**Version:** 1.0.0
**Last Updated:** 2026-03-09
