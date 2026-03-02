# 📋 Receptionist Guide - AgentFlow Pro

## 🎯 Receptionist Role

The receptionist is the **key operator** in the AgentFlow Pro system. Responsible for **daily reservation management** with **95% automation** and only **5% manual intervention** for exceptions.

---

## 📅 Daily Tasks (5-10 minutes)

### 🏨 1. Today's Reservations Overview
**URL**: `/reservations`

**What to check**:
- ✅ **Arrivals** - Number and times of arrivals today
- ✅ **Departures** - Number and times of departures today  
- ✅ **Special Requests** - Guest special requests
- ✅ **Room Status** - Room occupancy for today

**Quick Commands**:
- **Ctrl+F** → Quick search by name or date
- **Ctrl+A** → Select all for bulk actions
- **Space** → Quick approve (if content is OK)
- **Enter** → Open details of selected reservation

---

### 🔍 2. Pending Reservations
**URL**: `/reservations/pending`

**What to check**:
- ✅ **Auto-Approval Queue** - Reservations waiting for approval
- ✅ **Exception Cases** - Manual reviews if intervention needed
- ✅ **Risk Assessment** - High-risk reservations

**Processing Priority**:
1. **🟢 Low Risk** → Auto-approve (instant)
2. **🟡 Medium Risk** → Quick review (1-2 minutes)
3. **🔴 High Risk** → Director approval (manual intervention required)

---

### 👥 3. Guest Management
**URL**: `/guests`

**What to check**:
- ✅ **Active Guests** - Currently checked-in guests
- ✅ **Special Notes** - Allergies, special requests, notes
- ✅ **Communication History** - Previous contacts with guest
- ✅ **Loyalty Status** - Repeat guests, VIP status

**Quick Actions**:
- **Click na gosta** → Odpri profil z vsemi podatki
- **Message icon** → Takojšno pošlji sporočilo
- **Phone icon** → Kliči neposredno
- **Email icon** → Pošlji email

---

## 🔄 Proces Obdelave Rezervacij

### 📥 4. Obdelava Nove Rezervacije
**Standard Flow** (95% primerov):
1. **Prejmi rezervacijo** → Sistem avtomatsko preveri razpoložljivost
2. **Validiraj podatke** → Avtomatska validacija plačilne kartice, ID gostov
3. **Potrdi v 1 kliku** → Če je vse v redu, instant potrditev
4. **Pošlji potrditev** → Avtomatsko email z vsemi podrobnostmi

**Exception Handling** (5% primerov):
1. **High Value** (>€2000) → Director approval
2. **Last Minute** (<24h) → Manual review
3. **Blacklisted Guest** → Security check
4. **Full House** (>90% occupancy) → Alternative ponudba
5. **Unusual Pattern** → Fraud detection

---

## 🏨 Dnevni Scenariji

### ☀️ Jutranji Postopek (8:00-10:00)
1. **Preveri arrivals** - Gosti, ki prihajajo danes
2. **Pripravi sobe** - Status cleaning, special requests
3. **Potrdi check-ins** - Avtomatsko ali ročno za posebne primere
4. **Obdelaj special requests** - Dodatna posteljnina, otroške posteljnice

### 🌞 Popoldanski Postopek (14:00-16:00)
1. **Check new reservations** - Spremljaj nove prihode
2. **Process pending approvals** - Odobri čakajoče rezervacije
3. **Handle departures** - Organiziraj odhode gostov
4. **Update room status** - Real-time update zasedenosti

### 🌙 Večernji Postopek (20:00-22:00)
1. **Final check-outs** - Zagotovi, da vsi odhodi poteknejo
2. **Prepare tomorrow** - Pripravi seznam jutranjih prihodov
3. **Daily report** - Pregled današnjega poslovanja
4. **System backup** - Dnevno varovanje podatkov

---

## ⚡ Hitri Ukazi in Shortcuts

### Keyboard Shortcuts:
- **Ctrl+1** → Odpri reservations (danes)
- **Ctrl+2** → Odpri pending approvals
- **Ctrl+3** → Odpri guest search
- **Ctrl+4** → Odpri room status
- **Ctrl+5** → Odpri analytics
- **F5** → Osveži podatke
- **Esc** → Zapri popup/okno

### Mouse Shortcuts:
- **Double-click** → Odpri podrobnosti
- **Right-click** → Kontekstni meni (actions)
- **Scroll** → Hitro navigacija skozi sezname

---

## 📊 KPIji za Receptorja

### Operativni KPIji:
- **Processing Time**: **<2 minute** na rezervacijo
- **Accuracy Rate**: **>99%** brez napak
- **Customer Satisfaction**: **>4.5/5** povprečna ocena
- **Auto-Approval Rate**: **>95%** brez ročnega posega

### Dnevni Cilji:
- **Check-ins**: 100% do 10:00
- **Pending Processing**: <15 minut
- **Guest Queries**: <2 minute odziv
- **Room Updates**: Real-time status

---

## 🚨 Kritične Situacije

### Kdaj Ukrepiti Managerja:
- 🔴 **System Down** → Neposredno pokliči IT podporo
- 🔴 **Payment Failure** → Ročno procesiraj, obvesti gosta
- 🔴 **Overbooking** → Takojšno rešuj, ponudi alternativo
- 🔴 **Security Issue** → Sledi protokolu, obvesti varnost

### Emergency Protokoli:
1. **Stay Calm** → Ohranite profesionalnost
2. **Document Everything** → Zapisuj vse ukrepe
3. **Communicate Clearly** → Informatiraj vse udeležene
4. **Follow Up** → Potrdi rešitev z gostom

---

## 📱 Mobile Optimizacija

### Na Telefonu/Tabletu:
- **One-Hand Navigation** → Vsi ključni elementi dosegljivi z enim prstom
- **Quick Actions** → Veliki gumbi za pogoste akcije
- **Voice Support** → Goovene ukaze za hitro iskanje
- **Offline Mode** → Osnovni funkcije brez interneta

### Responsive Design:
- **Desktop** → Polni funkcionalnosti, multi-window
- **Tablet** → Prilagojen UI, touch optimized
- **Mobile** → Simplified UI, swipe gestures

---

## 🔄 Kontinuirano Učenje

### Vsak Teden:
1. **Review Performance** → Analiziraj čase obdelave
2. **Learn Shortcuts** → Izboljšaj hitrost delovanja
3. **Guest Feedback** → Upoštevaj povratne informacije
4. **Process Optimization** → Najdi hitrejše načine dela

### Vsak Mesec:
1. **Advanced Training** → Nove funkcije in features
2. **Cross-training** → Nauči osnove drugih vlog
3. **Best Practices** → Deljenje izkušenj z drugimi receptorji

---

## 📞 Komunikacija z Gostom

### Email Templates:
- **Welcome Email** → Potrditev rezervacije
- **Check-in Reminder** → 24h pred prihodom
- **Check-out Info** → Podatki za odhod
- **Thank You** → Hvala za bivanje

### Phone Etiketa:
- **Professional Greeting** → "Dobrodošli, AgentFlow Pro"
- **Clear Communication** → Jasne in kratke informacije
- **Problem Resolution** → "Takoj rešujem težavo"
- **Friendly Closing** → "Lepo vas pozdravljamo"

---

## 🎯 Naslednji Koraki

### 30-dnevni Razvojni Plan:
1. **Master System** → 100% poznavanje vseh funkcij
2. **Speed Improvement** → 50% hitrejša obdelava
3. **Guest Excellence** → 4.8+ povprečna ocena
4. **Team Leadership** → Vodenje novih receptorjev

### Career Path:
- **Senior Receptor** → 6+ mesecev izkušenj
- **Lead Receptor** → Vodja ekipe (3+ receptorjev)
- **Front Desk Manager** → Upravljanje recepcije
- **Operations Manager** → Celotna operacija objekta

---

## 📋 Dnevni Checklist

### ✅ Vsak Dan (5 min):
- [ ] Preveri arrivals za danes (9:00)
- [ ] Obdelaj pending rezervacije (10:00)
- [ ] Posodobi status sob (12:00)
- [ ] Pripravi odhode (16:00)
- [ ] Naredi dnevni report (22:00)

### ✅ Vsak Teden (30 min):
- [ ] Analiziraj performance (ponedeljek)
- [ ] Pregled gostovih feedback (torek)
- [ ] Optimiziraj procese (sreda)
- [ ] Team meeting (četrtek)
- [ ] Planiraj naslednji teden (petek)

---

## 🎉 Receptorjev Uspeh

### Kako Meriti Uspeh:
1. **Speed** → Hitrost obdelave rezervacij
2. **Accuracy** → Število napak na 100 rezervacij
3. **Guest Satisfaction** → Povprečne ocene od gostov
4. **Efficiency** → Število obdelanih rezervacij na uro
5. **Problem Resolution** → Čas reševanja težav

### Mesečni Cilji:
- **Processing Time**: <90 sekund na rezervacijo
- **Error Rate**: <0.5% na vse rezervacije
- **Guest Satisfaction**: >4.7/5 povprečno
- **Upsell Success**: >15% uspešnih dodatkov

---

*AgentFlow Pro - Receptorjev Vodnik za Efektivno in Avtomatizirano Delo*
