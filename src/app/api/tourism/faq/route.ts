import { NextRequest, NextResponse } from "next/server";

interface FAQEntry {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

// Lokalna baza pogostih vprašanj za turizem
const DEFAULT_FAQS: FAQEntry[] = [
  {
    question: "Kako pridem do nastanitve?",
    answer: "Navodila za prihod so odvisna od lokacije. Ponavadi prejmete točne instrukcije s koordinatami in slike pred prihodom. Za večino lokacij priporočamo uporabo Google Maps.",
    category: "prihod",
    keywords: ["prihod", "navodila", "kako pridem", "lokacija", "naslov"],
  },
  {
    question: "Kdaj je check-in in check-out?",
    answer: "Standardni check-in je med 15:00 in 20:00, check-out do 11:00. Kasnejši check-in je možen po dogovoru. Prosimo, da nas obvestite vnaprej.",
    category: "čas",
    keywords: ["check-in", "check-out", "ura", "kdaj", "čas"],
  },
  {
    question: "Ali je WiFi na voljo?",
    answer: "Da, brezplačen WiFi je na voljo v celotni nastanitvi. Geslo najdete v info brošuri ali pa vprašajte gostitelja.",
    category: "storitve",
    keywords: ["wifi", "internet", "geslo", "povezava"],
  },
  {
    question: "Ali sprejemate hišne ljubljenčke?",
    answer: "To je odvisno od posamezne nastanitve. Prosimo, preverite opis nastanitve ali nas kontaktirajte pred rezervacijo.",
    category: "pravila",
    keywords: ["pes", "mačka", "hišni ljubljenček", "žival", "dovoljeno"],
  },
  {
    question: "Ali je parkirišče na voljo?",
    answer: "Večina naših nastanitev ima brezplačno parkirišče. Podrobnosti so navedene v opisu vsake nastanitve.",
    category: "storitve",
    keywords: ["parkirišče", "parkiranje", "avto", "vozilo"],
  },
  {
    question: "Kaj je v bližini za početi?",
    answer: "Vsaka lokacija ima edinstvene atrakcije. Pogosto so na voljo pohodniške poti, restavracije, znamenitosti. Podrobne informacije prejmete v digitalnem vodiču po prihodu.",
    category: "aktivnosti",
    keywords: ["aktivnosti", "početi", "atrakcije", "restavracije", "zanimivosti"],
  },
  {
    question: "Ali je kuhinja opremljena?",
    answer: "Da, vse nastanitve imajo opremljeno kuhinjo s hladilnikom, štedilnikom, posodo in priborom. Podroben seznam opreme je v opisu.",
    category: "oprema",
    keywords: ["kuhinja", "kuhanje", "oprema", "hladilnik", "posoda"],
  },
  {
    question: "Ali imate klimo/gretje?",
    answer: "Večina nastanitev ima klimatsko napravo ali gretje, odvisno od lokacije in sezone. Preverite opis za specifične podrobnosti.",
    category: "oprema",
    keywords: ["klima", "gretje", "hladno", "vroče", "temperatura"],
  },
  {
    question: "Kako rezerviram direktno?",
    answer: "Direktno rezervacijo lahko opravite preko naše spletne strani, po telefonu ali emailu. Direktne rezervacije ponavadi ponujajo najboljše cene.",
    category: "rezervacije",
    keywords: ["rezervacija", "booking", "cena", "direktno"],
  },
  {
    question: "Ali je možen zgodnejši check-in?",
    answer: "Zgodnejši check-in je možen, če je nastanitev pripravljena. Prosimo, da nas kontaktirate dan pred prihodom in bomo preverili razpoložljivost.",
    category: "čas",
    keywords: ["zgodnje", "prej", "check-in", "prispeti"],
  },
];

// POST /api/tourism/faq - chatbot response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, _propertyId, customFaqs } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Merge default FAQs with custom property FAQs
    const faqs = [...DEFAULT_FAQS, ...(customFaqs || [])];

    // Find best matching answer
    const normalizedQuestion = question.toLowerCase().trim();
    let bestMatch: FAQEntry | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      
      // Check for exact question match
      if (faq.question.toLowerCase().includes(normalizedQuestion)) {
        score += 10;
      }
      
      // Check for keyword matches
      for (const keyword of faq.keywords) {
        if (normalizedQuestion.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      
      // Check if question contains any words from FAQ question
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      for (const word of normalizedQuestion.split(/\s+/)) {
        if (word.length > 3 && questionWords.includes(word)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    // Threshold for confidence
    if (bestScore >= 2 && bestMatch) {
      return NextResponse.json({
        answer: bestMatch.answer,
        confidence: Math.min(bestScore / 10, 1),
        category: bestMatch.category,
        matchedQuestion: bestMatch.question,
        alternatives: faqs
          .filter(f => f !== bestMatch && f.category === bestMatch.category)
          .slice(0, 2)
          .map(f => ({ question: f.question, answer: f.answer })),
      });
    }

    // Fallback response
    return NextResponse.json({
      answer: "Žal nimam neposrednega odgovora na to vprašanje. Prosimo, kontaktirajte nas direktno na telefon ali email in z veseljem vam bomo pomagali.",
      confidence: 0,
      category: "unknown",
      contactInfo: {
        phone: "+386 40 123 456",
        email: "info@example.com",
      },
    });
  } catch (error) {
    console.error("FAQ chatbot error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}

// GET /api/tourism/faq - list all FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let faqs = DEFAULT_FAQS;
    if (category) {
      faqs = faqs.filter(f => f.category === category);
    }

    return NextResponse.json({ 
      faqs,
      categories: [...new Set(DEFAULT_FAQS.map(f => f.category))],
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
