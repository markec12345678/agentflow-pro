"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Tipi vsebine ─────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  {
    id: "booking-description",
    icon: "📋",
    label: "Opis nastanitve",
    desc: "Booking.com, Airbnb, lastna stran",
    fields: ["name", "location", "highlights", "rooms"],
  },
  {
    id: "guest-welcome-email",
    icon: "📧",
    label: "Email za goste",
    desc: "Dobrodošlica, info pred prihodom",
    fields: ["name", "location", "checkin", "tips"],
  },
  {
    id: "destination-guide",
    icon: "📍",
    label: "Vodič destinacije",
    desc: "SEO blog, Google, TripAdvisor",
    fields: ["location", "highlights", "activities"],
  },
  {
    id: "instagram-travel",
    icon: "📱",
    label: "Social media",
    desc: "Instagram, Facebook caption + hashtagi",
    fields: ["name", "location", "highlights"],
  },
  {
    id: "landing-page",
    icon: "🌐",
    label: "Landing stran",
    desc: "SEO stran za direktne rezervacije",
    fields: ["name", "location", "highlights", "price"],
  },
  {
    id: "seasonal-campaign",
    icon: "🎄",
    label: "Sezonska kampanja",
    desc: "Božič, poletje, vikend akcija – z datumom in CTA",
    fields: ["name", "location", "season", "offer", "cta"],
  },
];

const LANGUAGES = [
  { id: "sl", label: "SL 🇸🇮" },
  { id: "en", label: "EN 🇬🇧" },
  { id: "de", label: "DE 🇩🇪" },
  { id: "it", label: "IT 🇮🇹" },
  { id: "hr", label: "HR 🇭🇷" },
];

// ─── Naslovi polj ─────────────────────────────────────────────────────────────
const FIELD_LABELS: Record<string, { label: string; placeholder: string }> = {
  name: { label: "Ime nastanitve", placeholder: "npr. Hotel Krim, Apartma Bled..." },
  location: { label: "Lokacija", placeholder: "npr. Bled, Kranjska Gora, Ljubljana..." },
  highlights: { label: "Posebnosti / USP", placeholder: "npr. pogled na jezero, spa, zasebni bazen, v naravi..." },
  rooms: { label: "Sobe / apartmaji", placeholder: "npr. 12 sob, premium soba z jacuzzijem, family suite..." },
  checkin: { label: "Check-in čas", placeholder: "npr. 14:00, zgodnji check-in možen..." },
  tips: { label: "Nasveti za goste", placeholder: "npr. najboljša restavracija, parkirišče, aktivnosti..." },
  activities: { label: "Aktivnosti / privlačnosti", placeholder: "npr. pohodništvo, kolesarjenje, jezero, Triglav..." },
  price: { label: "Cena od", placeholder: "npr. od 89€ na noč, cene od 150€..." },
  season: { label: "Sezona / akcija", placeholder: "npr. Božič & novo leto, poletne počitnice, zimska akcija..." },
  offer: { label: "Posebna ponudba", placeholder: "npr. 3 noči za ceno 2, brezplačen zajtrk, 20% popust..." },
  cta: { label: "CTA (poziv k akciji)", placeholder: "npr. Rezervirajte zdaj, Oglejte si ponudbo, Kontaktirajte nas..." },
};

const SEASON_OPTIONS = [
  { id: "pomlad", label: "Pomlad", emoji: "🌸" },
  { id: "poletje", label: "Poletje", emoji: "☀️" },
  { id: "jesen", label: "Jesen", emoji: "🍂" },
  { id: "zima", label: "Zima", emoji: "🎄" },
  { id: "bozic", label: "Božič & novo leto", emoji: "🎅" },
];

// ─── Ikona za tip ─────────────────────────────────────────────────────────────
function typeIcon(id: string) {
  return CONTENT_TYPES.find(t => t.id === id)?.icon ?? "✍️";
}

// ─── Simulirani rezultat (fallback) ──────────────────────────────────────────
function getMockResult(type: string, name: string, location: string, lang: string): string {
  const langLabel = LANGUAGES.find(l => l.id === lang)?.label.split(" ")[0] ?? "SL";
  if (type === "booking-description") {
    return `🌟 ${name} – ${location}\n\nVaš idealni počitniški dom v srcu ${location}. ${name} ponuja nepozabno izkušnjo z vrhunsko lokacijo in pristno gostoljubnostjo. Vsaka soba je skrbno opremljena za vaš popoln oddih.\n\n✓ Izjemna lokacija\n✓ Brezžični internet\n✓ Zajtrk v ceni\n✓ Parkirišče\n\n[Vsebina generirana v ${langLabel}]`;
  }
  if (type === "guest-welcome-email") {
    return `Zadeva: Dobrodošli v ${name}! 🏨\n\nDragi gost,\n\nZ veseljem vas pričakujemo v ${name} v ${location}!\n\nVaša soba bo pripravljena ob 14:00. Če potrebujete zgodnji check-in, nas prosim kontaktirajte vnaprej.\n\nNaš nasvet: obiščite lokalni trg zjutraj – prava turistična izkušnja!\n\nŽelimo vam čudovit pobeg!\n\nEkipa ${name}\n[Vsebina generirana v ${langLabel}]`;
  }
  return `✍️ Vsebina za ${name} (${location})\n\nAI je generiral optimizirano vsebino tipa "${type}" za vašo nastanitev. V produkcijskem načinu bo vsebina popolnoma prilagojena vašim podatkom in SEO optimizirana.\n\n[Demo vsebina – ${langLabel}]`;
}

// ─── Główna komponenta (brez Suspense wrapping) ───────────────────────────────
function GenerateWizard() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contentType, setContentType] = useState("");
  const [language, setLanguage] = useState("sl");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string; location?: string | null; description?: string | null }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  useEffect(() => {
    fetch("/api/tourism/properties")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => setProperties([]));
  }, []);

  useEffect(() => {
    if (selectedPropertyId && properties.length > 0) {
      const p = properties.find((x) => x.id === selectedPropertyId);
      if (p) {
        setFields((prev) => ({
          ...prev,
          name: p.name,
          location: p.location ?? prev.location,
          highlights: p.description?.slice(0, 200) ?? prev.highlights,
        }));
      }
    }
  }, [selectedPropertyId, properties]);

  // Predizpolni iz URL params
  useEffect(() => {
    const template = searchParams.get("template");
    const name = searchParams.get("name");
    const loc = searchParams.get("location");
    const lang = searchParams.get("lang");

    if (template) setContentType(template);
    if (lang) setLanguage(lang);
    const initial: Record<string, string> = {};
    if (name) initial.name = decodeURIComponent(name);
    if (loc) initial.location = decodeURIComponent(loc);
    if (Object.keys(initial).length) setFields(initial);
    if (template && name && loc) setStep(2);
  }, [searchParams]);

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType);

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);
    try {
      const topic = [
        contentType,
        fields.name,
        fields.location,
        fields.highlights,
      ].filter(Boolean).join(" - ");

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          count: 1,
          template: contentType,
          fields,
          language,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.posts?.[0]?.fullContent ?? data.posts?.[0]?.excerpt ?? "";
      setResult(text || getMockResult(contentType, fields.name ?? "", fields.location ?? "", language));
    } catch {
      setResult(getMockResult(contentType, fields.name ?? "", fields.location ?? "", language));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">✍️ Ustvari vsebino</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">3 koraki do profesionalne vsebine</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { n: 1, label: "Tip vsebine" },
            { n: 2, label: "Podatki" },
            { n: 3, label: "Rezultat" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${step === s.n
                    ? "bg-blue-600 text-white shadow-lg"
                    : step > s.n
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
              >
                <span>{step > s.n ? "✓" : s.n}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={`h-0.5 w-8 mx-1 ${step > s.n ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">

          {/* ─── KORAK 1: Izberi tip ──────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Kaj želite ustvariti?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => {
                      setContentType(ct.id);
                      setStep(2);
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                  >
                    <span className="text-3xl">{ct.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{ct.label}</p>
                      <p className="text-xs text-gray-500">{ct.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── KORAK 2: Vnesi podatke ───────────────────────────────── */}
          {step === 2 && selectedType && (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
              >
                ← Nazaj
              </button>

              <div className="flex items-center gap-3 mb-8">
                <span className="text-4xl">{selectedType.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedType.label}</h2>
                  <p className="text-sm text-gray-500">{selectedType.desc}</p>
                </div>
              </div>

              <div className="space-y-5">
                {selectedType.id === "seasonal-campaign" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sezona</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASON_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFields(prev => ({ ...prev, season: opt.label }))}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-1 ${fields.season === opt.label
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300"
                            }`}
                        >
                          <span>{opt.emoji}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedType.fields.map(fieldId => {
                  const f = FIELD_LABELS[fieldId];
                  if (!f) return null;
                  return (
                    <div key={fieldId}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {f.label}
                        {(fieldId === "name" || fieldId === "location") && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={fields[fieldId] ?? ""}
                        onChange={e => setFields(prev => ({ ...prev, [fieldId]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  );
                })}

                {/* Jezik */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Jezik</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${language === lang.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300"
                          }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!fields.name?.trim() && selectedType.fields.includes("name")}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                🚀 Generiraj vsebino
              </button>
            </div>
          )}

          {/* ─── KORAK 3: Rezultat ───────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{typeIcon(contentType)}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedType?.label ?? "Vaša vsebina"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {fields.name && `${fields.name} • `}{fields.location}
                    </p>
                  </div>
                </div>
              </div>

              {generating ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4 animate-bounce">🤖</div>
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">AI piše za vas...</p>
                  <p className="text-gray-500 mt-2">Navadno traja 5–10 sekund</p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex gap-2">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                      {result}
                    </pre>
                  </div>

                  {/* Akcijski gumbi */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                    >
                      {copied ? "✓ Kopirano!" : "📋 Kopiraj"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResult("");
                        handleGenerate();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                    >
                      🔄 Generiraj novo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setContentType("");
                        setFields({});
                        setResult("");
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-blue-400 transition-all"
                    >
                      ✍️ Nova vsebina
                    </button>
                  </div>

                  {/* Prevedi v drug jezik */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">🌍 Prevedi v drug jezik</p>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.filter(l => l.id !== language).map(lang => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.id);
                            setResult("");
                            handleGenerate();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-700 border border-blue-300 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!generating && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 text-center mb-3">Potrebujete več kontrole?</p>
                  <div className="flex justify-center gap-4">
                    <Link href="/content" className="text-sm text-blue-600 hover:underline">
                      📁 Moja vsebina
                    </Link>
                    <Link href="/workflows" className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
                      ⚡ Napredno (Workflows)
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🤖</div>
          <p className="text-gray-500">Nalagam...</p>
        </div>
      </div>
    }>
      <GenerateWizard />
    </Suspense>
  );
}
