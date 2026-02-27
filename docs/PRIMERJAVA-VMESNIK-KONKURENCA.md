# Primerjava vmesnika: AgentFlow Pro vs. konkurenca

*Avtomatska analiza z zajetjem UI in raziskavo spleta – Februar 2025*

---

## 1. Naš vmesnik (AgentFlow Pro)

### Login / Sign in
| Element | Stanje |
|--------|--------|
| Layout | Čist, bela kartica, center |
| Google prijava | **Ni konfigurirana** – prikazuje "Google (ni konfigurirano)" |
| Email/password | ✓ |
| Pozabljeno geslo | ✓ link |
| Register link | ✓ |
| Autocomplete | ✓ `email`, `current-password` |
| Value proposition banner | ✓ Brez kartice, 7-dnevni trial, Prekliči kadarkoli |
| Social proof | "247 turističnih ponudnikov ta teden" |

### Manjkajo pri nas
- **Show password** toggle (prikaz gesla)
- **Remember me** checkbox
- Inline validacija gesla (moč gesla)
- Magic link / passkeys
- MFA opcije

### Workflow Builder
- ReactFlow canvas z nodi (Trigger, Action, Agent, Condition)
- Vizualno podoben n8n/Zapier
- MiniMap, Controls

---

## 2. Konkurenca

### Zapier
- **Login:** SSO, Google, email – vse deluje
- **UI 2024:** Purple accent, poenostavljeni tabi (Setup, Configure, Test)
- **Workflow:** Drag & drop, dinamične spremenljivke (/), custom fields
- **Moč:** Ogromna knjižnica integracij, enterprise SSO

### n8n
- **Login:** Self-hosted, lahko brez prijave (open source)
- **UI:** Vizualni editor z:
  - Leva stran: What's New, Help, workflow management
  - Canvas: drag nodes, connect
  - Desna stran: Parameters panel za konfiguracijo nodov
- **Insights:** Dashboard z metrikami (executions, failure rate, time saved)
- **Moč:** Open source, lokalni deployment, graf workflow

### Make (Integromat)
- **Login:** Standard SaaS login
- **UI:** Purple-pink gradient, vizualni flow builder
- **Brand:** "Create without limits", domino logo (chain reaction)
- **Moč:** Visual no-code, team collaboration

---

## 3. Primerjava – kdo je boljši v čem

| Kriterij | AgentFlow Pro | Zapier | n8n | Make |
|----------|---------------|--------|-----|------|
| **Login UX** | Osnovno ✓ | ★★★★ | ★★★ | ★★★★ |
| **Google prijava** | ✗ ni konfigurirana | ✓ | ✓ | ✓ |
| **Value proposition** | ★★★★ banner | ★★★ | ★★ | ★★★ |
| **Workflow vizual** | ★★★★ ReactFlow | ★★★★ | ★★★★★ | ★★★★ |
| **Turizem fokus** | ★★★★★ | ★★ | ★★ | ★★ |
| **Insights/Analytics** | ★★ | ★★★ | ★★★★ | ★★★ |
| **AI agenti** | ★★★★★ | ★★★ | ★★ | ★★ |

---

## 4. Kaj moramo narediti (prioriteta)

### Visoka prioriteta
1. **Google prijava – konfigurirati**  
   Dodaj `GOOGLE_CLIENT_ID` in `GOOGLE_CLIENT_SECRET` v `.env.local`. Ko je konfigurirana, se gumb prikaže.

2. ~~**Show password toggle**~~ ✅ **DONE**  
   Ikona očesa pri polju gesla – dodana na login in register.

3. ~~**Skrij Google gumb če ni konfiguriran**~~ ✅ **DONE**  
   Google gumb se prikaže le ko je provider konfiguriran; sicer samo email forma.

### Srednja prioriteta
4. **Remember me** checkbox – daljša seja  
5. **Enotni jezik** – Sign in / or with email vs. Slovene (Pozabljeno geslo?) – bodisi vse EN ali vse SL  
6. **Inline validacija gesla** – pri registraciji pokaži moč gesla v realnem času  
7. **Trust signals** – npr. "Vaši podatki so varni" ali lock ikona

### Nižja prioriteta
8. **Magic link** – prijava brez gesla prek emaila  
9. **MFA** – 2FA za enterprise uporabnike  
10. **Insights dashboard** – kot n8n: executions, failure rate, time saved

---

## 5. Best practices (Authgear, web.dev)

- **88% uporabnikov** ne vrne po slabi login UX
- **7.5% MAU** se lahko izgubi na password reset flow
- Social login zmanjša friction za ~30–40%
- Show password + autocomplete = password manager friendly
- Error messages: konstruktivne, prijazne, s predlogom naslednjega koraka

---

## 6. Zaključek

**AgentFlow Pro ima:**
- ✓ Čist, modern login
- ✓ Dober value proposition banner
- ✓ Ustrezen workflow builder (ReactFlow)
- ✓ Fokus na turizem in AI agente (differentiator)

**Konkurenca je boljša v:**
- Funkcionalni Google/SSO prijavi
- Show password, Remember me
- Insights in analytics (n8n)
- Maturity auth flowa (Zapier, Make)

**Najnujnejši korak:** Konfiguracija Google prijave + skritje/graceful handling ko ni konfigurirana.
