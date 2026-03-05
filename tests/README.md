# 🧪 AgentFlow Pro - Test Suite

**Kopirano iz starega projekta (C:\Users\admin\projects\fullstack\agentflow-pro)**  
**Datum:** 2026-03-04  
**Status:** Adaptirano za hotel management

---

## 📁 Testni Datoteke

### Testni Scripti
- ✅ `test_agentflow.py` - Osnovni E2E test (247 lines)
- ✅ `test_complete.py` - Polni test suite (13,357 lines) 
- ✅ `test_comprehensive.py` - Kompleksni testi (33,491 lines)
- ✅ `test_deep_functional.py` - Funkcionalni testi (26,645 lines)

### Testna Dokumentacija
- ✅ `COMPLETE_TEST_PLAN.md` - Popoln testni načrt (414 testov)
- ✅ `FINAL_TEST_REPORT.md` - Testno poročilo (75% pass rate)

### Testni Results
- ✅ `test-results/` - Mapa za shranjevanje rezultatov
- ✅ `screenshots/` - Screenshoti za debugging
- ✅ `videos/` - Video posnetki za analizo
- ✅ `har/` - Network capture datoteke

---

## 🚀 Uporaba

### Osnovni Testi
```bash
# Osnovni E2E test
python tests/test_agentflow.py

# Polni test suite
python tests/test_complete.py

# Kompleksni testi
python tests/test_comprehensive.py

# Funkcionalni testi
python tests/test_deep_functional.py
```

### Testni Pokritje
1. **Landing Page** - UI, navigacija, CTA gumbi
2. **Authentication** - GitHub login, protected routes
3. **Dashboard** - Layout, navigacija, analytics
4. **Agent Management** - CRUD operacije, chat
5. **Hotel Management** - Rezervacije, sobe, gostje
6. **API Endpoints** - Health, auth, session
7. **Responsive Design** - Mobile, tablet, desktop
8. **Performance** - Load times, API response
9. **Accessibility** - Alt tags, ARIA labels

---

## 🏨 Hotel Management Test Scenariji

### Receptor Dashboard
- [ ] Check-in/out procesi
- [ ] Room status real-time
- [ ] Nova rezervacija form
- [ ] Gostje na čakanju
- [ ] SOS funkcije

### Director Dashboard  
- [ ] Arrivals/Departures overview
- [ ] Revenue analytics
- [ ] Occupancy reports
- [ ] Staff management
- [ ] Pricing settings

### Room Management
- [ ] Sobni inventar
- [ ] Housekeeping schedule
- [ ] Maintenance requests
- [ ] Room assignment
- [ ] Status tracking

### Reservation System
- [ ] Create/edit rezervacije
- [ ] Check-in/out flow
- [ ] Payment processing
- [ ] Cancellation/refund
- [ ] Calendar integration

### Guest Database
- [ ] Guest search/filter
- [ ] Communication history
- [ ] Loyalty program
- [ ] Preferences/notes
- [ ] Stay history

---

## 📊 Testni Reporting

### Format
```json
{
  "test_date": "2026-03-04T...",
  "pass_rate": 85.5,
  "total_tests": 42,
  "passed": 36,
  "failed": 6,
  "screenshots": 12,
  "hotel_management_tests": {
    "receptor_dashboard": 8,
    "director_dashboard": 6,
    "room_management": 7,
    "reservations": 9,
    "guest_database": 5
  }
}
```

### Status Indicators
- 🟢 **85%+** - Excellent
- 🟡 **70-84%** - Good  
- 🔴 **<70%** - Needs improvement

---

## 🔧 Konfiguracija

### Environment Variables
```bash
# Test settings
TEST_BASE_URL="http://localhost:3000"
TEST_HEADLESS="false"  # Za debugging
TEST_VIDEO_RECORDING="true"
TEST_SCREENSHOTS="true"
```

### Playwright Setup
```bash
# Namesti Playwright
pip install playwright
playwright install chromium

# Zaženi testi
npm run test:e2e
```

---

## 🎯 Naslednji Koraki

1. **Adaptiraj** obstoječe testne scenarije za hotel module
2. **Dodaj** nove testne pokritje za receptor/direktorja
3. **Integriraj** v CI/CD pipeline
4. **Automatiziraj** regression testiranje
5. **Monitoriraj** test coverage in performance

**Cilj:** 90%+ pass rate za vse hotel management funkcije.
