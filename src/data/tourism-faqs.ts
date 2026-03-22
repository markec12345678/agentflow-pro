/**
 * Shared tourism FAQ data for API and GEO schema.
 */

export interface FaqEntry {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export const DEFAULT_FAQS: FaqEntry[] = [
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
