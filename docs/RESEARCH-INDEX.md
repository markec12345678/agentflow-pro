# Research Index – Pregled raziskav in analiz

Kratki pregled raziskav v projektu. Katero uporabiti pri konkretnih odločitvah.

---

## Dokumenti

| Dokument | Referenčni vir | Glavni fokus | Ciljna publika |
|----------|----------------|--------------|----------------|
| [JASPER-GAP-ANALYSIS](JASPER-GAP-ANALYSIS.md) | Jasper (komercialni produkt) | Feature parity, konkurenčna pozicija | Product, marketing, UX |
| [AGENTFLOW-ECOSYSTEM-COMPARISON](AGENTFLOW-ECOSYSTEM-COMPARISON.md) | Akademska raziskava (agentični framework) | Arhitektura, tehnični roadmap | CTO, arhitekti, razvoj |
| [RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP](RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md) | Internal comparison (koda vs. raziskava) | Gap raziskava vs. implementacija, roadmap | Product, development |
| Od MVP do Robustnega SaaS (PDF) | PDF v `agentflow-pro/` | Produkcijska robustnost, arhitektura, hreflang, Booking.com, load test, LangSmith | Product, CTO, razvoj |

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

---

## Povzetek

- **JASPER-GAP-ANALYSIS:** Konkurenčna pozicija, skoraj pariteta; ostane Salesforce, admin controls. Za praktično produktno delo.
- **AGENTFLOW-ECOSYSTEM-COMPARISON:** Arhitekturna primerjava, predlogi za Verifier, Planner, LangGraph, Qdrant. Za dolgoročno tehnično usmeritev.
- **RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP:** Primerjava turistične raziskave z dejansko kodo; popravki dokumentacije; prioritiziran roadmap (HITL, multi-agent, čiščenje podatkov, PMS). Za načrtovanje in popravke.
- **Od MVP do Robustnega SaaS (PDF):** Tehnična arhitektura, resilience, hreflang, Booking.com (4–8 tednov registracija), load testing, LangSmith, hibridni pricing. Za produkcijsko pripravljenost.

**Ločnica:** Za jasno mejo med implementiranim in načrtovanim glej [RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP](RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md) § 1.1.

Dokumenti se dopolnjujejo – uporabi pri načrtovanju.
