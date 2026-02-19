# P6 Roadmap – Ločeni projekti

Nadaljnje faze razvoja AgentFlow Pro po zaključku P5 (Marketing Editor, LinkedIn/Twitter OAuth).

## Pregled

| Projekt | Opis | Ključni artefakti | Prioritetna ocena |
|---------|------|-------------------|-------------------|
| **Canvas** | Vizualno planiranje kampanj, kolaboracija | WebSocket server, drag-drop board, shared state | Visoka |
| **Chrome extension** | Ločen repozitorij | manifest v3, content script, popup UI | Srednja |
| **Team roles / Governance** | Team, Invite, brand approver | Nova tabela Team, Invite, spremembe v auth | Visoka |
| **App Library** | Katalog ready-made apps | Model App, marketplace UX | Srednja |
| **Community, Courses, Certifications** | Discord, Teachable | Zunanje integracije | Nizka |

---

## Canvas

Vizualno planiranje kampanj z real-time kolaboracijo.

- **WebSocket server** – Socket.io ali ws za live updates
- **Drag-drop board** – @xyflow/react (že v projektu) za nodes/edges
- **Shared state** – sync stanja med uporabniki, konflikti
- **Odvisnosti:** Team/Invite za skupinsko delo (opcijsko)

---

## Chrome Extension

Ločen repozitorij – content script za capture vsebine, popup za quick actions.

- **Manifest v3** – za Chrome Web Store
- **Content script** – inject v stran, capture izbranega besedila
- **Popup UI** – React, povezava z AgentFlow API
- **Odvisnosti:** Public API za generiranje

---

## Team Roles / Governance

- **Nove tabele:** `Team`, `Invite`, `TeamMember` (role: owner, admin, member, viewer)
- **Brand approver workflow** – content čaka na odobritev
- **Spremembe v auth** – next-auth, team context v session
- **Odvisnosti:** Prisma migracije

---

## App Library

Katalog ready-made apps (workflow templates).

- **Model App** – definicija: name, description, nodes, edges, inputs
- **Marketplace UX** – browse, install v Workflow Builder
- **Odvisnosti:** Workflow schema razširitev

---

## Community, Courses, Certifications

- **Discord** – bot, link do support
- **Teachable / podobne** – embed certifikati, kurzi
- **Odvisnosti:** Zunanje platforme

---

## Predlog prioritet

1. **Team roles / Governance** – potreben za Canvas kolaboracijo in enterprise
2. **Canvas** – močan differentiator, UX upgrade
3. **Chrome extension** – ločen repozitorij, manjši scope
4. **App Library** – vrednost za onboarding
5. **Community/Courses** – long-term engagement
