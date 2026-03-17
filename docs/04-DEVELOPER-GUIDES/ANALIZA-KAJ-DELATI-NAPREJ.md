# 🎯 Analiza: Kaj Delati Naprej?

## 📊 Trenutno Stanje (Marec 2026)

### ✅ Kaj Je Že Narejeno:

#### 1. **Calendar API** ✅ (Refaktoriran)

- **Status:** 100% zaključeno
- **Use Cases:** `CreateReservationOrBlock`, `UpdateReservation`, `CancelReservationOrBlock`
- **Factory:** `UseCaseFactory` za DI
- **Testi:** Pripravljeni (PowerShell, Bash skripte)
- **API:** `/api/tourism/calendar` (GET, POST, PATCH, DELETE)

#### 2. **Availability Engine** ⚠️ (Delno narejeno)

- **Status:** 60% zaključeno
- **Use Cases:** `CheckAvailability`, `AllocateRoom`, `GetCalendar`
- **API:** `/api/tourism/availability` (refaktoriran, mock)
- **Manjka:**
  - Prava implementacija repository-jev
  - Integration z Booking.com/Airbnb
  - Dynamic pricing integration

#### 3. **Billing System** ⚠️ (Delno narejeno)

- **Status:** 50% zaključeno
- **Use Cases:** `GenerateInvoice`, `InvoiceManagement`, `ProcessPayment`, `CapturePayment`
- **API:** `/api/billing`, `/api/invoices` (mock)
- **Manjka:**
  - Stripe integration
  - Prava invoice generation
  - Payment processing

#### 4. **Channel Integrations** ⚠️ (Delno narejeno)

- **Status:** 40% zaključeno
- **Use Cases:** `SyncChannels`
- **API:** `/api/channels`, `/api/webhooks/booking-com`, `/api/tourism/airbnb/oauth`
- **Manjka:**
  - Booking.com API integration (production)
  - Airbnb API integration (production)
  - Channel manager UI
  - Real-time sync

#### 5. **Guest Experience (AI Concierge)** ❌ (Ni narejeno)

- **Status:** 10% (samo osnove)
- **API:** `/api/concierge` (basic)
- **Manjka:**
  - AI chatbot
  - Guest messaging
  - Recommendations
  - Local guides

#### 6. **Mobile App** ❌ (Ni narejeno)

- **Status:** 0%
- **Manjka:**
  - React Native/Expo setup
  - Mobile UI components
  - Push notifications
  - Offline support

---

## 🔍 Podrobna Analiza Opcij

### A) Availability Engine Features

**Trenutni Status:** 60%

```
✅ CheckAvailability use case
✅ AllocateRoom use case
✅ GetCalendar use case
⚠️ AvailabilityRepository (delno)
❌ Dynamic pricing integration
❌ Real-time availability sync
```

**Kaj Je Treba Narediti:**

1. Dokončati `AvailabilityRepositoryImpl`
2. Integrirati z `CalculateDynamicPrice` use case-om
3. Dodati caching za availability queries
4. Implementirati overbooking protection
5. Dodati room allocation algorithms

**Čas:** 2-3 dni
**Prioriteta:** ⭐⭐⭐⭐⭐ (Critical)
**Vpliv:** Brez tega ne moreš imeti delujočih rezervacij

**Prednosti:**

- ✅ Kritično za core business
- ✅ Uporablja se v vseh rezervacijah
- ✅ Vpliva na revenue

**Slabosti:**

- ❌ Kompleksno (date ranges, room types)
- ❌ Zahteva dobro testiranje

---

### B) Billing System Enhancements

**Trenutni Status:** 50%

```
✅ GenerateInvoice use case
✅ InvoiceManagement use case
✅ ProcessPayment use case
✅ CapturePayment use case
⚠️ InvoiceRepository (mock)
⚠️ PaymentRepository (mock)
❌ Stripe integration
❌ PDF generation
```

**Kaj Je Treba Narediti:**

1. Implementirati `InvoiceRepositoryImpl`
2. Dodati Stripe payment integration
3. Implementirati PDF invoice generation
4. Dodati recurring billing
5. Implementirati tax calculation

**Čas:** 3-4 dni
**Prioriteta:** ⭐⭐⭐⭐ (High)
**Vpliv:** Brez plačil ni revenue-a

**Prednosti:**

- ✅ Direct revenue impact
- ✅ Clear ROI
- ✅ Enostavnejše za implementirati kot availability

**Slabosti:**

- ❌ Zahteva PCI compliance
- ❌ Kompleksni tax rules

---

### C) Guest Experience (AI Concierge)

**Trenutni Status:** 10%

```
⚠️ Basic concierge API
❌ AI chatbot
❌ Guest messaging
❌ Recommendations engine
❌ Local guides
❌ Multi-language support
```

**Kaj Je Treba Narediti:**

1. Implementirati AI chatbot (Claude/Gemini)
2. Dodati guest messaging (email, SMS, WhatsApp)
3. Implementirati recommendations engine
4. Dodati local guides database
5. Implementirati multi-language support

**Čas:** 5-7 dni
**Prioriteta:** ⭐⭐⭐ (Medium)
**Vpliv:** Izboljša guest satisfaction

**Prednosti:**

- ✅ "Wow" faktor za goste
- ✅ Diferenciacija od konkurence
- ✅ AI-powered (trendy)

**Slabosti:**

- ❌ Ni kritično za launch
- ❌ Zahteva AI API keys (strošek)
- ❌ Kompleksno (NLP, multi-language)

---

### D) Mobile App Development

**Trenutni Status:** 0%

```
❌ React Native/Expo setup
❌ Mobile UI
❌ Push notifications
❌ Offline support
❌ Biometric auth
```

**Kaj Je Treba Narediti:**

1. Setup React Native + Expo
2. Implementirati osnovne screen-e (Login, Dashboard, Calendar)
3. Dodati API integration
4. Implementirati push notifications
5. Dodati offline support

**Čas:** 10-14 dni
**Prioriteta:** ⭐⭐ (Low za zdaj)
**Vpliv:** Izboljša UX za property managerje

**Prednosti:**

- ✅ Modern UX
- ✅ On-the-go access
- ✅ Push notifications

**Slabosti:**

- ❌ Zelo časovno zahtevno
- ❌ Ni kritično za web launch
- ❌ Vzdrževanje dveh platform

---

### E) Booking.com / Airbnb Integracije

**Trenutni Status:** 40%

```
✅ OAuth za Airbnb
✅ Webhook handler za Booking.com
✅ SyncChannels use case
⚠️ Channel API clients (mock)
❌ Production API integrations
❌ Rate limiting
❌ Error handling
❌ Mapping sob
```

**Kaj Je Treba Narediti:**

1. **Booking.com:**
   - Implementirati Booking.com API client
   - Dodati push availability
   - Dodati pull bookings
   - Implementirati rate updates
2. **Airbnb:**
   - Implementirati Airbnb API client
   - Dodati iCal sync
   - Dodati booking import
   - Implementirati smart pricing

3. **Channel Manager:**
   - UI za connected channels
   - Sync status dashboard
   - Error handling & retry logic
   - Mapping sob med kanali

**Čas:** 5-7 dni
**Prioriteta:** ⭐⭐⭐⭐⭐ (Critical)
**Vpliv:** Brez tega nimaš multi-channel booking-a

**Prednosti:**

- ✅ **KRITIČNO za tourism business**
- ✅ Multi-channel = več booking-ov
- ✅ Avtomatizacija (ni manualnega vnašanja)
- ✅ Real-time sync (prepreči overbooking)

**Slabosti:**

- ❌ Kompleksne API integracije
- ❌ Zahteva API approval (Booking.com partner program)
- ❌ Rate limiting in quota management

---

## 🎯 Priporočilo

### 🥇 **PRVA PRIOIRTETA: E) Booking.com / Airbnb Integracije**

**Zakaj:**

1. **Critical Path:** Brez channel integracij ne moreš imeti pravih booking-ov
2. **Revenue Impact:** Več kanalov = več vidnosti = več booking-ov
3. **Overbooking Prevention:** Ročno vnašanje = napake = double bookings
4. **Competitive Advantage:** Večina hotelov ima 3+ channel-ov

**Kaj Točno Narediti:**

```
Week 1:
- [ ] Booking.com API client (production)
- [ ] Push availability endpoint
- [ ] Pull bookings webhook
- [ ] Channel manager UI (basic)

Week 2:
- [ ] Airbnb API client (production)
- [ ] iCal two-way sync
- [ ] Rate updates
- [ ] Error handling & retry logic
```

**Čas:** 5-7 dni
**Vpliv:** ⭐⭐⭐⭐⭐

---

### 🥈 **DRUGA PRIORITETA: A) Availability Engine**

**Zakaj:**

1. Needed for channel integrations
2. Core business logic
3. Preprečuje overbooking

**Kaj Točno Narediti:**

```
- [ ] Dokončati AvailabilityRepositoryImpl
- [ ] Integrirati z dynamic pricing
- [ ] Dodati caching layer
- [ ] Testirati date range scenarios
```

**Čas:** 2-3 dni
**Vpliv:** ⭐⭐⭐⭐⭐

---

### 🥉 **TRETJA PRIORITETA: B) Billing System**

**Zakaj:**

1. Revenue collection
2. Professional invoicing
3. Payment processing

**Kaj Točno Narediti:**

```
- [ ] Stripe integration
- [ ] PDF invoice generation
- [ ] Recurring billing
- [ ] Tax calculation
```

**Čas:** 3-4 dni
**Vpliv:** ⭐⭐⭐⭐

---

### 4️⃣ **ČETRTA PRIORITETA: C) Guest Experience**

**Zakaj kasneje:**

1. Ni kritično za launch
2. Zahteva AI stroške
3. Lahko manualno na začetku

**Čas:** 5-7 dni
**Vpliv:** ⭐⭐⭐

---

### 5️⃣ **PETA PRIORITETA: D) Mobile App**

**Zakaj nazadnje:**

1. Web-first pristop je boljši
2. Najprej validiraj business
3. Mobile je "nice to have"

**Čas:** 10-14 dni
**Vpliv:** ⭐⭐

---

## 📋 Akcijski Načrt

### Teden 1-2: Channel Integrations (CRITICAL)

```
Day 1-2: Booking.com API
- [ ] Booking.com API client implementation
- [ ] Push availability endpoint
- [ ] Pull bookings webhook
- [ ] Test environment setup

Day 3-4: Airbnb API
- [ ] Airbnb API client implementation
- [ ] iCal two-way sync
- [ ] Booking import
- [ ] Test environment setup

Day 5: Channel Manager UI
- [ ] Connected channels list
- [ ] Sync status
- [ ] Manual sync button
- [ ] Error display
```

### Teden 3: Availability Engine

```
Day 1-2: Repository
- [ ] AvailabilityRepositoryImpl complete
- [ ] Check availability queries
- [ ] Blocked dates handling

Day 3: Integration
- [ ] Dynamic pricing integration
- [ ] Caching layer
- [ ] Performance optimization
```

### Teden 4: Billing System

```
Day 1-2: Payments
- [ ] Stripe integration
- [ ] Payment processing
- [ ] Webhook handling

Day 3-4: Invoices
- [ ] PDF generation
- [ ] Email delivery
- [ ] Tax calculation
```

---

## 🎯 Končno Priporočilo

**ZAČNI Z: E) Booking.com / Airbnb Integracije**

**Razlogi:**

1. ✅ **Najvišji business vpliv** (več booking-ov)
2. ✅ **Kritično za launch** (brez tega ne moreš delovati)
3. ✅ **Preprečuje overbooking** (critical problem)
4. ✅ **Avtomatizacija** (ni manualnega dela)

**Prvi Koraki:**

1. Odpri `src/app/api/channels/route.ts`
2. Implementiraj `ChannelRepositoryImpl`
3. Dodaj Booking.com API client
4. Testiraj v sandbox environment

**Čas do MVP:** 5-7 dni
**Business Value:** ⭐⭐⭐⭐⭐

---

**ODLOČITEV: Začni z Option E (Channel Integrations)!** 🚀
