# Profil lastnika / upravljavca – AgentFlow Pro

Referenčna dokumentacija za produktno pozicioniranje in roadmap. Primerjava potreb in izzivov posameznega tipa uporabnika z implementacijo AgentFlow Pro.

---

## 1. Pregledna tabela profila

| Tip | Potrebe | Izzivi | AgentFlow Pro – pokrito | Manjka |
|-----|---------|--------|-------------------------|--------|
| **Lastnik apartmaja (1–3 enote)** | Enostaven pregled prihodov/odhodov, izpis računov, sledenje plačilom | Ročno vodenje v Excelu, pozabljena plačila, zmeda pri komunikaciji | Koledar, plačila v modal, stanje dolga, Izpiši račun (PDF), plačilni opomini, email predloge, TodayOverview | Poenostavljen "danes" vhodni ekran |
| **Upravljavalec kampa (10–50 enot)** | Dnevni promet, turistična taksa, preprečevanje overbookinga, sezonske cene | Več kanalov rezervacij (Booking, Airbnb, direktno), ročno usklajevanje koledarjev | Widget dnevni promet, touristTax, overbooking opozorilo, sezonske cene (visoka/srednja/nizka), iCal sync, bulk import CSV/JSON, PMS (Mews) | Channel manager dvosmerna sinhronizacija, avtomatski sync z Booking/Airbnb |
| **Lastnik boutique hotela (20–100 sob)** | Finančni reporting, PMS integracija, avtomatizacija gostinske komunikacije | Osebje potrebuje jasna navodila, gostje pričakujejo hiter odziv, regulative (fiskalni računi) | Analytics, PMS connections, guest-communication (FAQ, mailto, WhatsApp linki), TodayOverview, invoice PDF | RevPAR/OKR reporting, fiskalni računi (EOR/FURS), role-based navodila |

### 1.1 Kaj lastnik DEJANSKO potrebuje (prioritete)

**Kritično** (brez tega lastnik ne more delovati)

| Potreba | Zakaj je kritična | Kako Receptor reši |
|---------|-------------------|--------------------|
| Pregled: kdo pride/odide danes | Priprava sob, ključi, pozdrav gosta | TodayOverview widget + Reception mode |
| Sledenje plačilom | Lastnik mora vedeti, kdo je plačal akontacijo, kdo dolguje | Payment model + modal za vnos plačil v koledarju |
| Izpis računa | Zakonska zahteva + profesionalnost | Invoice HTML (print-to-PDF prek brskalnika); ni EOR fiskalni |
| Turistična taksa | Obvezno poročanje občinam | Polje touristTax na rezervaciji, prikaz na računu; export za občino na roadmap |
| Preprečevanje overbookinga | Da ne razočara gosta in ne plača odškodnine | Conflict check pri ustvarjanju + opcija "Ustvari vseeno" |

**Pomembno** (poveča učinkovitost)

| Potreba | Zakaj je pomembna | Kako Receptor reši |
|---------|-------------------|--------------------|
| Sezonske cene | Večji prihodek v visoki sezoni, zapolnitev v nizki | seasonRates JSON + integracija v pricing engine |
| Dnevni pregled prometa | Hitra odločitev: Ali danes znižam ceno za proste sobe? | daily-revenue API + widget na dashboardu |
| Avtomatska obvestila (pre-arrival, check-in) | Manj ročnega dela, boljša izkušnja gosta | Cron email-scheduler (7 dni pred prihodom, 1 dan pred check-in, post-stay) + in-app obvestila z linkom |
| PMS povezava (Mews, Opera) | Sinhronizacija z Booking.com, Expedia | PmsConnection model + Mews sync adapter |

### 1.2 Dodana vrednost (konkurenčna prednost)

| Potreba | Zakaj je prednost | Kako Receptor reši |
|---------|-------------------|--------------------|
| AI predlog cen | Optimizacija prihodka brez ročnega analiziranja | price-recommendation API: calculatePrice + konkurenti + LLM predlog |
| WhatsApp komunikacija | Gostje raje pišejo kot kličejo | Channel (email/whatsapp), WhatsApp Cloud API adapter, wa.me linki v TodayOverview |
| Multi-property nadzor | En lastnik upravlja več nastanitev | getPropertyIdsForUser; TodayOverview, daily-revenue agregirata ob izbiri "Vse nastanitve" |
| Reception mode | Hitro delo na recepciji | localStorage persistenca + `?mode=reception`, poenostavljen UI |

---

## 2. Vrednost z AgentFlow Pro

### Lastnik apartmaja (1–3 enote)
**Besedilo:** Zamenjaj Excel z enim vmesnikom. Koledar prihodov/odhodov, plačila in računi v nekaj klikih. Predpripravljene predloge za emaile gostom.

- [Koledar](/dashboard/tourism/calendar) – prihodi, odhodi, nova rezervacija, plačila, izpis računa
- [Nastanitve](/dashboard/tourism/properties) – osnovni podatki nastanitve
- [Komunikacija](/dashboard/tourism/guest-communication) – predprihod, po odhodu, FAQ

### Upravljavalec kampa (10–50 enot)
**Besedilo:** Dnevni promet in turistična taksa v realnem času. Sezonske cene in opozorilo ob prekrivanju. iCal in bulk uvoz za usklajevanje z več kanali.

- [Tourism Overview](/dashboard/tourism) – widget dnevni promet
- [Koledar](/dashboard/tourism/calendar) – overbooking dialog, sezonske cene pri izračunu, bulk uvoz
- [Nastanitve](/dashboard/tourism/properties) – sezonske cene (visoka/srednja/nizka)
- [iCal Sync](/dashboard/tourism/calendar) – feed URL za channel managerje

### Lastnik boutique hotela (20–100 sob)
**Besedilo:** PMS povezava (Mews), gostinska komunikacija z AI odgovori in hitri linki (mailto, WhatsApp). Osnovni analytics in pripravljena integracija za več.

- [Komunikacija](/dashboard/tourism/guest-communication) – triagentni flow (Policy/Retrieval/Copy)
- [PMS Povezave](/dashboard/tourism/pms-connections) – Mews sync
- [Analytics](/dashboard/tourism/analytics) – metrike po nastanitvi
- [TodayOverview](/dashboard) – danes prihodi/odhodi, hitri linki

---

## 3. Referenčna matrika – Funkcija → Profil

| Funkcija | Apartmaj | Kamp | Boutique |
|----------|:--------:|:----:|:--------:|
| Koledar prihodov/odhodov | ✓✓ | ✓✓ | ✓ |
| Izpis računa (PDF) | ✓✓ | ✓✓ | ✓✓ |
| Sledenje plačilom | ✓✓ | ✓✓ | ✓✓ |
| Dnevni promet widget | ✓ | ✓✓ | ✓✓ |
| Turistična taksa | ✓ | ✓✓ | ✓✓ |
| Overbooking opozorilo | ✓ | ✓✓ | ✓ |
| Sezonske cene | ✓ | ✓✓ | ✓✓ |
| iCal / bulk uvoz | ✓ | ✓✓ | ✓ |
| PMS integracija | — | ✓ | ✓✓ |
| Guest communication (FAQ) | ✓ | ✓✓ | ✓✓ |
| Analytics / reporting | — | ✓ | ✓✓ |
| AI predloge vsebine | ✓ | ✓ | ✓ |

Legenda: ✓✓ primarni profil, ✓ uporabno, — manj pomembno

---

## 4. Roadmap prioritete (na podlagi vrzeli)

Predlagane implementacije za zapolnitev vrzeli:

| Prioritetnost | Funkcija | Opis | Profil |
|---------------|----------|------|--------|
| Srednja | Fiskalni računi (EOR) | Integracija z fiskalizacijo za Slovenijo | Boutique |
| Srednja | Channel manager dvosmerni sync | Dvosmerna sinhronizacija z Booking/Airbnb | Kamp |
| Nižja | Role-based navodila | Jasna navodila za recepcioniste | Boutique |
| Nižja | RevPAR / OKR reporting | Napredni finančni reporti | Boutique |

Povezava: [RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md](RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md) – prioritizirane implementacije in vizija.

---

## 5. Tehnična implementacija (kaj je dejansko implementirano)

| Avtomatizacija | Status | Datoteka |
|----------------|--------|----------|
| Pre-arrival emaili | Implementirano | `src/app/api/tourism/email-scheduler/route.ts` |
| Check-in navodila | Implementirano | email-scheduler (1 dan pred prihodom) |
| Dnevni overview | Implementirano | `src/app/api/tourism/today-overview/route.ts` |
| Turistična taksa | Implementirano | Reservation.touristTax, calendar, invoice; export za občino na roadmap |
| Plačilni reminderi | Implementirano | email-scheduler: cron ob outstanding > 0, max 1× na 3 dni, checkIn ±60 dni |
| Post-stay review request | Implementirano | email-scheduler: hvala + Google Maps link, Booking.com napotilo če channel |
| Overbooking opozorilo | Implementirano | `src/app/api/tourism/calendar/route.ts` (conflict check + Ustvari vseeno) |
| Sezonske cene | Implementirano | `src/lib/tourism/pricing-engine.ts`, Property.seasonRates, properties UI |
| PMS sinhronizacija | Implementirano | PmsConnection model, `pms-connections`, `pms-sync`, Mews adapter |
| AI predlog cen | Implementirano | `src/app/api/tourism/price-recommendation/route.ts` |
| Invoice izpis | Implementirano | `src/app/api/tourism/reservations/[id]/invoice/route.ts` (HTML print-to-PDF) |
