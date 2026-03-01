"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

// ─── Tipi nastanitev ──────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { id: "hotel", icon: "🏨", label: "Hotel" },
  { id: "hostel", icon: "🛏️", label: "Hostel" },
  { id: "apartma", icon: "🏠", label: "Apartma / Hiša" },
  { id: "vila", icon: "🌿", label: "Vila / Resort" },
  { id: "kamp", icon: "⛺", label: "Kamp / Glamping" },
  { id: "agencija", icon: "✈️", label: "Turistična agencija" },
];

// ─── Kaj potrebuješ najprej ───────────────────────────────────────────────────
const FIRST_NEEDS = [
  { id: "booking-description", icon: "📋", label: "Opis nastanitve", desc: "Za Booking.com, Airbnb..." },
  { id: "guest-welcome-email", icon: "📧", label: "Email za goste", desc: "Dobrodošlica, info..." },
  { id: "destination-guide", icon: "📍", label: "Vodič destinacije", desc: "SEO blog, Google..." },
  { id: "instagram-travel", icon: "📱", label: "Social media post", desc: "Instagram, Facebook..." },
];

// ─── Jeziki ───────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "sl", label: "SL 🇸🇮" },
  { id: "en", label: "EN 🇬🇧" },
  { id: "de", label: "DE 🇩🇪" },
  { id: "it", label: "IT 🇮🇹" },
  { id: "hr", label: "HR 🇭🇷" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("sl");
  const [firstNeed, setFirstNeed] = useState("");
  const [saving, setSaving] = useState(false);

  const isAuthenticated = status === "authenticated" && !!session;

  // Restore draft from sessionStorage (e.g. after login redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = sessionStorage.getItem("onboarding-draft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.step) setStep(data.step);
        if (data.propertyType) setPropertyType(data.propertyType);
        if (data.propertyName) setPropertyName(data.propertyName);
        if (data.location) setLocation(data.location);
        if (data.language) setLanguage(data.language);
        sessionStorage.removeItem("onboarding-draft");
      } catch {
        sessionStorage.removeItem("onboarding-draft");
      }
    }
  }, []);

  // Save draft when step 3 and not authenticated (before redirect to auth)
  useEffect(() => {
    if (step === 3 && !isAuthenticated && status !== "loading" && typeof window !== "undefined") {
      sessionStorage.setItem(
        "onboarding-draft",
        JSON.stringify({ step: 3, propertyType, propertyName, location, language })
      );
    }
  }, [step, isAuthenticated, status, propertyType, propertyName, location, language]);

  // ─── Shrani & pojdi na generate ─────────────────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: propertyType === "agencija" ? "travel-agency" : "tourism",
          workspace_name: propertyName || "Moja nastanitev",
          property_type: propertyType,
          location,
          language,
          role: "hotel-marketing",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { propertyId?: string };
      if (res.ok && data.propertyId) {
        try {
          await fetch("/api/user/active-property", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: data.propertyId }),
          });
        } catch {
          // fire-and-forget, ne blokira redirect
        }
      }
      // Pojdi direktno na generate z izbranim templat-om
      const url = firstNeed
        ? `/generate?template=${firstNeed}&name=${encodeURIComponent(propertyName)}&location=${encodeURIComponent(location)}&lang=${language}`
        : "/dashboard";
      router.push(url);
    } catch {
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">

        {/* Progress */}
        <div className="mb-6 text-center">
          <p className="text-blue-300 text-sm mb-3">Korak {step} od {totalSteps}</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`h-2 rounded-full transition-all duration-500 ${n <= step ? "bg-blue-400 w-16" : "bg-white/20 w-8"
                  }`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-blue-300">{pct}% dokončano</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">

          {/* ─── KORAK 1: Tip nastanitve ───────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">👋</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dobrodošli v AgentFlow Pro!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Katera vrsta nastanitve ste?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setPropertyType(pt.id);
                      setStep(2);
                    }}
                    className="flex flex-col items-center gap-2 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group cursor-pointer"
                  >
                    <span className="text-3xl">{pt.icon}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">{pt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── KORAK 2: Ime + lokacija ───────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">
                  {PROPERTY_TYPES.find(p => p.id === propertyType)?.icon ?? "🏨"}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Povejte nam o sebi
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  AI bo prilagodil vsebino za vas
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ime nastanitve *
                  </label>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={e => setPropertyName(e.target.value)}
                    placeholder="npr. Hotel Krim, Apartma Bled..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:border-blue-500 transition-colors text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Lokacija *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="npr. Bled, Kranjska Gora, Ljubljana..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:border-blue-500 transition-colors text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Jezik vsebine
                  </label>
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

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                >
                  ← Nazaj
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!propertyName.trim() || !location.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg transition-all"
                >
                  Naprej →
                </button>
              </div>
            </div>
          )}

          {/* ─── KORAK 3: Kaj potrebuješ najprej ─────────────────────────── */}
          {step === 3 && (
            <div>
              {!isAuthenticated && status !== "loading" ? (
                <>
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔐</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ustvarite račun za nadaljevanje
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Vaši podatki ({propertyName}, {location}) bodo shranjeni v vašem računu.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Link
                      href="/register?callbackUrl=/onboarding"
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all"
                    >
                      Ustvari račun
                    </Link>
                    <Link
                      href="/login?callbackUrl=/onboarding"
                      className="flex-1 text-center border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 py-4 rounded-xl font-semibold text-gray-700 dark:text-gray-300 transition-all"
                    >
                      Imam že račun
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                  >
                    ← Nazaj
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Kaj boste naredili najprej?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      AI bo takoj generiral primer za <strong>{propertyName}</strong>
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {FIRST_NEEDS.map(need => (
                      <button
                        key={need.id}
                        type="button"
                        onClick={() => setFirstNeed(need.id)}
                        className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all ${firstNeed === need.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                      >
                        <span className="text-3xl">{need.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{need.label}</p>
                          <p className="text-sm text-gray-500">{need.desc}</p>
                        </div>
                        {firstNeed === need.id && (
                          <span className="ml-auto text-blue-500 text-xl">✓</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      ← Nazaj
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={saving}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Nalagam...
                        </>
                      ) : (
                        <>
                          🚀 Začnimo!
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Brez kreditne kartice • 7 dni brezplačno
                  </p>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
