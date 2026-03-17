# Research Index – Pregled raziskav in analiz

Kratki pregled raziskav v projektu. Katero uporabiti pri konkretnih odločitvah.

---

## Dokumenti

| Dokument | Referenčni vir | Glavni fokus | Ciljna publika |
|----------|----------------|--------------|----------------|
| [JASPER-GAP-ANALYSIS](JASPER-GAP-ANALYSIS.md) | Jasper (komercialni produkt) | Feature parity, konkurenčna pozicija | Product, marketing, UX |
| [AGENTFLOW-ECOSYSTEM-COMPARISON](AGENTFLOW-ECOSYSTEM-COMPARISON.md) | Akademska raziskava (agentični framework) | Arhitektura, tehnični roadmap | CTO, arhitekti, razvoj |
| [RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP](RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md) | Internal comparison (koda vs. raziskava) | Gap raziskava vs. implementacija, roadmap | Product, development |
| **[RAZISKAVA-ARHITEKTURA-ANALIZA](RAZISKAVA-ARHITEKTURA-ANALIZA.md)** | **Uporabnikova raziskava "Arhitekturna zasnova"** | **Detajlna primerjava z implementacijo, gap analiza** | **CTO, Product, razvoj** |
| **[RAZISKAVA-IMPLEMENTACIJA-REFERENCE](RAZISKAVA-IMPLEMENTACIJA-REFERENCE.md)** | **Hitra referenca** | **Statusni pregled (✅/⚠️/❌/🔮), kdaj kateri dokument** | **Vsi** |
| **[EXECUTIVE-SUMMARY-RAZISKAVA](EXECUTIVE-SUMMARY-RAZISKAVA.md)** | **Executive summary** | **Ključni zaključki, prioritete, roadmap** | **CTO, Product Manager** |
| Od MVP do Robustnega SaaS (PDF) | PDF v `agentflow-pro/` | Produkcijska robustnost, arhitektura, hreflang, Booking.com, load test, LangSmith | Product, CTO, razvoj |
| Od Avtomatizacije Nalog do Autonomnih Tokov (PDF) | Analiza kode, commitov | Strategija BPA, HITL nadgradnja, operativna priporočila | Product, CTO, razvoj |

---

## Kdaj katero uporabiti

| Vprašanje | Dokument |
|-----------|----------|
| Kaj manjka glede na Jasper? | JASPER-GAP-ANALYSIS |
| Kako razvijati arhitekturo? | AGENTFLOW-ECOSYSTEM-COMPARISON |
| Product roadmap, features? | JASPER-GAP-ANALYSIS |
| Tehnični roadmap, Verifier, LangGraph? | AGENTFLOW-ECOSYSTEM-COMPARISON |
| Konkurenčna primerjava? | JASPER-GAP-ANALYSIS |
| Strateška smer, RL, memory? | AGENTFLOW-ECOSYSTEM-COMPARISON |
| Kaj popraviti v raziskavi? | RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP |
| Kakšne so prioritete implementacije? | RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP |
| Roadmap glede na raziskavo? | RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP |
| **Detajlna primerjava z uporabnikovo raziskavo?** | **RAZISKAVA-ARHITEKTURA-ANALIZA** |
| **Hiter statusni pregled (kaj je implementirano)?** | **RAZISKAVA-IMPLEMENTACIJA-REFERENCE** |
| **Executive summary za CTO/Product?** | **EXECUTIVE-SUMMARY-RAZISKAVA** |
| Strategija avtomatizacije, BPA workflows, HITL nadgradnja? | Od Avtomatizacije Nalog (PDF) |

---

## Povzetek

- **JASPER-GAP-ANALYSIS:** Konkurenčna pozicija, skoraj pariteta; ostane Salesforce, admin controls. Za praktično produktno delo.
- **AGENTFLOW-ECOSYSTEM-COMPARISON:** Arhitekturna primerjava, predlogi za Verifier, Planner, LangGraph, Qdrant. Za dolgoročno tehnično usmeritev.
- **RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP:** Primerjava turistične raziskave z dejansko kodo; popravki dokumentacije; prioritiziran roadmap (HITL, multi-agent, čiščenje podatkov, PMS). Za načrtovanje in popravke.
- **RAZISKAVA-ARHITEKTURA-ANALIZA:** Detajlna primerjava uporabnikove raziskave z implementacijo; gap analiza; prioritetni roadmap (Qdrant, Redis, Planner). Za tehnične odločitve.
- **RAZISKAVA-IMPLEMENTACIJA-REFERENCE:** Hitra referenca s statusnim pregledom (✅/⚠️/❌/🔮); kdaj kateri dokument uporabiti. Za hitro orientacijo.
- **EXECUTIVE-SUMMARY-RAZISKAVA:** Ključni zaključki, prioritete, roadmap za CTO/Product Manager. Za executive odločitve.
- **Od MVP do Robustnega SaaS (PDF):** Tehnična arhitektura, resilience, hreflang, Booking.com (4–8 tednov registracija), load testing, LangSmith, hibridni pricing. Za produkcijsko pripravljenost.
- **Od Avtomatizacije Nalog do Autonomnih Tokov (PDF):** Analiza kode/commits; predlogi za Agentic BPA workflows, HITL nadgradnjo (zaupnostno gnan flow), operativno robustnost (CI/CD, setup, mocki). Za strategijo avtomatizacije.

**Ločnica:** Za jasno mejo med implementiranim in načrtovanim glej [RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP](RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md) § 1.1.

Dokumenti se dopolnjujejo – uporabi pri načrtovanju.
