# Workflow Templatei - Navodila za Uporabo

## 🎯 Kaj so Workflow Templatei?

Workflow templatei so **prednastavljeni avtomatizirani procesi** za turizem. Vsak template vsebuje:
- **Trigger** (sprožilec): kdaj se workflow zažene
- **Akcije**: kaj se zgodi ko se workflow sproži
- **Pogoji**: kdaj se akcije izvedejo

---

## 📋 Dostopni Templatei

### 1. Guest Communication (Gostne Komunikacije)

| Template | Trigger | Akcije | Težavnost |
|----------|---------|--------|-----------|
| **Avtomatski Check-in Opomnik** | 1 dan pred check-in | Email + SMS opomnik | Lahek |
| **Prošnja za Mnenje** | 1 dan po check-out | Email + WhatsApp za review | Lahek |
| **VIP Gost Obravnava** | Booking kreiran za Gold/Platinum gosta | Obvestilo osebju + priprava VIP paketa | Srednji |

### 2. Operations (Operacije)

| Template | Trigger | Akcije | Težavnost |
|----------|---------|--------|-----------|
| **Dodelitev Hišništva** | Check-out končan | Kreiraj task + obvesti hišništvo | Lahek |
| **eTurizem Sinhronizacija** | Vsako uro | Sync vseh rezervacij | Srednji |

### 3. Revenue (Prihodki)

| Template | Trigger | Akcije | Težavnost |
|----------|---------|--------|-----------|
| **Alert Za Nizko Zasedenost** | Zasedenost <30% v 7 dneh | Obvestilo direktorju + predlog promocije | Srednji |
| **Opomnik Za Plačilo** | 7 dni pred check-in, neporavnano | Email + SMS opomnik | Lahek |
| **Dinamično Prilagajanje Cen** | Vsak dan ob 6:00 | Analiza povpraševanja + prilagoditev cen | Napreden |

---

## 🚀 Kako Uporabiti Template

### Korak 1: Izberi Nastanitev
1. Odpri **Workflow Template Library** (`/dashboard/workflows/templates`)
2. Izberi nastanitev v **Property Selector**-ju (zgoraj desno)

### Korak 2: Izberi Template
1. Brskaj po kategorijah (Guest Communication, Operations, Revenue)
2. Uporabi iskalnik za iskanje po imenu
3. Klikni na kartico template-a za **preview**

### Korak 3: Uporabi Template
1. Klikni **"Uporabi"** na kartici ali **"Uporabi Template"** v preview dialogu
2. Sistem avtomatsko:
   - Kreira nov workflow iz template-a
   - Nastavi vse triggerje in akcije
   - Poveže z izbrano nastanitvijo

### Korak 4: Prilagodi Workflow
1. Sistem te preusmeri na `/dashboard/workflows/:id/edit`
2. Prilagodi:
   - Ime in opis
   - Trigger čase (npr. točen čas za SMS)
   - Vsebine sporočil
   - Pogoje

### Korak 5: Aktiviraj
1. Klikni **"Save"**
2. Preklopi status iz **Draft** → **Active**
3. Workflow se bo samodejno sprožil ob triggerju

---

## 💡 Primeri Uporabe

### Primer 1: Avtomatski Check-in Opomnik

**Namen:** Gostje dobijo navodila pred prihodom, manj vprašanj na recepciji.

**Nastavitev:**
1. Izberi template: **"Avtomatski Check-in Opomnik"**
2. Prilagodi email vsebino:
   - Dodaj specifična navodila za parkiranje
   - Dodaj WiFi geslo
   - Dodaj kontakt za nujne primere
3. Nastavi čas pošiljanja: **1 dan ob 10:00**
4. Aktiviraj workflow

**Rezultat:**
- ✅ Gost dobi email 24h pred check-inom
- ✅ Manj klicev na recepciji
- ✅ Boljša guest experience

---

### Primer 2: Prošnja za Mnenje

**Namen:** Več Google/TripAdvisor recenzij brez ročnega dela.

**Nastavitev:**
1. Izberi template: **"Prošnja za Mnenje"**
2. Prilagodi sporočilo:
   - Dodaj direktne link-e do Google/TripAdvisor
   - Dodaj popust za naslednjo rezervacijo
3. Nastavi trigger: **1 dan po check-outu ob 11:00**
4. Aktiviraj workflow

**Rezultat:**
- ✅ Avtomatsko zbiranje recenzij
- ✅ Več pozitivnih ocen
- ✅ Brez ročnega sledenja

---

### Primer 3: VIP Gost Obravnava

**Namen:** Posebna obravnava za zveste goste.

**Nastavitev:**
1. Izberi template: **"VIP Gost Obravnava"**
2. Definiraj VIP kriterije:
   - Loyalty tier: Gold ali Platinum
   - Ali: 3+ prejšnjih rezervacij
3. Prilagodi VIP paket:
   - Welcome drink
   - Pozno check-out
   - Osebno sporočilo
4. Aktiviraj workflow

**Rezultat:**
- ✅ Gost se počuti posebno
- ✅ Večja verjetnost ponovnega obiska
- ✅ Boljše recenzije

---

## 🔧 Spreminjanje Template-ov

### Kako Urediti Obstoječi Workflow?
1. Odpri `/dashboard/workflows`
2. Najdi workflow v seznamu
3. Klikni **"Edit"**
4. Spremeni vozlišča (nodes) in povezave (edges)
5. Shrani spremembe

### Kako Kreirati Nov Template?
1. Kreiraj workflow ročno v Workflow Builder-ju
2. Testiraj da deluje
3. Shrani kot template (opcija v prihodnosti)

---

## 📊 Spremljanje Učinkovitosti

### Metrike
- **Število sprožitev**: Kolikokrat se je workflow sprožil
- **Uspešnost**: % uspešno izvedenih workflow-ov
- **Prihranjen čas**: Ocena časa prihranjenega z avtomatizacijo

### Kje Videti?
- `/dashboard/workflows/:id/executions` - Seznam vseh izvedb
- `/dashboard/analytics` - Agregirane statistike

---

## ⚠️ Pomembna Opozorila

### Pred Aktivacijo
- ✅ Testiraj workflow z **manual trigger**-om
- ✅ Preveri da so vsa sporočila pravilna
- ✅ Nastavi **cooldown** da ne pošiljaš preveč sporočil

### Med Delovanjem
- 📊 Spremljaj prve izvedbe
- 🔔 Nastavi obvestila za napake
- 📝 Beležiti guest feedback

---

## 🆘 Podpora

### Pogoste Težave

**Workflow se ne sproži:**
- Preveri če je status **Active**
- Preveri če je trigger pravilno nastavljen
- Preveri log-e v `/dashboard/workflows/:id/executions`

**Sporočila se ne pošljejo:**
- Preveri če so nastavljeni email/SMS provider-ji
- Preveri če so gostje imeli vnesene kontakte
- Preveri če ni rate limitov

**Napaka pri kreiranju:**
- Osveži stran in poskusi ponovno
- Preveri če imaš izbrano nastanitev
- Kontaktiraj support če težava traja

---

## 📞 Kontakt

Za pomoč pri nastavitvi workflow-ov:
- 📧 Email: support@agentflow.pro
- 💬 Chat: `/dashboard/chat`
- 📚 Dokumentacija: `/dashboard/docs`
