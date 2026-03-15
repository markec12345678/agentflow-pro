# 🚀 HITRI TESTNI URL-JI - AgentFlow Pro

**Base URL:** `http://localhost:3002`

---

## 📋 KRITIČNI URL-JI (P0 - Testiraj vedno)

```
http://localhost:3002/
http://localhost:3002/login
http://localhost:3002/register
http://localhost:3002/pricing
http://localhost:3002/dashboard
http://localhost:3002/dashboard/tourism
http://localhost:3002/dashboard/receptor
http://localhost:3002/dashboard/properties
http://localhost:3002/dashboard/tourism/calendar
http://localhost:3002/dashboard/tourism/generate
```

---

## 🏨 TOURISM HUB URL-JI

### Glavni
```
http://localhost:3002/dashboard/tourism
http://localhost:3002/dashboard/tourism?mode=reception
http://localhost:3002/dashboard/director
```

### Rezervacije
```
http://localhost:3002/dashboard/tourism/calendar
http://localhost:3002/dashboard/tourism/inbox
http://localhost:3002/dashboard/tourism/guest-communication
http://localhost:3002/dashboard/tourism/arrivals
http://localhost:3002/dashboard/tourism/departures
```

### Generiranje
```
http://localhost:3002/dashboard/tourism/generate
http://localhost:3002/dashboard/tourism/bulk-generate
http://localhost:3002/dashboard/tourism/templates
```

### Email
```
http://localhost:3002/dashboard/tourism/email
http://localhost:3002/dashboard/tourism/notifications
```

### Landing & SEO
```
http://localhost:3002/dashboard/tourism/landing
http://localhost:3002/dashboard/tourism/seo
http://localhost:3002/dashboard/tourism/seo/search-console-setup
```

### Cene & Revenue
```
http://localhost:3002/dashboard/tourism/dynamic-pricing
http://localhost:3002/dashboard/tourism/revenue
http://localhost:3002/dashboard/tourism/competitors
```

### Integracije
```
http://localhost:3002/dashboard/tourism/eturizem-settings
http://localhost:3002/dashboard/tourism/booking-com
http://localhost:3002/dashboard/tourism/pms-connections
```

### Analitika
```
http://localhost:3002/dashboard/tourism/analytics
http://localhost:3002/dashboard/tourism/data-cleanup
```

### Ostalo
```
http://localhost:3002/dashboard/tourism/translate
http://localhost:3002/dashboard/tourism/itineraries
http://localhost:3002/dashboard/tourism/properties
http://localhost:3002/dashboard/tourism/use-cases
```

---

## 🏢 PROPERTIES URL-JI

### Glavni
```
http://localhost:3002/dashboard/properties
http://localhost:3002/dashboard/properties/create
```

### Property Detajli (zamenjaj [id] z dejanskim ID-jem)
```
http://localhost:3002/dashboard/properties/[id]
http://localhost:3002/dashboard/properties/[id]/rooms
http://localhost:3002/dashboard/properties/[id]/amenities
http://localhost:3002/dashboard/properties/[id]/pricing
http://localhost:3002/dashboard/properties/[id]/blocked-dates
http://localhost:3002/dashboard/properties/[id]/policies
http://localhost:3002/dashboard/properties/[id]/integrations
```

---

## 🛎️ RECEPTOR URL-JI

```
http://localhost:3002/dashboard/receptor
http://localhost:3002/dashboard/receptor/quick-reservation
http://localhost:3002/dashboard/receptor/calendar
http://localhost:3002/dashboard/receptor/arrivals
http://localhost:3002/dashboard/receptor/departures
http://localhost:3002/dashboard/receptor/real-time-rooms
http://localhost:3002/dashboard/receptor/rooms
http://localhost:3002/dashboard/receptor/guests/search
```

---

## 📊 REZERVACIJE URL-JI

```
http://localhost:3002/dashboard/reservations
http://localhost:3002/dashboard/reservations/[id]
http://localhost:3002/dashboard/reservations/check-in
http://localhost:3002/dashboard/reservations/check-out
http://localhost:3002/dashboard/reservations/payments
```

---

## 🧹 SOBE URL-JI

```
http://localhost:3002/dashboard/rooms
http://localhost:3002/dashboard/rooms/[id]
http://localhost:3002/dashboard/rooms/housekeeping
http://localhost:3002/dashboard/rooms/maintenance
```

---

## 🤖 AI & WORKFLOW URL-JI

```
http://localhost:3002/dashboard/workflows
http://localhost:3002/dashboard/workflows/builder
http://localhost:3002/dashboard/mcp-builder
http://localhost:3002/dashboard/chat
```

---

## 📈 ANALITIKA URL-JI

```
http://localhost:3002/dashboard/insights
http://localhost:3002/dashboard/reports/occupancy
http://localhost:3002/dashboard/reports/revenue
http://localhost:3002/dashboard/reports/guests
http://localhost:3002/dashboard/content-quality
http://localhost:3002/dashboard/ab-tests
http://localhost:3002/dashboard/audit-log
```

---

## ⚙️ NASTAVITVE URL-JI

```
http://localhost:3002/dashboard/settings
http://localhost:3002/dashboard/settings/brand-voice
http://localhost:3002/dashboard/settings/sso
http://localhost:3002/dashboard/organizations
```

---

## 🚨 OSTALI URL-JI

```
http://localhost:3002/dashboard/escalations
http://localhost:3002/dashboard/approvals
http://localhost:3002/dashboard/page-builder
http://localhost:3002/dashboard/seo-tools
```

---

## 🎤 SPECIALNI URL-JI

```
http://localhost:3002/dashboard/tourism/voice-assistant
http://localhost:3002/dashboard/tourism/photo-analysis
http://localhost:3002/dashboard/tourism/sustainability
http://localhost:3002/dashboard/tourism/messages
http://localhost:3002/dashboard/tourism/owner
```

---

## 🌍 JAVNI URL-JI (Ne zahtevajo login)

```
http://localhost:3002/
http://localhost:3002/login
http://localhost:3002/register
http://localhost:3002/pricing
http://localhost:3002/solutions
http://localhost:3002/stories
http://localhost:3002/docs
http://localhost:3002/contact
http://localhost:3002/onboarding
http://localhost:3002/forgot-password
http://localhost:3002/generate
http://localhost:3002/content
http://localhost:3002/settings
```

---

## 🧪 TESTNI SKRIPTI

### PowerShell - Hitri test vseh P0 URL-jev:
```powershell
$urls = @(
  "/", "/login", "/register", "/pricing", "/dashboard",
  "/dashboard/tourism", "/dashboard/receptor", "/dashboard/properties"
)
foreach ($url in $urls) {
  $response = Invoke-WebRequest -Uri "http://localhost:3002$url" -Method Head -TimeoutSec 5 -ErrorAction Stop
  Write-Host "$url : $($response.StatusCode)"
}
```

### curl - Test posameznega URL-ja:
```bash
curl -I http://localhost:3002/dashboard/tourism/calendar
```

---

## 📊 SKUPAJ

- **Tourism Hub:** 22 URL-jev
- **Properties:** 8 URL-jev
- **Receptor:** 8 URL-jev
- **Rezervacije:** 5 URL-jev
- **Sobe:** 4 URL-jev
- **AI/Workflow:** 4 URL-jev
- **Analitika:** 6 URL-jev
- **Nastavitve:** 4 URL-jev
- **Ostali:** 10 URL-jev
- **Javni:** 12 URL-jev

**SKUPAJ: ~83 URL-jev**

---

**Zadnji update:** 2026-03-12
