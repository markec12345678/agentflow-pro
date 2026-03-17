# 🏨 Hotel Management System - Popolni Zahtevi za Direktorja in Receptorja

## 📋 ANALIZ OBSTOJEČIH FUNKCIJ

### ✅ KAJ ŽE IMAMO (Implementirano):
- **Database Schema**: Room, Reservation, Guest, Property tabele
- **Director Dashboard**: `dashboard/director/` - overview, arrivals, departures
- **Calendar**: `dashboard/tourism/calendar/` - rezervacijski koledar
- **Inbox**: `dashboard/tourism/inbox/` - povpraševanja gostov
- **Guest Communication**: `dashboard/tourism/guest-communication/`
- **Analytics**: `dashboard/tourism/analytics/`
- **eTurizem Settings**: `dashboard/tourism/eturizem-settings/`
- **Booking.com Integration**: `dashboard/tourism/booking-com/`
- **Notifications**: `dashboard/tourism/notifications/`
- **User Roles**: ADMIN, EDITOR, VIEWER

---

## 🎯 KAJ MANJKA - PRIORITY LIST

### 🔴 KRITIČNO (Must Have - za takojšnjo uporabo):

#### 1. **RECEPTOR DASHBOARD** (Operativni center)
```
/dashboard/receptor/
├── Pregled danes (arrivals, departures, in-house)
├── Hitre akcije (check-in, check-out, room change)
├── Nova rezervacija (quick form)
├── Status sob (proste/zasedene real-time)
├── Gostje na čakanju (waiting list)
└── SOS funkcije (emergency contacts)
```

#### 2. **ROOM MANAGEMENT** (Sobni management)
```
/dashboard/rooms/
├── Sobni inventar (Room 101, Suite A, itd.)
├── Status sob (cleaning, maintenance, occupied)
├── Room assignment (avtomatsko za rezervacije)
├── Housekeeping schedule (čistilni plan)
├── Maintenance requests (popravila)
└── Room features (WiFi, AC, balcony, itd.)
```

#### 3. **RESERVATION MANAGEMENT** (Rezervacije)
```
/dashboard/reservations/
├── Vse rezervacije (pregled, iskanje, filtri)
├── Nova rezervacija (form za hitro vnos)
├── Edit rezervacije (sprememba datuma, sobe)
├── Cancel/Refund (preklic, povračilo)
├── Check-in/Check-out (procesi)
└── Payments (plačila, depoziti)
```

#### 4. **GUEST DATABASE** (Baza gostov)
```
/dashboard/guests/
├── Gostje (ime, email, phone, država)
├── History (preteklost rezervacij)
├── Preferences (sobna preferenca, alergije)
├── Notes (posebne želje, opombe)
├── Loyalty program (točke, popusti)
└── Communication (SMS, email zgodovina)
```

### 🟡 POMEBNO (Should Have - za operativno učinkovitost):

#### 5. **BILLING & PAYMENTS** (Plačilni sistem)
```
/dashboard/billing/
├── Računi (ustvari, pošlji, sledi)
├── Payments (kartično, gotovina, banka)
├── Deposits (akontacije)
├── Invoices (računi za podjetja)
├── Tax reporting (DDV, turistična taksa)
└── Revenue reports (prihodki po dnevih/tednih)
```

#### 6. **HOUSEKEEPING** (Hišni red)
```
/dashboard/housekeeping/
├── Daily schedule (čistilni plan)
├── Room status (clean, dirty, in-progress)
├── Staff management (čistilke, razpored)
├── Supplies (towel, soap, amenities)
├── Quality control (inspekcije)
└── Guest requests (additional towels, itd.)
```

#### 7. **REPORTING** (Poročila)
```
/dashboard/reports/
├── Occupancy reports (zasedenost)
├── Revenue reports (prihodki)
├── Guest statistics (demografija)
├── Channel performance (booking.com, direct)
├── ADR (Average Daily Rate)
└── RevPAR (Revenue Per Available Room)
```

### 🟢 NICE TO HAVE (Lahko kasneje):

#### 8. **MAINTENANCE** (Vzdrževanje)
```
/dashboard/maintenance/
├── Work orders (popravila)
├── Preventive maintenance (redni pregledi)
├── Vendor management (ponudniki)
├── Equipment tracking (naprave)
├── Cost tracking (stroški)
└── Compliance (varnost, inspekcije)
```

#### 9. **INVENTORY** (Skladišče)
```
/dashboard/inventory/
├── Supplies (hrana, pijača, čistila)
├── Linens (brisače, posteljnina)
├── Amenities (šampon, milo)
├── Stock levels (zaloge)
├── Ordering (naročanje)
└── Cost tracking (stroški)
```

---

## 👥 USER ROLES & PERMISSIONS

### 🏨 DIRECTOR (Management)
- **Vidi**: Vse (overview, analytics, reports)
- **Lahko**: Spremenja cene, nastavitve, approve rezervacije
- **Ne**: Operativne naloge (check-in, cleaning)

### 🛎️ RECEPTOR (Operativni)
- **Vidi**: Danes, rezervacije, gostje, sobe
- **Lahko**: Check-in/out, nova rezervacija, komunikacija
- **Ne**: Analytics, cene, system settings

### 🧹 HOUSEKEEPING (Čistilci)
- **Vidi**: Sobe, cleaning schedule
- **Lahko**: Update room status, request supplies
- **Ne**: Gostje, plačila, rezervacije

---

## 🔄 DAILY WORKFLOW

### 🌅 ZJUTRA (Receptor):
1. **Check arrivals** - kdo prihaja danes
2. **Room prep** - priprava sob za prihod
3. **Guest messages** - odgovori na povpraševanja
4. **New reservations** - vnos novih rezervacij

### 🌞 POPOLDNE (Receptor):
1. **Check-ins** - registracija gostov
2. **Guest requests** - posebne želje
3. **Room issues** - zamenjava sobe, popravila
4. **Payments** - zbiranje plačil

### 🌆 VEČER (Receptor):
1. **Check-outs** - odjava gostov
2. **Tomorrow prep** - priprava za jutri
3. **Daily report** - poročilo za direktorja
4. **Closing tasks** - zaključek dneva

### 📊 TEDEN (Direktor):
1. **Revenue review** - pregled prihodkov
2. **Occupancy analysis** - analiza zasedenosti
3. **Staff performance** - ocena zaposlenih
4. **Strategic decisions** - cene, marketing

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (2 tedna - MVP):
1. ✅ **Receptor Dashboard** - osnovni pregled
2. ✅ **Room Status** - real-time status sob
3. ✅ **Quick Reservation** - hitra rezervacija
4. ✅ **Guest List** - osnovna baza gostov

### Phase 2 (2 tedna - Core):
1. 🔄 **Calendar Integration** - povezava z obstoječim
2. 🔄 **Payment Processing** - osnovna plačila
3. 🔄 **Housekeeping Basic** - status sob
4. 🔄 **Daily Reports** - poročila

### Phase 3 (2 tedna - Advanced):
1. 📋 **Full Billing** - računi, DDV
2. 📋 **Advanced Analytics** - podrobni reporti
3. 📋 **Mobile App** - receptor mobile app
4. 📋 **API Integrations** - več kanalov

---

## 🎯 KONKRETNI NAPOTKI ZA PROGRAMERJA:

### 1. **Najprej naredi:**
```typescript
// Receptor Dashboard
/dashboard/receptor/page.tsx

// API endpoints
/api/receptor/daily-overview
/api/rooms/status
/api/reservations/quick-create
/api/guests/search
```

### 2. **Ključne funkcije:**
```typescript
// Real-time room status
function getRoomStatus(roomId: string): 'available' | 'occupied' | 'cleaning' | 'maintenance'

// Quick check-in
function quickCheckIn(reservationId: string): Promise<CheckInResult>

// Daily overview
function getDailyOverview(propertyId: string): Promise<DailyOverview>
```

### 3. **Database dodaj:**
```sql
-- Room status
ALTER TABLE Room ADD COLUMN status VARCHAR DEFAULT 'available';
-- Housekeeping
CREATE TABLE HousekeepingTask (...);
-- Maintenance
CREATE TABLE MaintenanceRequest (...);
```

---

## 💡 KLJUČNI USPEH FAKTORJI:

### ✅ MINIMAL CLICKS:
- Check-in: 3 kliki (iskanje → potrditev → ključi)
- Nova rezervacija: 1 minuta
- Status sob: Real-time brez refresh

### ✅ MOBILE FIRST:
- Receptor app za telefon
- QR code scan za check-in
- Push notifications za goste

### ✅ ERROR PREVENTION:
- Double booking prevention
- Payment validation
- Room conflict detection

### ✅ AUTOMATION:
- eTurizem sync
- Auto-email gostom
- Daily reports

---

## 🎯 ZAKLJUČEK:

**Kaj mora programer narediti:**
1. **Receptor Dashboard** - najbolj pomembno
2. **Room Management** - real-time status
3. **Quick Operations** - hitre akcije
4. **Guest Database** - osnovna baza
5. **Daily Workflow** - dnevni procesi

**Časovnica:** 4-6 tednov za MVP, 2-3 meseca za polno funkcionalnost.

**Prioriteta:** Receptor > Director > Admin (90% operacije, 10% management)
