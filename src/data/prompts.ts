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

Uporabi Slovenian tourism izraze kjer primerno: apartma, gostitelj, Bela Krajina, Kolpa, Dolenjska, vinogradi, termalna letovišča, gorske koče, planinski dom.
- Ton: {ton}

Navodila:
1. Začni z močnim "hook" stavkom
2. Poudari edinstvene prednosti lokacije
3. Vključi SEO ključne besede ({kljucne_besede}): 3–5 fraz, ločene z vejico (npr. "apartmaji bela krajina, počitnice kolpa, družinske počitnice")
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
Tip nastanitve: {tip} (apartma, hiša, vikend...)
Kapaciteta: {osebe} oseb
Posebnosti: {posebnosti} (npr. bazen, WiFi, vrt – navedi le pomembne za izkušnjo)`,
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
4. Za vsako destinacijo vključi konkretne lokalne atrakcije (muzeji, trgi, naravne znamenitosti, lokalna kuhinja, dogodki). Za Slovenijo: Ljubljana (grad, Tromostovje), Bled, Piran, Postojnska jama, Škocjan, Logarska dolina, Soča
5. Vsak odstavek ločeno, berljiv, s podnaslovom
6. Zaključni odstavek s povzetkom in CTA

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
- Urgency: omejitev števila sob/nastanitev, datum konca akcije, ekskluzivnost za pretekle goste
- Scarcity fraze: Zadnja priložnost, omejeno število, do [datum]

Sezona/Dogodek: {sezona}
Destinacija: {destinacija}
Posebna ponudba: {ponudba} (npr. "15% popust za rezervacije do 31.3.", "2 noči = 1 brezplačna", "Zgodnje buke do 28.2.")
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
Tip/Tema: {tip} (za hashtag primere: apartma, hotel, glamping, vikend, počitnice...)
Jezik: {jezik}`,
    description: "Instagram caption za travel fotografijo",
    variables: ["lokacija", "tip", "jezik", "ton"],
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
};

export const VARIABLE_OPTIONS: Record<string, string[]> = {
  jezik: ["SL", "EN", "DE", "IT", "HR"],
  ton: ["profesionalen", "prijazen", "luksuzen", "družinski"],
};
