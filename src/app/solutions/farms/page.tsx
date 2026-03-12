"use client";

import Link from "next/link";

// ─── Farm Features Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Activities & Experiences",
    icon: "🎯",
    items: [
      "Activity booking system",
      "Degustacije vina",
      "Jahanje konjev",
      "Kulinarične delavnice",
      "Farm tours",
      "Harvest experiences",
    ],
  },
  {
    category: "Product Sales",
    icon: "🛒",
    items: [
      "Online shop integration",
      "Sir in mlečni izdelki",
      "Vino in sokovi",
      "Med in čebelji izdelki",
      "Domače dobrote",
      "Gift packages",
      "Delivery management",
    ],
  },
  {
    category: "Restaurant & Dining",
    icon: "🍽️",
    items: [
      "Restaurant table booking",
      "Farm-to-table meals",
      "Breakfast booking",
      "Group dinners",
      "Wine pairing events",
      "Menu management",
    ],
  },
  {
    category: "Accommodation",
    icon: "🏡",
    items: [
      "Room/apartment management",
      "Farm stay packages",
      "Extended stay discounts",
      "Seasonal pricing",
      "Group bookings",
      "Pet-friendly options",
    ],
  },
  {
    category: "Guest Experience",
    icon: "⭐",
    items: [
      "Multi-language support",
      "Local experience guides",
      "Bike rental",
      "Tour recommendations",
      "Transportation booking",
      "Family-friendly activities",
    ],
  },
  {
    category: "Operations",
    icon: "⚙️",
    items: [
      "Inventory management",
      "Staff scheduling",
      "Supplier management",
      "Cost tracking",
      "Revenue reports",
      "Tax compliance",
    ],
  },
];

const BENEFITS = [
  {
    icon: "💰",
    title: "Dodatni Prihodki",
    value: "+65%",
    description: "Prodaja izdelkov in doživetij",
  },
  {
    icon: "📈",
    title: "Več Gostov",
    value: "+50%",
    description: "Unikatna doživetja privabijo goste",
  },
  {
    icon: "😊",
    title: "Guest Experience",
    value: "4.9⭐",
    description: "Avtentična kmečka izkušnja",
  },
  {
    icon: "🌱",
    title: "Sustainability",
    value: "100%",
    description: "Lokalno in trajnostno",
  },
];

// ─── Main Farms Solutions Page ───────────────────────────────────────────────

export default function FarmsSolutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🚜</div>
            <h1 className="text-5xl font-bold mb-6">
              Rešitev za Turistične Kmetije
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Popoln PMS za turistične kmetije, vinotoče in doživetja. 
              Združite nastanitev, prodajo in aktivnosti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding?type=farm"
                className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                ✨ Brezplačni Trial
              </Link>
              <Link
                href="/demo/farms"
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20"
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
            Vse Funkcije za Turistične Kmetije
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
        <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preprosta Cenitev
          </h2>
          <div className="text-5xl font-bold text-green-600 mb-2">€44</div>
          <div className="text-gray-600 mb-6">na mesec + DDV</div>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Vključuje vse funkcije za turistične kmetije. 
            Posebne cene za večje kmetije z več aktivnostmi.
          </p>
          <Link
            href="/pricing/farms"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
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
            "AgentFlow Pro nam je pomagal povečati prodajo domačih izdelkov za 80%. 
            Gostje lahko bookajo degustacije in aktivnosti na enem mestu."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Janez & Ana Kovač</div>
              <div className="text-gray-600">Lastnika, Kmetija Vinograd</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-green-600 text-white px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Pripravljeni na Začetek?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            14-dnevni brezplačni trial • Brez kreditne kartice • Specializirano za kmetije
          </p>
          <Link
            href="/onboarding?type=farm"
            className="inline-block bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            ✨ Začnite Brezplačno
          </Link>
        </div>
      </div>
    </div>
  );
}
