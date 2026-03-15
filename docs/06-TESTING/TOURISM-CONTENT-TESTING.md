# Tourism Content Generation – Test Checklist

Sistematično testiranje AI generiranja turističnih vsebin na `/dashboard/tourism/generate`.

## Predpogoj

1. **OpenAI API Key** – nastavi v Settings ali `OPENAI_API_KEY` v `.env`
2. **Lokalni server** – `npm run dev`, odpri `http://localhost:3002/dashboard/tourism/generate`

---

## Test matrica

### 1. Tourism prompti (5)

| ID | Ime | Spremenljivke | Min. testov |
|----|-----|---------------|-------------|
| booking-description | Booking.com Opis Nastanitve | lokacija, tip, osebe, sobe, posebnosti, atrakcije, jezik, ton, kljucne_besede | 10+ |
| airbnb-story | Airbnb Storytelling Opis | jezik, lokacija, posebnosti | 10+ |
| destination-guide | Vodič po Destinaciji | jezik, destinacija, kljucne_besede | 10+ |
| seasonal-campaign | Sezonska Kampanja | sezona, destinacija, ponudba, jezik | 10+ |
| instagram-travel | Instagram Travel Caption | lokacija, jezik | 10+ |

**Primeri inputov:**
- Lokacije: Bela Krajina, Črnomelj, Ljubljana, Bohinj, Piran, Soča, Triglav, Koper
- Tipi: apartma, hiša, hotel, turistična kmetija
- Sezone: božič, poletje, Velika noč, novoletna, jesen
- Posebnosti: WiFi, parkirišče, bazen, hišni ljubljenčki, vrt

### 2. Večjezičnost (SL, EN, DE, IT, HR)

Za vsak prompt preveri:
- Output je v izbranem jeziku
- Besedilo je naravno, brez očitnih prevodnih napak
- Stil ustreza ciljnemu jeziku

**Test:** Isti input (npr. lokacija: Črnomelj, tip: apartma), 5 jezikov – primerjaj kvaliteto.

### 3. Toni pisanja (4)

Le pri **Booking.com** promptu:
- profesionalen – strokoven, konkretno, brez pretiranih okrasov
- prijazen – topel, oseben, gostoljuben
- luksuzen – eleganten, premium, ekskluziven
- družinski – poudarek na družino, otroci, skupne aktivnosti

**Test:** Isti content (apartma Bela Krajina) v 4 tonih – preveri razlike v besedilih.

### 4. Prompt optimizacija

Za vsako spremembo v [src/data/prompts.ts](../src/data/prompts.ts):
1. Generiraj 3–5 primerov z novo verzijo
2. Oceni output po kriterijih spodaj
3. Dokumentiraj spremembe in njihov vpliv

---

## Ročni test checklist

### Faze

- [ ] **Faza 1 – Vsi prompti**
  - [ ] Booking.com – vsaj 2 primera
  - [ ] Airbnb – vsaj 2 primera
  - [ ] Vodič po Destinaciji – vsaj 2 primera
  - [ ] Sezonska Kampanja – vsaj 2 primera
  - [ ] Instagram Travel Caption – vsaj 2 primera

- [ ] **Faza 2 – Večjezičnost**
  - [ ] Isti prompt v SL, EN, DE, IT, HR
  - [ ] Preveri: jezik outputa, naravnost stila

- [ ] **Faza 3 – Toni**
  - [ ] Booking: profesionalen, prijazen, luksuzen, družinski
  - [ ] Primerjava stilov

- [ ] **Faza 4 – Optimizacija**
  - [ ] Sprememba enega prompta
  - [ ] 3–5 generacij, ocena

---

## Ocenjevanje kvalitete

Za vsak output oceni 1–5 (1 = slabo, 5 = odlično):

| Kriterij | 1 | 2 | 3 | 4 | 5 |
|----------|---|---|---|---|---|
| **Jezik** | Napačen jezik, očitne napake | Več manjših napak | Sprejemljivo | Dobro, naravno | Popolnoma naravno |
| **Struktura** | Kaotično, brez strukture | Delno razumljivo | Osnovna struktura | Dober pretok | Jasna, pregledna |
| **Ustreznost** | Off-topic, nesmisel | Delno relevantno | Večinoma ok | Dobro cilja prompt | Popolnoma ustreza |
| **Dolžina** | Prekratko/dolgo | Neustrezno | Sprejemljivo | Ustrezno | Optimalno |
| **Ton** | Napačen ton | Delno ustreza | Večinoma ok | Dober ton | Popolnoma ustreza |

**Pass/Fail:** vsota ≥ 15/25 = pass za posamezen output.

---

## Znane omejitve

- **LLM output ni determinističen** – ista vloga lahko da različne rezultate
- **Rate limits** – OpenAI API ima omejitve; pri masovnem testiranju vmes počakaj
- **Mock mode** – če je `MOCK_MODE=true`, se ne kliče LLM (placeholder output)
