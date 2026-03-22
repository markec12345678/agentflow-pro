"use client";

import Link from "next/link";

// ─── Apartment Features Data ─────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Self Check-in",
    icon: "🔑",
    items: [
      "Digital check-in navodila",
      "Smart lock integration",
      "Keyless entry",
      "Auto send access codes",
      "Video check-in",
      "Mobile key",
    ],
  },
  {
    category: "Owner Management",
    icon: "👤",
    items: [
      "Owner statements",
      "Revenue sharing",
      "Automated payouts",
      "Owner portal",
      "Monthly reports",
      "Tax documents",
    ],
  },
  {
    category: "Cleaning & Maintenance",
    icon: "🧹",
    items: [
      "Cleaning task management",
      "Turnover automation",
      "Inspection checklists",
      "Maintenance tracking",
      "Supply inventory",
      "Photo verification",
    ],
  },
  {
    category: "Multi-Channel",
    icon: "🔄",
    items: [
      "Multi-calendar sync",
      "Airbnb sync",
      "Booking.com sync",
      "Vrbo sync",
      "Direct bookings",
      "Auto-update availability",
    ],
  },
  {
    category: "Guest Communication",
    icon: "💬",
    items: [
      "Automated messaging",
      "Check-in instructions",
      "Local recommendations",
      "Review requests",
      "AI responses (93% automation)",
      "Multi-language support",
    ],
  },
  {
    category: "Revenue Optimization",
    icon: "💰",
    items: [
      "Dynamic pricing",
      "Seasonal rates",
      "Weekend pricing",
      "Last-minute deals",
      "Length-of-stay discounts",
      "Competitor analysis",
    ],
  },
];

const BENEFITS = [
  {
    icon: "⏱️",
    title: "Prihranek Časa",
    value: "15 ur/teden",
    description: "Avtomatizacija komunikacije in check-in",
  },
  {
    icon: "📈",
    title: "Več Prihodkov",
    value: "+40%",
    description: "Dynamic pricing in večja zasedenost",
  },
  {
    icon: "😊",
    title: "Guest Satisfaction",
    value: "4.9⭐",
    description: "Hiter odziv in self check-in",
  },
  {
    icon: "💵",
    title: "Lower Fees",
    value: "-60%",
    description: "Manj provizij z direktnimi bookingi",
  },
];

// ─── Main Apartments Solutions Page ──────────────────────────────────────────

export default function ApartmentsSolutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-800 text-white px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-5xl font-bold mb-6">
              Rešitev za Apartmaje
            </h1>
            <p className="text-xl text-rose-100 max-w-3xl mx-auto mb-8">
              Popoln PMS za apartmaje, studio sobe in vacation rentals. 
              Vse kar potrebujete za upravljanje najemov.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding?type=apartment"
                className="bg-white text-rose-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                ✨ Brezplačni Trial
              </Link>
              <Link
                href="/demo/apartments"
                className="bg-rose-700 hover:bg-rose-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20"
              >
                📹 Ogled Dema
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{benefit.value}</div>
              <div className="font-semibold text-gray-900 mb-2">{benefit.title}</div>
              <div className="text-sm text-gray-600">{benefit.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border-t border-b border-gray-200 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Vse Funkcije za Upravljanje Apartmajev
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900">{category.category}</h3>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-rose-50 rounded-2xl border-2 border-rose-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preprosta Cenitev
          </h2>
          <div className="text-5xl font-bold text-rose-600 mb-2">€39</div>
          <div className="text-gray-600 mb-6">na mesec + DDV</div>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Vključuje vse funkcije za do 5 apartmajev. 
            Za večje objekte prilagodimo cenitev glede na število enot.
          </p>
          <Link
            href="/pricing/apartments"
            className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            👉 Izberi Plan
          </Link>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-white border-t border-gray-200 px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">💬</div>
          <blockquote className="text-2xl text-gray-900 font-medium mb-6">
            "AgentFlow Pro mi je olajšal upravljanje 3 apartmajev. Self check-in deluje 
            popolnoma, gostje so navdušeni, jaz pa imam več časa zase."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-rose-200 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Maja Zupan</div>
              <div className="text-gray-600">Lastnica, Apartmaji Bled</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-rose-600 text-white px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Pripravljeni na Začetek?
          </h2>
          <p className="text-rose-100 mb-8 text-lg">
            14-dnevni brezplačni trial • Brez kreditne kartice • Namestitev v 30 minutah
          </p>
          <Link
            href="/onboarding?type=apartment"
            className="inline-block bg-white text-rose-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            ✨ Začnite Brezplačno
          </Link>
        </div>
      </div>
    </div>
  );
}
