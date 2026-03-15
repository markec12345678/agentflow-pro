# 📊 VSI DASHBOARDI IN VMESNIKI - AgentFlow Pro

**Lokacija:** `http://localhost:3002`  
**Datum:** 2026-03-12

---

## 🏠 GLAVNI DASHBOARDI

### Osnovni Dashboard
| URL | Opis |
|-----|------|
| `/dashboard` | Glavni dashboard (redirecta na tourism za uporabnike turizma) |
| `/dashboard/director` | Director dashboard - pregled celotnega poslovanja |

---

## 🏨 TOURISM HUB (Glavni modul za turizem)

### Tourism Dashboard
| URL | Opis |
|-----|------|
| `/dashboard/tourism` | Glavni tourism dashboard |
| `/dashboard/tourism?mode=reception` | Reception mode - hitri pregled za receptorje |

### Rezervacije in Koledar
| URL | Opis |
|-----|------|
| `/dashboard/tourism/calendar` | Koledar rezervacij |
| `/dashboard/tourism/inbox` | Povpraševanja in inbox |
| `/dashboard/tourism/guest-communication` | Komunikacija z gosti |
| `/dashboard/tourism/arrivals` | Prihodi gostov |
| `/dashboard/tourism/departures` | Odhodi gostov |

### Generiranje Vsebine
| URL | Opis |
|-----|------|
| `/dashboard/tourism/generate` | Generiranje vsebine z AI |
| `/dashboard/tourism/bulk-generate` | Masovno generiranje |
| `/dashboard/tourism/templates` | Predloge za generiranje |

### Email Marketing
| URL | Opis |
|-----|------|
| `/dashboard/tourism/email` | Email kampanje |
| `/dashboard/tourism/notifications` | Obvestila gostom |

### Landing Strani
| URL | Opis |
|-----|------|
| `/dashboard/tourism/landing` | Builder landing strani |
| `/dashboard/tourism/seo` | SEO optimizacija |
| `/dashboard/tourism/seo/search-console-setup` | Google Search Console setup |

### Dinamične Cene
| URL | Opis |
|-----|------|
| `/dashboard/tourism/dynamic-pricing` | Dinamično določanje cen |
| `/dashboard/tourism/revenue` | Revenue management |
| `/dashboard/tourism/competitors` | Analiza konkurence |

### eTurizem Integracije
| URL | Opis |
|-----|------|
| `/dashboard/tourism/eturizem-settings` | eTurizem nastavitve |
| `/dashboard/tourism/booking-com` | Booking.com integracija |
| `/dashboard/tourism/pms-connections` | PMS povezave |
| `/dashboard/tourism/airbnb` | Airbnb integracija |

### Analitika in Poročila
| URL | Opis |
|-----|------|
| `/dashboard/tourism/analytics` | Analitika poslovanja |
| `/dashboard/tourism/data-cleanup` | Čiščenje podatkov |

### Prevodi in Jeziki
| URL | Opis |
|-----|------|
| `/dashboard/tourism/translate` | Prevodi vsebin |

### Itinerarji
| URL | Opis |
|-----|------|
| `/dashboard/tourism/itineraries` | Itinerarji za goste |

### Nastanitve
| URL | Opis |
|-----|------|
| `/dashboard/tourism/properties` | Pregled nastanitev |

### Use Cases
| URL | Opis |
|-----|------|
| `/dashboard/tourism/use-cases` | Primeri uporabe |

---

## 🏢 PROPERTIES (Upravljanje Nastanitev)

### Glavni Properties
| URL | Opis |
|-----|------|
| `/dashboard/properties` | Pregled vseh nastanitev |
| `/dashboard/properties/create` | Ustvari novo nastanitev |

### Property Detajli (`[id]` = ID nastanitve)
| URL | Opis |
|-----|------|
| `/dashboard/properties/[id]` | Pregled nastanitve |
| `/dashboard/properties/[id]/rooms` | Sobe v nastanitvi |
| `/dashboard/properties/[id]/amenities` | Ugodnosti |
| `/dashboard/properties/[id]/pricing` | Cenik |
| `/dashboard/properties/[id]/blocked-dates` | Blokirani datumi |
| `/dashboard/properties/[id]/policies` | Pravila |
| `/dashboard/properties/[id]/integrations` | Integracije |

---

## 🛎️ RECEPTOR (Za receptorje)

### Receptor Dashboard
| URL | Opis |
|-----|------|
| `/dashboard/receptor` | Glavni receptor dashboard |
| `/dashboard/receptor/quick-reservation` | Hitra rezervacija |
| `/dashboard/receptor/calendar` | Koledar za receptorje |
| `/dashboard/receptor/arrivals` | Današnji prihodi |
| `/dashboard/receptor/departures` | Današnji odhodi |
| `/dashboard/receptor/real-time-rooms` | Sobe v realnem času |
| `/dashboard/receptor/rooms` | Pregled sob |
| `/dashboard/receptor/guests/search` | Iskanje gostov |

---

## 📊 REZERVACIJE

### Rezervacije
| URL | Opis |
|-----|------|
| `/dashboard/reservations` | Pregled vseh rezervacij |
| `/dashboard/reservations/[id]` | Detajli rezervacije |
| `/dashboard/reservations/check-in` | Check-in proces |
| `/dashboard/reservations/check-out` | Check-out proces |
| `/dashboard/reservations/payments` | Plačila rezervacij |

---

## 🧹 SOBE IN VZDRŽEVANJE

### Sobe
| URL | Opis |
|-----|------|
| `/dashboard/rooms` | Pregled vseh sob |
| `/dashboard/rooms/[id]` | Detajli sobe |
| `/dashboard/rooms/housekeeping` | Hišno redarjenje |
| `/dashboard/rooms/maintenance` | Vzdrževanje |

---

## 🤖 AI AGENTI IN WORKFLOWI

### Workflow Builder
| URL | Opis |
|-----|------|
| `/dashboard/workflows` | Pregled workflowov |
| `/dashboard/workflows/builder` | Builder workflowov |

### MCP Builder
| URL | Opis |
|-----|------|
| `/dashboard/mcp-builder` | MCP (Model Context Protocol) builder |

### Chat z Agenti
| URL | Opis |
|-----|------|
| `/dashboard/chat` | Chat z AI agenti |

---

## 📈 ANALITIKA IN POROČILA

### Insights
| URL | Opis |
|-----|------|
| `/dashboard/insights` | Business insights |

### Poročila
| URL | Opis |
|-----|------|
| `/dashboard/reports/occupancy` | Poročilo o zasedenosti |
| `/dashboard/reports/revenue` | Revenue poročilo |
| `/dashboard/reports/guests` | Guest poročilo |

### Content Quality
| URL | Opis |
|-----|------|
| `/dashboard/content-quality` | Kvaliteta AI generirane vsebine |

### A/B Testi
| URL | Opis |
|-----|------|
| `/dashboard/ab-tests` | A/B testiranje |

### Audit Log
| URL | Opis |
|-----|------|
| `/dashboard/audit-log` | Log vseh aktivnosti |

---

## ⚙️ NASTAVITVE

### Glavne Nastavitve
| URL | Opis |
|-----|------|
| `/dashboard/settings` | Glavne nastavitve |
| `/dashboard/settings/brand-voice` | Brand voice nastavitve |
| `/dashboard/settings/sso` | SSO (Single Sign-On) |

### Organizations
| URL | Opis |
|-----|------|
| `/dashboard/organizations` | Upravljanje organizacij |

---

## 🚨 ESCALATIONS

### Escalations
| URL | Opis |
|-----|------|
| `/dashboard/escalations` | Escalacije in alerti |

---

## 📄 PAGE BUILDER

### Page Builder
| URL | Opis |
|-----|------|
| `/dashboard/page-builder` | Builder za landing strani |

---

## 🎤 SPECIALNI VMESNIKI

### Voice Assistant
| URL | Opis |
|-----|------|
| `/dashboard/tourism/voice-assistant` | Glasovni asistent |

### Photo Analysis
| URL | Opis |
|-----|------|
| `/dashboard/tourism/photo-analysis` | AI analiza fotografij |

### Sustainability
| URL | Opis |
|-----|------|
| `/dashboard/tourism/sustainability` | Trajnostni turizem |

### Messages
| URL | Opis |
|-----|------|
| `/dashboard/tourism/messages` | Sporočila gostov |

### Owner Portal
| URL | Opis |
|-----|------|
| `/dashboard/tourism/owner` | Owner portal - za lastnike |

---

## 🌍 DRUGI VMESNIKI

### Cemboljski Dashboard
| URL | Opis |
|-----|------|
| `/cemboljski/dashboard` | Simbolski dashboard (testni) |

### SEO Orodja
| URL | Opis |
|-----|------|
| `/dashboard/seo-tools` | SEO orodja |

### Approvals
| URL | Opis |
|-----|------|
| `/dashboard/approvals` | Odobritve rezervacij |

---

## 📱 MOBILE NAVIGATION (Bottom Bar)

| Ikona | Label | URL |
|-------|-------|-----|
| 🏠 | Domov | `/dashboard` |
| 📅 | Koledar | `/dashboard/tourism/calendar` |
| ✍️ | Ustvari | `/generate` |
| 📁 | Vsebina | `/content` |
| ⚙️ | Nastavitve | `/settings` |

---

## 🔑 GLAVNE NAVIGACIJSKE POTI

### Za receptorje:
```
/dashboard → /dashboard/receptor → /dashboard/receptor/quick-reservation
```

### Za managerje:
```
/dashboard → /dashboard/director → /dashboard/insights → /dashboard/reports/revenue
```

### Za content creatorje:
```
/dashboard → /dashboard/tourism/generate → /dashboard/tourism/templates
```

### Za lastnike nastanitev:
```
/dashboard → /dashboard/properties → /dashboard/properties/[id]
```

---

## 📊 ŠTEVILO VMESNIKOV

| Kategorija | Število |
|------------|---------|
| **Tourism Hub** | ~30 strani |
| **Properties** | ~8 strani |
| **Receptor** | ~8 strani |
| **Rezervacije** | ~5 strani |
| **Sobe** | ~4 strani |
| **AI/Workflow** | ~3 strani |
| **Analitika** | ~5 strani |
| **Nastavitve** | ~4 strani |
| **Specialni** | ~5 strani |
| **SKUPAJ** | **~75 strani** |

---

## 🎯 PRIPOROČILA ZA TESTIRANJE

### Kritične poti (P0):
1. `/dashboard` - Glavni entry point
2. `/dashboard/tourism` - Tourism hub
3. `/dashboard/receptor/quick-reservation` - Hitra rezervacija
4. `/dashboard/properties` - Upravljanje nastanitev
5. `/dashboard/tourism/calendar` - Koledar

### Pomembne poti (P1):
1. `/dashboard/tourism/generate` - AI generiranje
2. `/dashboard/tourism/email` - Email kampanje
3. `/dashboard/tourism/landing` - Landing pages
4. `/dashboard/workflows/builder` - Workflow builder
5. `/dashboard/settings` - Nastavitve

### Manj kritične (P2):
1. `/dashboard/insights` - Analytics
2. `/dashboard/ab-tests` - A/B testing
3. `/dashboard/tourism/voice-assistant` - Voice AI
4. `/dashboard/tourism/photo-analysis` - Photo AI

---

**Status:** ✅ Vsi dashboardi so dostopni preko `/dashboard/*` strukture
