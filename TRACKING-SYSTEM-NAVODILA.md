# 📊 PROJECT TRACKING SYSTEM - NAVODILA

## 🎯 NAMEN

Ta sistem ti pomaga **spremljati vse naloge** za AgentFlow Pro projekt da:
- ✅ Nič ne pozabiš
- ✅ Vidiš napredek vsak teden
- ✅ Lažje delegiraš naloge
- ✅ Spremljaš roke in prioritete

---

## 📁 DATOTEKE

### 1. **PROJECT-MASTER-TRACKER.md** ⭐
**Glavni tracker - VIR RESNICE**

**Kdaj odpreti:**
- Enkrat na teden (ponedeljek 9:00 AM planning)
- Enkrat na teden (petek 4:00 PM demo/review)
- Ko dodaš novo funkcijo
- Ko se spremeni prioriteta

**Kaj vsebuje:**
- 📊 Executive Dashboard (pregled napredka)
- 🔴 Priority Matrix (vse naloge po prioritetah)
- 📅 Sprint Plan (90 dni do launcha)
- ✅ Feature Checklist (kaj je narejeno)
- 🎯 Responsibility Matrix (kdo kaj dela)
- 🚨 Risk Register (kaj lahko gre narobe)

**Kako posodabljati:**
1. Odpri datoteko
2. Najdi sekcijo ki jo želiš posodobiti
3. Spremeni status ikone:
   - ⚪ Not Started → 🟡 In Progress → 🟢 Complete
4. Posodobi % completion
5. Shrani

---

### 2. **WEEKLY-CHECKLIST-TEMPLATE.md** 📋
**Tedenski checklist**

**Kdaj uporabiti:**
- Vsak ponedeljek zjutraj (planning)
- Vsak dan (opcionalno standup)
- Vsak petek popoldne (review)

**Kako uporabiti:**
1. Kopiraj template v `WEEK-[NUMBER]-[DATE].md`
   - Primer: `WEEK-12-2026-03-16.md`
2. Izpolni Top 3 Prioritete za ta teden
3. Vsak dan kratko posodobi (2 min)
4. Petek: Review in ocena tedna
5. Shrani v `archives/2026/` mapo

---

### 3. **FEATURE-TRACKER.csv** 📊
**Excel-compatible tabela**

**Kdaj uporabiti:**
- Ko želiš vizualni pregled vseh funkcij
- Ko rabiš filtrirati po prioriteti/lastniku/statusu
- Ko rabiš exportirati v Excel/Google Sheets

**Kako uporabiti:**
1. Odpri v Excelu ali Google Sheets
2. Filtriraj po:
   - Priority (P0/P1/P2/P3)
   - Status (Not Started/In Progress/Complete)
   - Owner (kdo je odgovoren)
   - Deadline (kaj je urgentno)
3. Posodobi % completion
4. Shrani

**Excel Formulas:**
```
Completion Rate: =AVERAGE(D2:D100)
On Track: =IF(H2>=TODAY(),"✅ On Track","🔴 Behind")
Overdue: =IF(AND(H2<TODAY(),G2<100%),"🚨 Overdue","✅ OK")
```

---

## 🔄 WEEKLY RHYTHM

### **Ponedeljek 9:00 AM (30 min)**

**Planning Meeting:**

1. **Odpri PROJECT-MASTER-TRACKER.md** (5 min)
   - Preglej P0 naloge za ta teden
   - Preveri deadline-e
   - Identificiraj blockerje

2. **Izpolni WEEKLY-CHECKLIST.md** (15 min)
   - Zapiši Top 3 Prioritete
   - Dodeli naloge lastnikom
   - Nastavi realne roke

3. **Potrdi z teamom** (10 min)
   - Vsak pove kaj dela ta teden
   - Identificiraj overlap/dependencies
   - Dogovorite se za komunikacijo

---

### **Vsak Dan (Opcionalno, 15 min)**

**Async Standup:**

V Slack/WhatsApp zapiši:
```
Yesterday: [kaj si naredil]
Today: [kaj boš delal]
Blockers: [če kaj rabiš pomoč]
```

Primer:
```
Yesterday: Completed tax reporting module
Today: Starting invoicing system
Blockers: Need Pantheor API docs
```

---

### **Petek 4:00 PM (60 min)**

**Demo & Review:**

1. **Feature Demos** (30 min)
   - Pokaži kar je bilo narejeno
   - Vsak feature max 10 min
   - Feedback in vprašanja

2. **Weekly Review** (20 min)
   - Odpri WEEKLY-CHECKLIST.md
   - Oceni teden (1-5 stars)
   - Zapiši lessons learned
   - Identificiraj carry-over tasks

3. **Next Week Preview** (10 min)
   - Kaj pride naslednji teden
   - Any major milestones?
   - Potrebna dodatna pomoč?

---

## 📊 STATUS IKONE

### Uporabljaj te ikone za konsistentnost:

**Progress:**
- ⚪ Not Started (0%)
- 🟡 In Progress (25-75%)
- 🟢 Complete (100%)
- 🔴 Blocked (needs attention)

**Priority:**
- P0 = Critical (must have)
- P1 = Major (important)
- P2 = Moderate (nice to have)
- P3 = Minor (future)

**Timeline:**
- ✅ On Track (deadline bo dosežen)
- ⚠️ At Risk (lahko zamudi)
- 🚨 Overdue (že zamujeno)

---

## 🎯 BEST PRACTICES

### ✅ DO:
- Posodobi tracker **vsak teden** (ponedeljek + petek)
- Bodi **specifičen** pri taskih (ne "Fix stuff" ampak "Fix Rust pricing engine compilation")
- Dodeli **enega ownerja** na task (ne team)
- Nastavi **realne roke** (better under-promise, over-deliver)
- **Proslavi milestone-e** (ko dosežeš cilj!)

### ❌ DON'T:
- Ne pozabi posodobiti trackerja (potem ni koristen)
- Ne delaj prevelikih taskov (razbij na <2 dni dela)
- Ne dodeljuj taskov brez ownerja
- Ne ignoriraj rdečih statusov (reši blockerje takoj)
- Ne pozabi proslaviti uspehov!

---

## 📱 KOMUNIKACIJA

### Priporočeni Kanali:

**Slack/WhatsApp:**
```
#agentflow-general
  - Vse announce-e
  - Milestone celebrations
  - Pilot property updates

#agentflow-dev
  - Technical discussions
  - Code review requests
  - Bug reports

#agentflow-pilot
  - Property feedback
  - Onboarding questions
  - Support requests
```

**Email:**
- Weekly summary (petek)
- Major decisions
- External communication (OTA partnerships, pilot properties)

**Meetings:**
- Monday 9:00 AM: Planning (30 min)
- Friday 4:00 PM: Demo & Review (60 min)
- Daily: Optional standup (15 min, async)

---

## 🚨 KDAJ POSODOBITI TRACKER

### Takoj posodobi ko:
- ✅ Feature je 100% complete
- 🚨 Task je blocked (rabi pomoč)
- 📅 Deadline se spremeni
- 👤 Owner se spremeni
- 🎯 Priority se spremeni (P1 → P0)

### Ne pozabi posodobiti:
- Vsak ponedeljek (planning)
- Vsak petek (review)
- Pred vsakim meetingom
- Po vsakem demo-ju

---

## 📈 METRIKE ZA SPREMLJANJE

### Tedenske Metrike:
- Tasks Completed This Week
- Tasks Carried Over
- Blockers Resolved
- Features Shipped

### Mesečne Metrike:
- Overall Completion %
- On-Time Delivery Rate
- Pilot Properties Onboarded
- Paying Customers
- MRR (Monthly Recurring Revenue)

### Quarterly Metrike:
- Revenue vs Target
- Customer Satisfaction (NPS)
- Team Velocity
- Market Share

---

## 🎉 MILESTONE TEMPLATE

Ko dosežeš milestone, zapiši:

```markdown
## 🎉 MILESTONE ACHIEVED: [Name]

**Date:** YYYY-MM-DD  
**Owner:** @person  
**Team:** [who was involved]

### What We Accomplished
[2-3 sentences describing what was done]

### Impact
[why this matters - e.g., "Now we can onboard pilot properties"]

### Lessons Learned
- What went well:
- What could be better:

### Next Steps
[what comes next based on this milestone]

### Celebration
[how did you celebrate? 🍕🍾🎉]
```

---

## 🔗 QUICK LINKS

- [Master Tracker](./PROJECT-MASTER-TRACKER.md)
- [Weekly Checklist](./WEEKLY-CHECKLIST-TEMPLATE.md)
- [Feature Tracker CSV](./FEATURE-TRACKER.csv)
- [README](./README.md)
- [AGENTS.md](./AGENTS.md)

---

## ❓ FAQ

**Q: Kako pogosto moram posodabljati tracker?**  
A: Minimum enkrat na teden (ponedeljek + petek). Daily updates so opcionalni.

**Q: Kaj če nimam časa za tracking?**  
A: Tracker ti prihrani čas! 30 min na teden planning + 60 min review = manj stresa, boljši pregled.

**Q: Kako delim naloge z drugimi?**  
A: V trackerju dodeli "Owner" polje. Vsak task ima enega ownerja.

**Q: Kaj če zamujamo z rokom?**  
A: Posodobi status v 🔴 Overdue. Identificiraj blockerje. Prilagodi rok ali dodaj vire.

**Q: Ali moram uporabljati vse 3 datoteke?**  
A: Ne. Master Tracker je obvezen. Weekly Checklist in CSV sta opcionalna ampak koristna.

---

## 📞 PODPORA

Če rabiš pomoč s tracking sistemom:
- Preberi to dokumentacijo
- Vprašaj v #agentflow-general
- Kontaktiraj Project Lead

---

**Happy Tracking! 🚀**

*Last Updated: 2026-03-15*
