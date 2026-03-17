# 🎯 Simple Dashboard - Načrt

## Problem:
Uporabnik se izgubi. Preveč gumbov. Ne ve kaj najprej.

## Rešitev:
**En sam jasen flow** ki vodi od začetka do konca.

---

## 📊 Dashboard Flow:

### **Stanje 1: Nov Uporabnik (0% narejeno)**
```
┌─────────────────────────────────────┐
│  Dobrodošel!                        │
│                                     │
│  Začni tukaj →                     │
│  ┌──────────────────────────────┐  │
│  │ 1. Dodaj nastanitev         │  │
│  │    [Dodaj →]                 │  │
│  └──────────────────────────────┘  │
│                                     │
│  Ostalo (kasneje):                 │
│  - Rezervacije                     │
│  - Gostje                          │
│  - Statistika                      │
└─────────────────────────────────────┘
```

### **Stanje 2: Delno Narejeno (50%)**
```
┌─────────────────────────────────────┐
│  Napredek: 50% ✅                  │
│                                     │
│  ✅ Nastanitev dodana              │
│                                     │
│  Zdaj naredi to →                  │
│  ┌──────────────────────────────┐  │
│  │ 2. Ustvari opis sobe        │  │
│  │    [Generiraj z AI →]        │  │
│  └──────────────────────────────┘  │
│                                     │
│  Še čaka:                          │
│  - Email dobrodošlice              │
│  - Landing stran                   │
└─────────────────────────────────────┘
```

### **Stanje 3: Vse Končano (100%)**
```
┌─────────────────────────────────────┐
│  🎉 Vse pripravljeno!              │
│                                     │
│  Tvoja nastanitev je pripravljena: │
│  ✅ Hotel Park, Bled               │
│  ✅ Opis sobe generiran            │
│  ✅ Email template pripravljen     │
│  ✅ Landing stran objavljena       │
│                                     │
│  [Poglej Dashboard →]              │
│  [Ustvari Rezervacijo →]           │
└─────────────────────────────────────┘
```

---

## 🎯 Implementacija:

1. Preveri stanje uporabnika
2. Prikaži SAMO naslednji korak
3. Ko naredi, prikaži naslednji
4. Ko je vse narejeno, prikaži pravi dashboard

---

**Version:** 1.0.0
**Status:** Pripravljen za implementacijo
