"use client";

import { useState } from "react";
import { toast } from "sonner";

const LANDING_TEMPLATES = [
  {
    id: "tourism-basic",
    name: "Standard",
    description: "Čist, profesionalen dizajn za večino nastanitev",
    sections: ["hero", "about", "rooms", "amenities", "location", "cta"],
    emoji: "🏨",
  },
  {
    id: "luxury-retreat",
    name: "Luksuz",
    description: "Eleganten dizajn za premium nastanitve",
    sections: ["hero-fullscreen", "story", "gallery", "amenities-luxury", "reviews", "cta-elegant"],
    emoji: "✨",
    badge: "Premium",
  },
  {
    id: "family-friendly",
    name: "Družinski",
    description: "Topel, prijazen dizajn za družinske nastanitve",
    sections: ["hero-family", "activities", "rooms-family", "testimonials", "faq", "cta"],
    emoji: "👨‍👩‍👧‍👦",
  },
];

const LANGUAGES = [
  { code: "sl", name: "Slovenščina", flag: "🇸🇮" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "hr", name: "Hrvatski", flag: "🇭🇷" },
];

export default function LandingPageGenerator() {
  const [step, setStep] = useState<"template" | "content" | "preview" | "publish">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "apartma",
    capacity: "",
    features: "",
    priceFrom: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [selectedLanguages, setSelectedLanguages] = useState(["sl"]);
  const [generatedContent, setGeneratedContent] = useState<Record<string, unknown> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<
    Record<string, { prompt: string; url?: string; loading?: boolean }>
  >({});

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/tourism/generate-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          formData,
          languages: selectedLanguages,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setGeneratedContent(data.pages ?? data);
      setStep("preview");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Napaka pri generiranju. Poskusi ponovno.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const selectedTemplateData = LANDING_TEMPLATES.find((t) => t.id === selectedTemplate);

  const IMAGE_SUGGESTIONS = [
    {
      key: "hero",
      label: "Hero slika",
      getPrompt: () =>
        `Professional travel photography of cozy ${formData.type} interior in ${formData.location || "Slovenia"}, bright natural light, modern furniture, high quality, 4k`,
    },
    {
      key: "gallery",
      label: "Galerija",
      getPrompt: () =>
        `Beautiful ${formData.type} exterior in ${formData.location || "Slovenian"} countryside, summer day, green landscape, inviting entrance`,
    },
    {
      key: "about",
      label: "O nas",
      getPrompt: () =>
        `Warm interior of ${formData.type} ${formData.name || "accommodation"}, living room with view, hospitality, travel magazine style`,
    },
  ];

  const handleGenerateImage = async (key: string) => {
    const suggestion = IMAGE_SUGGESTIONS.find((s) => s.key === key);
    if (!suggestion) return;
    const prompt = suggestion.getPrompt();
    setSuggestedImages((prev) => ({ ...prev, [key]: { ...prev[key], prompt, loading: true } }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestedImages((prev) => ({ ...prev, [key]: { prompt, url: data.url, loading: false } }));
      toast.success("Slika generirana");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri generiranju");
      setSuggestedImages((prev) => {
        const curr = prev[key];
        return { ...prev, [key]: { prompt: curr?.prompt ?? prompt, loading: false } };
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Izberi Template
  // ─────────────────────────────────────────────────────────────
  if (step === "template") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Landing Page Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Izberi predlogo in ustvari profesionalno landing page v minutah
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {LANDING_TEMPLATES.map((template) => (
            <button
              type="button"
              key={template.id}
              className="text-left rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={() => {
                setSelectedTemplate(template.id);
                setStep("content");
              }}
            >
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-4xl" aria-hidden>
                  {template.emoji}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  {template.badge && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      {template.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                    >
                      {s}
                    </span>
                  ))}
                  {template.sections.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                      +{template.sections.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Vnesi Vsebino
  // ─────────────────────────────────────────────────────────────
  if (step === "content") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setStep("template")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Nazaj na predloge
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vnesi Podatke o Nastanitvi
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Osnovne Informacije
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Ime Nastanitve *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="npr. Apartmaji Bela Krajina"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Lokacija *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="npr. Črnomelj, Slovenija"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Tip
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="apartma">Apartma</option>
                      <option value="hisca">Hiša</option>
                      <option value="hotel">Hotel</option>
                      <option value="kmetija">Turistična Kmetija</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Cena Od (€)
                    </label>
                    <input
                      type="number"
                      value={formData.priceFrom}
                      onChange={(e) => setFormData({ ...formData, priceFrom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="npr. 65"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Posebnosti
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="WiFi, parkirišče, bazen, bližina reke, hišni ljubljenčki..."
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Email za Kontakt
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Jeziki za Generiranje
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedLanguages.includes(lang.code)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                      {lang.flag} {lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Vsak dodaten jezik podaljša čas generiranja za ~30 sekund
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 border-0">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Generiraj Landing Page
                </h3>
                <p className="text-blue-100 text-sm mb-4">
                  {selectedLanguages.length} jezik(ov) • Template:{" "}
                  {selectedTemplateData?.name ?? selectedTemplate}
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={
                    generating || !formData.name?.trim() || !formData.location?.trim()
                  }
                  className="w-full py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {generating ? "Generiram..." : "Generiraj Zdaj"}
                </button>
                <p className="text-xs text-blue-100 mt-3 text-center">
                  Traja približno 2-4 minute
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Nasveti</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ Vključi konkretne atrakcije za boljši SEO</li>
                <li>✓ Dodaj vsaj EN in DE za mednarodne goste</li>
                <li>✓ Prave fotografije lahko dodaš kasneje</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Preview + Publish
  // ─────────────────────────────────────────────────────────────
  if (step === "preview") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Landing Page Pripravljena!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Preglej predogled in objavi ko si pripravljen
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setStep("content")}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ← Uredi
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium"
            >
              Objavi Landing Page
            </button>
          </div>
        </div>

        {/* Preview Tabs by Language */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            {selectedLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {LANGUAGES.find((l) => l.code === lang)?.flag} {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Frame */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-4 block" aria-hidden>
                🖼️
              </span>
              <p className="text-gray-500 dark:text-gray-400">Live preview coming soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Pravi iframe preview z možnostjo editiranja
              </p>
            </div>
          </div>
        </div>

        {/* AI Image Generation */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              🖼️ AI predlogi fotografij
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generiraj profesionalne predloge slik za landing page (DALL-E 3)
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {IMAGE_SUGGESTIONS.map(({ key, label }) => {
              const state = suggestedImages[key];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                  {state?.url ? (
                    <div className="space-y-2">
                      <img
                        src={state.url}
                        alt={label}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <a
                        href={state.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Odpri v novem zavihku
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {state?.loading ? (
                        <span className="text-sm text-gray-500">Generiram...</span>
                      ) : (
                        <span className="text-4xl" aria-hidden>📷</span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGenerateImage(key)}
                    disabled={state?.loading}
                    className="w-full min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {state?.loading ? "Generiram..." : state?.url ? "Ponovno generiraj" : "Generiraj sliko"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-3xl mb-2" aria-hidden>
              📄
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Export as HTML
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Prenesi celotno stran za hosting kjerkoli
            </p>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Prenesi HTML
            </button>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-3xl mb-2" aria-hidden>
              🌐
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Publish on Vercel
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Deployaj direktno na tvoj Vercel projekt
            </p>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Deploy
            </button>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-3xl mb-2" aria-hidden>
              🔗
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Get Shareable Link
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Dobi link za pregled pred objavo
            </p>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Kopiraj Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
