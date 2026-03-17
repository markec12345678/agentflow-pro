# 🚀 QUICK START - OTA Applications & Tax System

**TL;DR:** Vse je pripravljeno. Samo kopiraj/prilepi in submitaj!

---

## 📋 TOREJ (17.03) - Booking.com

### **Hitri Koraki:**
```
1. Odpri: OTA-APPLICATION-PREPARED-ANSWERS.md
2. Pojdi na: "BOOKING.COM APPLICATION"
3. Izpolni svoje podatke:
   - Company Name: [Tvoje podjetje] d.o.o.
   - Registration: [Matična številka iz AJPES]
   - VAT ID: [DDV številka]
   - Address: [Tvoj naslov]
4. Izpolni 3-5 propertyjev
5. Kopiraj odgovore
6. Odpri: https://www.booking.com/connectivitypartners
7. Prilepi odgovore
8. Submit!
9. Shrani confirmation email
```

**Čas:** 60-90 minut
**Status:** ✅ Vse pripravljeno

---

## 📋 SREDA (18.03) - Airbnb

### **Hitri Koraki:**
```
1. Odpri: OTA-APPLICATION-PREPARED-ANSWERS.md
2. Pojdi na: "AIRBNB APPLICATION"
3. Izpolni svoje podatke (iste kot Booking.com)
4. Kopiraj odgovore
5. Odpri: https://www.airbnb.com/d/developer-platform
6. Prilepi odgovore
7. Submit!
8. Shrani confirmation email
```

**Čas:** 60-90 minut
**Status:** ✅ Vse pripravljeno

---

## 📋 ČETRTEK (19.03) - Tax System Setup

### **Hitri Setup:**
```bash
# 1. Namesti dependencies
npm install @react-pdf/renderer resend @react-email/components @react-email/render

# 2. Seedaj tax rates (40+ občin)
npx ts-node scripts/seed-tax-rates.ts

# 3. Zaženi teste
npm test -- tourist-tax

# 4. Konfiguraj email (Resend)
# - Odpri: https://resend.com
# - Ustvari API key
# - Dodaj v .env.local:
#   RESEND_API_KEY=re_xxxxx
```

**Čas:** 30-60 minut
**Status:** ✅ Koda pripravljena

---

## 📊 KLJUČNE DATOTEKE

| Datoteka | Kaj Je | Kdaj Uporabiš |
|----------|--------|---------------|
| `OTA-APPLICATION-PREPARED-ANSWERS.md` | Vsi odgovori za OTA | Torek-Sreda |
| `WEEK-1-OTA-SUBMISSION-PLAN.md` | Detajlen plan | Torek-Sreda |
| `TAX-INVOICE-SETUP.md` | Setup navodila | Četrtek |
| `WEEK-1-2-FINAL-STATUS.md` | Trenutni status | Kadar koli |

---

## 🎯 CHECKLIST

### **Torek:**
```
□ Booking.com application submitted
□ Confirmation email saved
□ Reference number noted
```

### **Sreda:**
```
□ Airbnb application submitted
□ Confirmation email saved
□ Reference number noted
□ PROJECT-MASTER-TRACKER.md updated
```

### **Četrtek:**
```
□ Dependencies installed
□ Tax rates seeded
□ Tests passing
□ Resend configured
```

### **Petek:**
```
□ Tax system tested
□ Invoice PDF tested
□ Email sending tested
□ UI components integrated
```

---

## 🆘 HELP

### **Kje so odgovori za OTA?**
→ `OTA-APPLICATION-PREPARED-ANSWERS.md`

### **Kako seedam tax rates?**
→ `npx ts-node scripts/seed-tax-rates.ts`

### **Kje dobim Resend API key?**
→ https://resend.com

### **Kako zaženem teste?**
→ `npm test -- tourist-tax`

---

## 📞 LINKI

- **Booking.com:** https://www.booking.com/connectivitypartners
- **Airbnb:** https://www.airbnb.com/d/developer-platform
- **Resend:** https://resend.com
- **AJPES:** https://www.ajpes.si/
- **eDavki:** https://edavki.durs.si/

---

## ✅ STATUS

| | Status |
|--|--------|
| **Implementation** | ✅ 100% |
| **OTA Templates** | ✅ 100% |
| **Tax System** | ✅ 100% |
| **Invoice System** | ✅ 100% |
| **Documentation** | ✅ 100% |
| **Booking.com Submit** | ⏳ Torej |
| **Airbnb Submit** | ⏳ Sreda |
| **Testing** | ⏳ Četrtek-Petek |

---

**Vse pripravljeno! Good luck! 🚀**

*Created: 2026-03-16*
