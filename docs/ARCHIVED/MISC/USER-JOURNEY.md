# 🎯 User Journey - AgentFlow Pro

## Popoln vodnik skozi uporabniško izkušnjo

> **Zadnja posodobitev:** 10. marec 2026  
> **Verzija:** 1.0.0

---

## 📋 Kazalo

1. [Prva Prijava (Onboarding)](#1-prva-prijava-onboarding)
2. [Dashboard Pregled](#2-dashboard-pregled)
3. [Chat Interface (Boss Mode)](#3-chat-interface-boss-mode)
4. [Turizem Dashboard](#4-turizem-dashboard)
5. [Workflow Builder](#5-workflow-builder)
6. [Odobritev (Human-in-the-Loop)](#6-odobritev-human-in-the-loop)
7. [Director Mode](#7-director-mode)

---

## 1. PRVA PRIJAVA (Onboarding)

### Kaj uporabnik vidi ob prvi prijavi

**URL:** `/login` → `/dashboard`

**Zaslon 1: Login stran**

```
┌─────────────────────────────────────────────────────────┐
│  🐻 AgentFlow Pro                        Sign In         │
│     Content + Calendar                                   │
├─────────────────────────────────────────────────────────┤
│  ✓ No credit card required                               │
│  ✓ 7-day free trial                                      │
│  ✓ Cancel anytime                                        │
│  🎉 247 tourism providers joined this week               │
├─────────────────────────────────────────────────────────┤
│           ⟳ Preusmerjanje na prijavo...                 │
└─────────────────────────────────────────────────────────┘
```

**Po uspešni prijavi:**

Uporabnik vidi **Onboarding Checklist**:

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Vaš napredek: 1/5                                    │
│  ════════════════════════════════════════ 20%           │
│                                                          │
│  ✓ Ustvarili ste račun                                  │
│  ○ Dodajte nastanitev           [Začni →]               │
│  ○ Ustvarite prvi opis sobe     [Začni →]               │
│  ○ Pošljite email dobrodošlice  [Začni →]               │
│  ○ Ustvarite landing stran      [Začni →]               │
└─────────────────────────────────────────────────────────┘
```

### Psihološki principi

- ✅ **Progress tracking** - Uporabnik vidi napredek
- ✅ **Clear CTAs** - Vsak korak ima jasen call-to-action
- ✅ **Social proof** - "247 tourism providers joined"
- ✅ **No friction** - "Ne rabiš API ključev za osnovno uporabo"

---

## 2. DASHBOARD PREGLED

**URL:** `/dashboard`

### Glavne komponente

```
┌─────────────────────────────────────────────────────────┐
│  👋 Dobro jutro, tam! 🙌            ✅ Sistem deluje     │
│  Vaš AgentFlow Pro pregled za danes.                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📊 Viri rezervacij (Avtomatske vs. Ročne)       │    │
│  │ [Graf: Booking.com, Airbnb, Direktne, Expedia] │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🚀 Začni tukaj                                  │    │
│  │  [1] Dodaj nastanitev →                         │    │
│  │  [2] Ustvari rezervacijo →                      │    │
│  │  [3] Pošlji email →                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ ✍️           │ │ 📧           │ │ 🌐           │    │
│  │ Ustvari      │ │ Email za     │ │ Landing      │    │
│  │ vsebino      │ │ goste        │ │ stran        │    │
│  │ Začni →      │ │ Začni →      │ │ Začni →      │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ⚡ Hitre akcije                                  │    │
│  │ [Dobrodošlica] [+] [eTurizem] [Račun] [SMS]    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ 📄 Nedavna      │  │ 📊 Poraba       │              │
│  │ vsebina         │  │ Agent runi: 45% │              │
│  │ • Blog post     │  │ Credits: 30%    │              │
│  │ • Email         │  │                 │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Navigacija (Sidebar)

```
┌─────────────────────┐
│  ⚡ AgentFlow Pro    │
├─────────────────────┤
│ [+ Nova vsebina]    │
├─────────────────────┤
│  Pregled          │ ← Aktivno
│ 📋 Director         │
│ ✍️ Ustvari          │
│ 📁 Vsebina          │
│ 🏨 Nastanitve       │
├─────────────────────┤
│ ▼ Napredno          │
│   ⚡ Workflow       │
│   🤖 Chat           │
│   🎨 Canvas         │
│   📊 Monitoring     │
│   🧠 Memory         │
│   👑 Admin          │
└─────────────────────┘
```

---

## 3. CHAT INTERFACE (Boss Mode)

**URL:** `/chat`

### Kako deluje

```
┌─────────────────────────────────────────────────────────┐
│  🤖 Boss Mode                                            │
│  Klepetaj z AI asistentom za ustvarjanje vsebine        │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Ti]: Napiši uvod za blog o AI avtomatizaciji     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [AgentFlow Pro]:                                   │ │
│  │ Naslov: Kako AI avtomatizacija spreminja turizem  │ │
│  │                                                    │ │
│  │ V zadnjih letih se turizem sooča z največjo       │ │
│  │ transformacijo v zgodovini. Umetna inteligenca    │ │
│  │ podjetjem omogoča...                              │ │
│  └────────────────────────────────────────────────────┘ │
│     [Shrani kot BlogPost] [Create branch] [Kopiraj]    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Select Prompt: [Tourism ▼]                             │
│  ☑ Multi-agent plan (razčleni v sub-goals)             │
│                                                          │
│  [Napiši prompt...                          ] [Pošlji]  │
└─────────────────────────────────────────────────────────┘
```

### Kaj se zgodi v ozadju

**Ko uporabnik napiše: "Napiši blog o AI avtomatizaciji"**

```
1. Uporabnik vnaša prompt
   ↓
2. Sistem preveri Brand Voice iz onboardinga
   ↓
3. AI SDK (useChat) pošlje na /api/chat
   ↓
4. Če je "Multi-agent plan" vklopljen:
   ├─ Research Agent poiše relevantne podatke
   ├─ Content Agent napiše blog
   └─ SEO Agent optimizira za iskalnike
   ↓
5. Rezultat se streama nazaj v chat
   ↓
6. Uporabnik lahko:
   ├─ Shrani kot BlogPost (v database)
   ├─ Create branch (alternate version)
   └─ Kopiraj (clipboard)
```

### Prompt Templates

| Kategorija | Primeri |
|------------|---------|
| **Tourism** | Booking.com opis, Airbnb story, Destination guide |
| **Email** | Guest welcome, Pre-arrival, Check-out thank you |
| **Social** | Instagram caption, Facebook post, Twitter thread |
| **SEO** | Blog post, Landing page, Meta description |

---

## 4. TURIZEM DASHBOARD

**URL:** `/dashboard/tourism`

### Reception Mode Pregled

```
┌─────────────────────────────────────────────────────────┐
│  📅 Danes: Torek, 10. marec 2026                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬─────────────────────┐         │
│  │ 🛎️ Prihodi (3)      │ 🚪 Odhodi (2)       │         │
│  │ • Janez Novak (101) │ • Marija Zupan (205)│         │
│  │ • Ana Horvat (102)  │ • Peter Kos (310)   │         │
│  │ • Marko Brecl (Apt5)│                     │         │
│  └─────────────────────┴─────────────────────┘         │
│                                                          │
│  ⚡ Hitre akcije:                                         │
│  [Check-in] [Check-out] [Pošlji email] [Dodaj gost]    │
└─────────────────────────────────────────────────────────┘
```

### Avtomatska Komunikacija z Gosti

**Timeline avtomatizacije:**

```
[Rezervacija narejena]
        ↓
Takoj: Potrditveni email (avtomatsko)
        ↓
1 dan pred: Pre-arrival email (čaka odobritev) ⏳
        ↓ (po odobritvi)
Pošlji: Email z navodili za check-in
        ↓
Dan prihoda: SMS dobrodošlice (avtomatsko)
        ↓
Med bivanjem: Upsell zajtrk (predlog) ⏳
        ↓
Dan odhoda: Račun + zahvala (avtomatsko)
        ↓
1 dan po: Review request (avtomatsko)
```

**⏳ = Zahteva odobritev uporabnika**

---

## 5. WORKFLOW BUILDER

**URL:** `/workflows`

### Vizualni Gradnik Avtomatizacij

```
┌────────────────────────────────────────┐
│  ⚡ Workflow Builder                     │
├────────────────────────────────────────┤
│  [🔴 Trigger: Nova rezervacija]        │
│              ↓                          │
│  [⚡ Action: Pošlji pre-arrival email]  │
│              ↓                          │
│  [⏱️ Wait: 1 dan pred prihodom]        │
│              ↓                          │
│  [❓ Condition: Je gost VIP?]          │
│         ├──────────┴──────────┐        │
│         ↓                     ↓         │
│  [DA: Pošlji SMS]      [NE: Standard]  │
│  [managerju]           [check-in]      │
│                                         │
│  [✅ Shrani workflow]  [▶️ Testiraj]   │
└────────────────────────────────────────┘
```

### Pred-pripravljeni Workflow-i

1. **Guest Communication**
   - Pre-arrival email sequence
   - Check-in instructions
   - Review request

2. **Revenue Management**
   - Dynamic pricing updates
   - Seasonal campaign triggers
   - Occupancy-based discounts

3. **Operations**
   - Housekeeping assignments
   - Maintenance requests
   - Inventory alerts

---

## 6. ODOBRITEV (Human-in-the-Loop)

### Ko agent potrebuje odobritev

**Primer: Pre-arrival email za VIP gosta**

```
┌────────────────────────────────────────────────┐
│  ⏳ Čaka na odobritev (2)                       │
├────────────────────────────────────────────────┤
│  Guest Communication – Pre-arrival email       │
│  ─────────────────────────────────             │
│  Gost: Janez Novak                             │
│  Prihod: 15.3.2026 · Nastanitev: Suite A      │
│  Tip: VIP (ponovni gost)                      │
│                                                │
│  Predlog vsebine:                             │
│  ┌─────────────────────────────────────────┐  │
│  │ Spoštovani gospod Novak,                │  │
│  │                                         │  │
│  │ Veseli nas vaše ponovno prihode!       │  │
│  │ Kot naš VIP gost vam pripravljamo...   │  │
│  │                                         │  │
│  │ Prosimo sporočite čas prihoda...       │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [❌ Zavrni]     [✅ Odobri]                   │
└────────────────────────────────────────────────┘
```

### Kaj se zgodi po odobritvi

```
Uporabnik klikne "Odobri"
       ↓
Sistem shrani odločitev v database
       ↓
Workflow se nadaljuje
       ↓
Email se pošlje gostu
       ↓
Uporabnik vidi: "Email poslan ✓"
```

### Escalation (Human Handoff)

Če uporabnik 2x zavrne isti predlog:

```
┌────────────────────────────────────────────────┐
│  ⚠️ Pogovor bo prešel na človeka z vami.      │
│  Nekdo vas bo kmalu kontaktiral.              │
└────────────────────────────────────────────────┘
```

---

## 7. DIRECTOR MODE

**URL:** `/dashboard/director`

### Executive Pregled

```
┌────────────────────────────────────────────────┐
│  👑 Director: Torek, 10. marec 2026            │
├────────────────────────────────────────────────┤
│  ✅ Sistem je popolnoma avtonomen danes        │
│  Ničesar ni treba storiti                     │
├────────────────────────────────────────────────┤
│  📊 Danes:                                     │
│  ┌──────────┬──────────┬──────────┐           │
│  │ 🛎️ 3    │ 🚪 2     │ 🏠 12    │           │
│  │ Prihodov │ Odhodov  │ V nast.  │           │
│  └──────────┴──────────┴──────────┘           │
│                                                │
│  💰 Dnevni prihodek: €450.00                  │
│  (2 odhoda)                                   │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ⏳ Čaka na odobritev (0)                 │  │
│  │ Vse avtomatizacije delujejo brez        │  │
│  │ intervencije                            │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [🏨 Tourism Hub]  [📅 Koledar]               │
└────────────────────────────────────────────────┘
```

### Ko sistem zahteva pozornost

```
┌────────────────────────────────────────────────┐
│  ⚠️ Zahteva pozornost                          │
├────────────────────────────────────────────────┤
│  • 3 pre-arrival emaili čakajo na odobritev   │
│  • 1 gost nima eTurizem prijave               │
│  • Predlog cene za Suite A (€120 → €150)     │
│                                                │
│  [Upravljaj →]                                │
└────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Principi

### 1. Brez Tehničnih Podrobnosti

| ❌ Ne prikaži | ✅ Prikaži |
|--------------|-----------|
| "OpenAI API key" | "AI asistent" |
| "Model temperature: 0.7" | "Ustvari vsebino" |
| "Token limit exceeded" | "Besedilo je predolgo" |
| "Webhook endpoint" | "Avtomatsko pošlji" |

### 2. Progressive Disclosure

**Level 1 (Vsi uporabniki):**
- Dashboard
- Quick Actions
- Chat (Boss Mode)
- Basic content generation

**Level 2 (Napredni uporabniki):**
- Workflow Builder
- Canvas (campaign planner)
- Multi-agent orchestration
- Custom templates

**Level 3 (Admin):**
- Memory Graph
- System Monitoring
- API Settings
- Team management

### 3. Human-in-the-Loop Pattern

**Avtomatske akcije (brez odobritve):**
- ✓ Potrditveni email ob rezervaciji
- ✓ Check-in navodila
- ✓ Račun ob odhodu
- ✓ Review request

**Akcije z odobritvijo (⏳):**
- ⏳ Pre-arrival email (personaliziran)
- ⏳ Upsell ponudbe
- ⏳ SMS sporočila
- ⏳ Cenovne spremembe

**Eskalacija (človek):**
- → Po 2x zavrnitvi istega predloga
- → Pri kompleksnih odločitvah
- → Pri napakah v sistemu

---

## 📊 Metrike Uporabniške Izkušnje

### Čas do Prve Vrednosti (Time-to-Value)

| Korak | Ciljni čas |
|-------|-----------|
| Prijava → Dashboard | < 5 sekund |
| Dodaj prvo nastanitev | < 2 minuti |
| Ustvari prvi content | < 5 minut |
| Pošlji prvi email | < 10 minut |
| Prva avtomatska rezervacija | < 30 minut |

### Stopnje Konverzije (Onboarding Funnel)

```
Prijava: 100%
   ↓
Dodaj nastanitev: 85%
   ↓
Ustvari content: 70%
   ↓
Pošlji email: 50%
   ↓
Nastavi workflow: 30%
   ↓
Aktiviraj avtomatizacijo: 25%
```

---

## 📸 Screenshoti

Glavni ekrani so shranjeni v `screenshots/`:

- `login.png` - Login stran
- `dashboard.png` - Glavni dashboard
- `chat.png` - Chat interface (Boss Mode)
- `tourism.png` - Turizem dashboard
- `workflow.png` - Workflow Builder
- `director.png` - Director Mode

---

## 🔗 Povezani Dokumenti

- [Onboarding Flow](./ONBOARDING-FLOW.md)
- [UI Components](./UI-COMPONENTS.md)
- [API Documentation](./API-DOCS.md)
- [Demo Script](./DEMO-SCRIPT.md)
