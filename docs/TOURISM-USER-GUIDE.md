# Tourism Hub – Navodila za Uporabnike

Priročnik za hotelirje, DMO-je in turistične operaterje. Kako uporabiti AgentFlow Pro Tourism Hub za generiranje vsebine, emailov, landing strani in večjezičnih prevodov.

---

## Začetek

1. **Prijava** – Ustvari račun ali se prijavi na AgentFlow Pro.
2. **Onboarding** – Izberi industrio **Tourism** ali **Travel Agency**, da v sidebaru vidiš **Tourism Hub**.
3. **Tourism Hub** – Odpri dropdown v sidebaru. Pojavijo se: Overview, Generate, Templates, Nastanitve, Landing Page, Email, SEO, Multi-Language.

---

## Content Generator

Generiraj opis nastanitve, vodič po destinaciji ali social media vsebino.

1. Pojdi na **Generate** (ali Overview → Hitri Začetek).
2. Izberi prompt:
   - **Booking.com Opis Nastanitve** – prodajni opis za Booking.com
   - **Airbnb Storytelling Opis** – topel, oseben opis za Airbnb
   - **Vodič po Destinaciji** – SEO vodič za blog
   - **Sezonska Kampanja** – email + social post
   - **Instagram Travel Caption** – caption za travel fotografijo
3. Izpolni spremenljivke (Lokacija, Tip, Jezik, Ton, itd.). Ton (profesionalen, prijazen, luksuzen, družinski) je na voljo pri vseh promptih.
4. Klikni **Generate**.
5. Po generiranju:
   - **Kopiraj za Booking.com** – format brez HTML/markdown (omejitev ~4900 znakov)
   - **Kopiraj za Airbnb** – omejitev na 2 zaporedni prelomi vrstic
   - **Kopiraj hashtags** – generira hashtage iz lokacije in tipa (npr. #BelaKrajina, #apartma, #Slovenia)
6. Opcijsko: **Shrani kot Template** – vnesi ime in uporabi pozneje z predizpolnjenimi vrednostmi.

---

## Landing Page Generator

Ustvari landing stran nastanitve v več jezikih.

1. Pojdi na **Landing Page**.
2. **Step 1:** Izberi predlogo (Standard, Luksuz, Družinski).
3. **Step 2:** Vnesi Ime nastanitve, Lokacijo, Tip, Kapaciteta, Posebnosti, Cena od, itd. Izberi jezike (SL, EN, DE, IT, HR).
4. Klikni **Generiraj Zdaj**.
5. **Step 3:** Preglej vsebino. Uporabi:
   - **Export JSON** – prenese vsebino v JSON formatu
   - **Export Markdown** – prenese v MD formatu
   - **Export HTML** – prenese HTML predlogo
   - **Shrani** – shrani v bazo za poznejše nalaganje
6. **Naloži shranjene** – klikni za prikaz seznama shranjenih strani in izberi za nalaganje.

---

## Email Workflow

Ustvari profesionalne emaile za goste (Welcome, Follow-up, Sezonska).

1. Pojdi na **Email**.
2. Izberi tip:
   - **Welcome Email** – pred prihodom gosta, check-in navodila, priporočila
   - **Follow-up Email** – po odhodu, hvala, prošnja za review, popust pri naslednjem bivanju
   - **Sezonska Ponudba** – za pretekle goste, novosti, posebna ponudba
3. Izpolni podatke: Ime nastanitve, Lokacija, Jezik, Check-in/out. Za Sezonsko dodaj Sezona/Dogodek in Posebna ponudba.
4. Klikni **Generiraj Email**.
5. **Kopiraj** – vsebino v odložišče.
6. **Pošlji prek Gmaila** – odpre mailto: pošiljatelj s predizpolnjenim telesom.

---

## Nastanitve (Properties)

Upravljaj nastanitve za filtriranje template-ov in landing strani.

1. Pojdi na **Nastanitve** (Tourism Hub → Nastanitve).
2. **Dodaj** – vnesi Ime, Lokacija, Tip (apartma, hiša, hotel...), Kapaciteta. Klikni Dodaj.
3. **Uredi** – klikni Uredi pri nastanitvi, spremeni podatke, klikni Shrani.
4. **Izbriši** – klikni Izbriši in potrdi.
5. Izbrana aktivna nastanitev (PropertySelector v headerju) filtrira template-e in landing strani po nastanitvi.

---

## Multi-Language Translator

Prevedi vsebino v več jezikov hkrati.

1. Pojdi na **Multi-Language**.
2. Vstavi besedilo (npr. opis apartmaja v slovenščini).
3. Izberi izvorni jezik (sl) in ciljne jezike (EN, DE, IT, HR).
4. Klikni **Prevedi v izbrane jezike**.
5. Prevede se vsebina – klikni **Kopiraj** pri vsakem jeziku.

**Opomba:** Potreben OPENAI_API_KEY v Settings. Brez ključa: mock prevodi za testiranje.

---

## SEO Dashboard

Spremljaj ključne besede in optimiziraj z AI.

1. Pojdi na **SEO**.
2. Tabela prikaže keyworde z: Position, Volume, Difficulty.
3. **Priority** – High (1–10), Medium (11–20), Low (21+).
4. Filter/Sort – po prioriteti, poziciji, volumenu, težavnosti.
5. Graf – Volume by Keyword (Recharts).
6. **Optimiziraj** – klikni pri keywordu za predloge meta naslova, opisa, naslovov, GEO/AEO. **Copy Meta** kopira v odložišče.

---

## Publish Helpers – Kdaj kaj uporabiti

| Gumb | Kdaj uporabiti |
|------|----------------|
| Kopiraj za Booking.com | Ko objavljaš na Booking.com – brez HTML, brez markdown, omejitev ~4900 znakov |
| Kopiraj za Airbnb | Ko objavljaš na Airbnb – do 2 zaporedna preloma vrstic |
| Kopiraj hashtags | Za Instagram – hashtagi iz lokacije + tip (npr. #BelaKrajina #apartma #Slovenia) |

---

## Dokumentacija

- [TOURISM-API](TOURISM-API.md) – API dokumentacija za developerje
- [TOURISM-LOCAL-TESTING](TOURISM-LOCAL-TESTING.md) – lokalno testiranje
