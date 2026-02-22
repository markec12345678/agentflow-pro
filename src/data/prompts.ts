export interface PromptTemplate {
  id: string;
  name: string;
  category: "blog" | "social" | "email" | "tourism";
  prompt: string;
  description: string;
  variables?: string[];
}

export const PROMPTS: PromptTemplate[] = [
  {
    id: "seo-blog",
    name: "SEO Blog Post",
    category: "blog",
    prompt: "Write an SEO-optimized blog post about [TOPIC]. Include a compelling headline, meta description, introduction with a hook, 3-4 main sections with H2 headers, and a clear CTA at the end.",
    description: "Full blog structure with SEO best practices",
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    category: "social",
    prompt: "Write a LinkedIn post about [TOPIC]. Use a strong hook in the first line, 3-4 short paragraphs, line breaks for readability, and end with a question or CTA to spark engagement.",
    description: "Professional LinkedIn-style post for engagement",
  },
  {
    id: "product-launch-email",
    name: "Product Launch Email",
    category: "email",
    prompt: "Write a product launch email for [PRODUCT/FEATURE]. Include: attention-grabbing subject line, personalized greeting, the problem we solve, key benefits, social proof, clear CTA, and P.S. with urgency.",
    description: "Email template for launching new products",
  },
  {
    id: "twitter-thread",
    name: "Twitter/X Thread",
    category: "social",
    prompt: "Write a Twitter thread about [TOPIC]. 5-7 tweets: hook in the first, valuable insights in the middle, CTA in the last. Keep each tweet under 280 characters. Use 1/ for thread markers.",
    description: "Engaging thread format for Twitter/X",
  },
  {
    id: "listicle-blog",
    name: "Listicle Blog Post",
    category: "blog",
    prompt: "Write a listicle blog post: 'X Ways to [ACHIEVE GOAL]' about [TOPIC]. Each point: clear heading, 2-3 sentences of explanation, optional tip or example. Include intro and conclusion.",
    description: "Numbered list format for easy scanning",
  },
  {
    id: "newsletter-intro",
    name: "Newsletter Introduction",
    category: "email",
    prompt: "Write a newsletter introduction for [TOPIC]. Personal tone, recap of what's inside, why it matters to the reader, and a teaser for the main content. Keep it under 150 words.",
    description: "Engaging opener for email newsletters",
  },
  {
    id: "instagram-caption",
    name: "Instagram Caption",
    category: "social",
    prompt: "Write an Instagram caption about [TOPIC]. Hook in the first line, 2-3 short paragraphs, relevant emojis, 3-5 hashtags at the end. Tone: authentic and engaging.",
    description: "Caption optimized for Instagram engagement",
  },
  {
    id: "how-to-blog",
    name: "How-To Guide",
    category: "blog",
    prompt: "Write a how-to guide: 'How to [ACHIEVE GOAL]' about [TOPIC]. Step-by-step instructions, clear subheadings, practical tips, and a troubleshooting or FAQ section at the end.",
    description: "Step-by-step tutorial format",
  },
  {
    id: "cold-outreach-email",
    name: "Cold Outreach Email",
    category: "email",
    prompt: "Write a cold outreach email for [GOAL/PITCH]. Subject line that creates curiosity. Keep it under 100 words. Lead with value, one clear CTA, no attachments or long paragraphs.",
    description: "Concise cold email for sales or partnerships",
  },
  {
    id: "meta-description",
    name: "Meta Description",
    category: "blog",
    prompt: "Write a meta description for a blog post about [TOPIC]. 150-160 characters. Include primary keyword, value proposition, and a subtle CTA. Make it compelling for SERP clicks.",
    description: "SEO meta description for search results",
  },
  {
    id: "booking-description",
    name: "Booking.com Opis Nastanitve",
    category: "tourism",
    prompt: `Napiši profesionalen, prodajno usmerjen opis nastanitve za Booking.com.

Vhodni podatki:
- Lokacija: {lokacija}
- Tip nastanitve: {tip} (apartma, hiša, hotel...)
- Kapaciteta: {osebe} oseb, {sobe} sobe
- Posebnosti: {posebnosti} (bazen, WiFi, parkirišče...)
- Bližnje atrakcije: {atrakcije} (npr. vinogradništvo, reka Kolpa, termalne vrelce, Planina, Snežnik)
- Jezik: {jezik}
- Ton: {ton} (profesionalen, prijazen, luksuzen, družinski)
- Ključne besede ({kljucne_besede}): 3–5 SEO fraz, ločene z vejico. Primer: apartmaji bela krajina, počitnice kolpa, družinske počitnice slovenija

Uporabi Slovenian tourism izraze kjer primerno: apartma, gostitelj, Bela Krajina, Kolpa, Dolenjska, vinogradi, termalna letovišča, gorske koče, planinski dom.

Navodila:
1. Začni z močnim "hook" stavkom
2. Poudari edinstvene prednosti lokacije
3. Vključi vse ključne besede ({kljucne_besede}) naravno v besedilo
4. Uporabi kratke, berljive odstavke
5. Zaključi s pozivom k akciji

Omejitev: 300-500 besed. Brez emoji-jev.
Izhod: samo besedilo, brez naslovov ali emoji-jev.`,
    description: "Prodajni opis nastanitve za Booking.com (300-500 besed)",
    variables: [
      "lokacija",
      "tip",
      "osebe",
      "sobe",
      "posebnosti",
      "atrakcije",
      "jezik",
      "ton",
      "kljucne_besede",
    ],
  },
  {
    id: "airbnb-story",
    name: "Airbnb Storytelling Opis",
    category: "tourism",
    prompt: `Napiši topel, oseben opis v stilu storytellinga za Airbnb.

Fokus: izkušnja gosta, ne samo seznam funkcij.

Struktura:
1. Dobrodošlica in kratek uvod o gostitelju/lokaciji
2. Opis prostora skozi oči gosta ("Zjutraj se zbudiš ob pogledu na...")
3. Lokalne skrite dragulje (kavarna, pot, restavracija...)
4. Praktične informacije na koncu

Ton: {ton} (prijazen, gostoljuben, avtentičen).
Dolžina: 150-250 besed.
Jezik: {jezik}
Lokacija: {lokacija}
Tip nastanitve: {tip} (apartma, hiša, vikend, glamping...)
Kapaciteta: {osebe} oseb
Posebnosti: {posebnosti} – navedi le tiste, ki vplivajo na izkušnjo (npr. bazen, WiFi, vrt, kamin). Brez generičnih list.`,
    description: "Topel, oseben opis v stilu storytellinga za Airbnb",
    variables: ["jezik", "lokacija", "tip", "osebe", "posebnosti", "ton"],
  },
  {
    id: "destination-guide",
    name: "Vodič po Destinaciji",
    category: "tourism",
    prompt: `Napiši SEO optimiziran vodič po destinaciji za blog.

Jasna struktura odstavkov:
1. Naslov (privlačen + ključna beseda)
2. Uvodni odstavek: zakaj je destinacija vredna obiska
3. Odstavek za vsako sekcijo: Top 5 stvari za početi, Najboljši čas za obisk, Lokalni nasveti (kje jesti, kje parkirati, kateri mesec je najboljši za obisk), Kje ostati, Praktične informacije
4. Za vsako destinacijo vključi konkretne lokalne atrakcije (muzeji, trgi, naravne znamenitosti, lokalna kuhinja, dogodki). Za Slovenijo: Ljubljana (grad, Tromostovje), Bled, Piran, Postojnska jama, Škocjan, Logarska dolina, Soča. Vsak odstavek ločeno, berljiv, s podnaslovom.
5. Zaključni odstavek s povzetkom in CTA

Dolžina: 800-1000 besed
Ton: {ton} (profesionalen, prijazen, luksuzen ali družinski).
Jezik: {jezik}
Destinacija: {destinacija}
SEO ključne besede: {kljucne_besede}`,
    description: "SEO optimiziran vodič po destinaciji za blog (800-1000 besed)",
    variables: ["jezik", "destinacija", "kljucne_besede", "ton"],
  },
  {
    id: "seasonal-campaign",
    name: "Sezonska Kampanja",
    category: "tourism",
    prompt: `Napiši sezonsko kampanjo za hotel/nastanitev.

Vključi:
- Email zadeva (privlačna)
- Email telo (200-300 besed)
- Social media post (kratek + hashtagi)
- Poziv k akciji z omejitvijo časa
- Urgency: vključi datum konca, omejeno število sob, ekskluzivnost. Uporabi scarcity fraze: "Zadnja priložnost", "omejeno število", "do [datum]"

Sezona/Dogodek: {sezona}
Destinacija: {destinacija}
Posebna ponudba: {ponudba} – konkretni primeri: "15% popust za rezervacije do 31.3.", "2 noči = 1 brezplačna", "Zgodnje buke do 28.2. – prihrani 20%"
Ton: {ton}
Jezik: {jezik}`,
    description:
      "Sezonska kampanja: email + social media post za hotel/nastanitev",
    variables: ["sezona", "destinacija", "ponudba", "jezik", "ton"],
  },
  {
    id: "instagram-travel",
    name: "Instagram Travel Caption",
    category: "tourism",
    prompt: `Napiši Instagram caption za travel fotografijo.

Struktura:
- Hook (prvi stavek pritegne pozornost)
- 2-3 kratki odstavki
- Hashtagi: mix lokacijskih (#BelaKrajina, #Slovenia) in tipskih (#apartma, #TravelSlovenia). Vključi 5–7 hashtagov na koncu.
- Poziv k akciji ("Link v bio" / "Rezerviraj zdaj")

Ton: {ton} (profesionalen, prijazen, luksuzen ali družinski).
Dolžina captiona: 100-150 besed.
Lokacija: {lokacija}
Tip/Tema: {tip} (apartma, hotel, glamping, vikend, počitnice...)
Jezik: {jezik}`,
    description: "Instagram caption za travel fotografijo",
    variables: ["ton", "lokacija", "tip", "jezik"],
  },
  {
    id: "restaurant-menu",
    name: "Restavracija / Menu Opis",
    category: "tourism",
    prompt: `Napiši prodajni opis hotelske restavracije in menuja.

Vključi:
1. Uvod o restavraciji (koncept, atmosfera, posebnosti)
2. Opis kuhinje in kuharske ekipe
3. 3-4 kategorije jedi z apetitnimi opisi (starterji, glavne jedi, deserti, vinska karta)
4. Lokalne sestavine in sezonsko ponudbo
5. Posebne diete (veganski, brez glutena) če so na voljo

Restavracija: {restavracija}
Tip kuhinje: {tip_kuhinje} (slovenska, mediteranska, fine dining...)
Lokacija: {lokacija}
Posebnosti: {posebnosti} (terasa s pogledom, vrt, lokalni dobavitelji...)
Jezik: {jezik}
Ton: {ton}

Dolžina: 400-600 besed.`,
    description: "Opis restavracije in menuja za hotel",
    variables: ["restavracija", "tip_kuhinje", "lokacija", "posebnosti", "jezik", "ton"],
  },
  {
    id: "activity-experience",
    name: "Aktivnost / Doživetje",
    category: "tourism",
    prompt: `Napiši privlačen opis lokalne aktivnosti ali doživetja za turiste.

Struktura:
1. Naslov doživetja (privlačen + akcijski)
2. Kratek opis kaj vključuje
3. Kdo je primerna ciljna skupina (družine, pare, posamezniki)
4. Trajanje in zahtevnost
5. Kaj je vključeno v ceno
6. Zakaj je to edinstveno/nepozabno
7. CTA za rezervacijo

Aktivnost: {aktivnost}
Lokacija: {lokacija}
Trajanje: {trajanje}
Ciljna skupina: {ciljna_skupina}
Jezik: {jezik}
Ton: {ton}

Dolžina: 250-400 besed.`,
    description: "Opis aktivnosti ali doživetja za turiste",
    variables: ["aktivnost", "lokacija", "trajanje", "ciljna_skupina", "jezik", "ton"],
  },
  {
    id: "wedding-event",
    name: "Poročni Paket / Event",
    category: "tourism",
    prompt: `Napiši prodajni opis poročnega paketa ali dogodkovnega prostora v hotelu.

Vključi:
1. Čarobnost lokacije (zakaj je idealna za poroko)
2. Prostori (ceremonija, sprejem, večerja, zabava)
3. Kapaciteta gostov
4. Vključene storitve (catering, dekoracija, koordinator...)
5. Paketi (osnovni, premium, all-inclusive)
6. Sezonska ponudba in cene (če relevantno)
7. Prepričljiv CTA za ogled

Tip dogodka: {tip_dogodka} (poroka, seminar, team building...)
Lokacija: {lokacija}
Kapaciteta: {kapaciteta} število gostov
Storitve: {storitve}
Jezik: {jezik}
Ton: {ton} (romantičen, eleganten, profesionalen)

Dolžina: 400-600 besed.`,
    description: "Opis poročnega paketa ali dogodkovnega prostora",
    variables: ["tip_dogodka", "lokacija", "kapaciteta", "storitve", "jezik", "ton"],
  },
  {
    id: "corporate-b2b",
    name: "Corporate / B2B Ponudba",
    category: "tourism",
    prompt: `Napiši profesionalen B2B opis hotelskih storitev za poslovne goste.

Fokus: poslovne potrebe (konference, team building, corporate retreat)

Vključi:
1. Poslovne zmogljivosti (sejne sobe, AV oprema, WiFi hitrost)
2. Corporate paketi (dnevni, večdnevni)
3. Team building aktivnosti
4. Catering za poslovne dogodke
5. Convenience (parkirišče, bližina letališča, transport)
6. Case study ali ugledni gost (če obstaja)
7. CTA za corporate inquiry

Lokacija: {lokacija}
Storitve: {storitve}
Ciljna skupina: {ciljna_skupina} (IT podjetja, finance, farmacija...)
Jezik: {jezik}
Ton: profesionalen, zanesljiv

Dolžina: 350-500 besed. Brez pretirane romance, fokus na ROI in efficiency.`,
    description: "B2B ponudba za poslovne goste in corporate dogodke",
    variables: ["lokacija", "storitve", "ciljna_skupina", "jezik"],
  },
  {
    id: "pre-arrival-email",
    name: "Pre-Arrival Email",
    category: "tourism",
    prompt: `Napiši pre-arrival email za gosta pred prihodom.

Struktura:
1. Osebna pozdrav (ime gosta)
2. Veselje za prihod + kratek uvod o nastanitvi
3. Navodila za prihod (check-in čas, kje parkirati, kako priti)
4. Lokalni nasveti (kje jesti, kaj početi v bližini)
5. Kontakt za vprašanja (WhatsApp, email, telefon)
6. Weather forecast (opcija)
7. Poziv za direktno rezervacijo v prihodnje

Ime gosta: {ime_gosta}
Lokacija: {lokacija}
Datum prihoda: {datum_prihoda}
Tip nastanitve: {tip_nastanitve}
Jezik: {jezik}
Ton: topel, prijazen, v pomoč

Dolžina: 200-300 besed.`,
    description: "Email pred prihodom gosta z navodili in nasveti",
    variables: ["ime_gosta", "lokacija", "datum_prihoda", "tip_nastanitve", "jezik"],
  },
  {
    id: "post-stay-review",
    name: "Post-Stay Review Request",
    category: "tourism",
    prompt: `Napiši prošnjo za oceno/review po odhodu gosta.

Struktura:
1. Zahvala za bivanje
2. Osebna nota (kaj je bilo super med njihovim bivanjem)
3 Blaga prošnja za 5-star oceno na Booking.com/Google/Airbnb
4. Povezave direktno do ocenjevanja
5. Ponudba za popust pri naslednjem bivanju
6. Zaprtje z vabilom za vrnitev

Ime gosta: {ime_gosta}
Lokacija: {lokacija}
Datum bivanja: {datum_bivanja}
Platforma: {platforma} (Booking.com, Airbnb, Google, direktno)
Jezik: {jezik}
Ton: hvaležen, prijazen, ne vsiljiv

Dolžina: 150-250 besed.`,
    description: "Prošnja za oceno po bivanju gosta",
    variables: ["ime_gosta", "lokacija", "datum_bivanja", "platforma", "jezik"],
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  blog: "Blog",
  social: "Social",
  email: "Email",
  tourism: "🏨 Tourism",
};

export const VARIABLE_LABELS: Record<string, string> = {
  lokacija: "Lokacija",
  tip: "Tip nastanitve",
  osebe: "Osebe",
  sobe: "Sobe",
  posebnosti: "Posebnosti",
  atrakcije: "Bližnje atrakcije",
  jezik: "Jezik",
  ton: "Ton",
  kljucne_besede: "SEO ključne besede",
  destinacija: "Destinacija",
  sezona: "Sezona/Dogodek",
  ponudba: "Posebna ponudba",
  // Restavracija
  restavracija: "Ime restavracije",
  tip_kuhinje: "Tip kuhinje",
  // Aktivnosti
  aktivnost: "Aktivnost/Doživetje",
  trajanje: "Trajanje",
  ciljna_skupina: "Ciljna skupina",
  // Dogodki
  tip_dogodka: "Tip dogodka",
  kapaciteta: "Kapaciteta (št. gostov)",
  storitve: "Vključene storitve",
  // Guest communication
  ime_gosta: "Ime gosta",
  datum_prihoda: "Datum prihoda",
  datum_bivanja: "Datum bivanja",
  tip_nastanitve: "Tip nastanitve",
  platforma: "Platforma za ocene",
};

export const VARIABLE_OPTIONS: Record<string, string[]> = {
  jezik: ["SL", "EN", "DE", "IT", "HR"],
  ton: ["profesionalen", "prijazen", "luksuzen", "družinski", "romantičen", "eleganten"],
  ciljna_skupina: ["družine", "pare", "posamezniki", "poslovni gosti", "skupine", "mladi"],
  platforma: ["Booking.com", "Airbnb", "Google", "TripAdvisor", "Direktno"],
};
