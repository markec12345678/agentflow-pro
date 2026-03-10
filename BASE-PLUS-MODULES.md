# 🏨 AgentFlow Pro - Base + Module Sistem

## 🎯 Koncept

**Eno jedro za vse + specializirani moduli po tipu nastanitve.**

---

## 📊 Struktura:

### **Base Paket (Za Vse)**
```
Cena: 29€/mesec
Vključuje:
✅ Upravljanje rezervacij
✅ Koledar
✅ Gostje baza
✅ Osnovne statistike
✅ Email komunikacija
✅ Cene in availability
✅ eTurizem povezava
✅ Osnovne vsebine (AI)
```

### **Moduli (Dodatno)**

#### 🏨 Hotel Modul (+15€/mesec)
```
Za: Hotele, penezione, boutique hotele
Funkcije:
✅ Housekeeping management
✅ Room status (čisto/s umazano)
✅ Multi-property support
✅ Room service ordering
✅ Shift management
✅ Porčila po nadstropjih
```

#### ⛺ Kamp Modul (+15€/mesec)
```
Za: Kampinge, glamping resort-e
Funkcije:
✅ Parcelno upravljanje (A1, A2, B1...)
✅ Oprema (elektrika, voda, kanalizacija)
✅ Dnevne cene po sezoni
✅ Rezervacija opreme
✅ Sanitary facilities tracking
✅ Aktivnosti (kolesa, čolni...)
```

#### 🏡 Kmetija Modul (+15€/mesec)
```
Za: Turistične kmetije, vinotoče
Funkcije:
✅ Aktivnosti (jahanje, degustacije)
✅ Prodaja izdelkov (sir, vino, med)
✅ Doživetja booking
✅ Restavracija/miza
✅ Kolesa/aktivnosti rental
✅ Tour booking
```

#### 🏠 Apartma Modul (+10€/mesec)
```
Za: Apartmaje, sobe, studio
Funkcije:
✅ Poenostavljen interface
✅ Self check-in navodila
✅ Ključavnica codes
✅ Brez housekeeping
✅ Enostavnejša poročila
```

---

## 💰 Cenik:

| Paket | Cena | Letno | Prihranek |
|-------|------|-------|-----------|
| **Base** | 29€/mesec | 290€ | 2 meseca brezplačno |
| **Base + Hotel** | 44€/mesec | 440€ | 2 meseca brezplačno |
| **Base + Kamp** | 44€/mesec | 440€ | 2 meseca brezplačno |
| **Base + Kmetija** | 44€/mesec | 440€ | 2 meseca brezplačno |
| **Base + Apartma** | 39€/mesec | 390€ | 2 meseca brezplačno |
| **Base + Vsi** | 69€/mesec | 690€ | 2 meseca brezplačno |

---

## 🎯 Onboarding Flow:

### Korak 1: Prijava
```
Email + Geslo
→
```

### Korak 2: Tip Nastanitve
```
"Kakšen tip nastanitve imate?"

[🏨 Hotel]
[⛺ Kamp]
[🏡 Kmetija]
[🏠 Apartma]
[Drugo]

→
```

### Korak 3: Osnovni Podatki
```
Ime: _______________
Lokacija: _______________
Število sob/enot: _______________

→
```

### Korak 4: Prilagoditev
```
Glede na tip:

Hotel:
- Število nadstropij
- Housekeeping team size
- Room types

Kamp:
- Število parcel
- Tipi priključkov
- Sezona

Kmetija:
- Aktivnosti
- Prodaja izdelkov
- Restavracija

Apartma:
- Število apartmajev
- Self check-in?

→
```

### Korak 5: Končano!
```
✅ Račun ustvarjen
✅ Interface prilagojen
✅ Priporočeni moduli

[Na Dashboard] [Dodaj Module]
```

---

## 📊 Dashboard Prilagoditve:

### Base (Vsi Vidijo):
```
🏠 Pregled
📅 Koledar
🏨 Nastanitve
💰 Cene
📊 Statistika
👥 Gostje
⚙️ Nastavitve
```

### + Hotel:
```
Dodatno:
🧹 Housekeeping
📊 Po nadstropjih
🛎️ Room service
👥 Shifti
```

### + Kamp:
```
Dodatno:
🏕️ Parceles
⚡ Oprema
📅 Sezonski koledar
🚴 Aktivnosti
```

### + Kmetija:
```
Dodatno:
🍷 Degustacije
🐴 Aktivnosti
🧀 Prodaja
🍽️ Restavracija
```

### + Apartma:
```
Poenostavljeno:
- Manj menijev
- Self check-in navodila
- Enostavna statistika
```

---

## 🔧 Tehnična Izvedba:

### Database Schema:
```prisma
model Property {
  id             String @id @default(cuid())
  propertyType   String // "hotel", "kamp", "kmetija", "apartma"
  modules        Json?  // ["housekeeping", "parcels", "activities"]
  // ... ostali fieldi
}
```

### UI Logic:
```typescript
// Prikazi module glede na tip
const showModule = (type: string, module: string) => {
  if (type === 'hotel' && module === 'housekeeping') return true;
  if (type === 'kamp' && module === 'parcels') return true;
  if (type === 'kmetija' && module === 'activities') return true;
  if (type === 'apartma') return false; // poenostavljeno
  return false;
};
```

---

## 📈 Upsell Strategija:

### Ob Onboarding:
```
1. Uporabnik izbere tip
2. Sistem priporoči module
3. 14-dnevni trial za module
4. Po trialu: upgrade ali ostani Base
```

### Med Uporabo:
```
1. Usage tracking
2. Ko doseže limit → predlog upgrade
3. Feature gating (nekatere funkcije zaklenjene)
4. "Upgrade to unlock" gumbi
```

### Email Kampanje:
```
Day 1: Dobrodošel + Base features
Day 3: Ali ste vedeli? (Module features)
Day 7: Posebna ponudba (20% popust na module)
Day 14: Trial ends tomorrow
Day 15: Upgrade now
```

---

## 🎯 Roadmap:

### Faza 1 (Zdaj):
- ✅ Base sistem za vse
- ✅ Tip nastanitve v bazi
- ✅ Onboarding vprašanje
- ✅ Preprost interface

### Faza 2 (1-2 meseca):
- ⏳ Hotel modul
- ⏳ Kamp modul
- ⏳ Kmetija modul
- ⏳ Apartma modul

### Faza 3 (3-4 meseca):
- ⏳ Module pricing page
- ⏳ Upgrade flow
- ⏳ Usage tracking
- ⏳ Email avtomatizacije

---

## ✅ Prednosti:

```
✅ Ena koda (Base)
✅ Lahko začneš takoj
✅ Dodajaš module postopoma
✅ Upsell priložnosti
✅ Prilagodljivo za vsakega
✅ Ni preveč kompleksno na začetku
```

---

**Version:** 1.0.0
**Status:** ✅ Implementacija se začne
**Last Updated:** 2026-03-09
