"use client";

import Link from "next/link";

// ─── Camp Features Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Site & Parcel Management",
    icon: "🏕️",
    items: [
      "Site/parcel mapping",
      "Electric hookups",
      "Water connections",
      "Sewage management",
      "Size-based pricing",
      "Shade/sun preferences",
    ],
  },
  {
    category: "Equipment & Rentals",
    icon: "🚴",
    items: [
      "Bike rental",
      "Boat rental",
      "Camping equipment",
      "BBQ grill rental",
      "Sports equipment",
      "Kids equipment",
      "Inventory tracking",
    ],
  },
  {
    category: "Seasonal Pricing",
    icon: "📅",
    items: [
      "High/low season rates",
      "Weekend pricing",
      "Holiday surcharges",
      "Length-of-stay discounts",
      "Early bird discounts",
      "Last-minute deals",
      "Group rates",
    ],
  },
  {
    category: "Facilities Management",
    icon: "🚿",
    items: [
      "Sanitary facilities tracking",
      "Cleaning schedules",
      "Maintenance requests",
      "Supply management",
      "Opening hours",
      "Accessibility info",
    ],
  },
  {
    category: "Activities & Experiences",
    icon: "🎯",
    items: [
      "Guided tours",
      "Water sports",
      "Hiking trails",
      "Cycling routes",
      "Evening events",
      "Kids activities",
      "Pet-friendly areas",
    ],
  },
  {
    category: "Guest Services",
    icon: "💁",
    items: [
      "Check-in/check-out",
      "Tourist information",
      "Local recommendations",
      "Transportation booking",
      "Grocery delivery",
      "Laundry service",
    ],
  },
];

const BENEFITS = [
  {
    icon: "📈",
    title: "Več Rezervacij",
    value: "+55%",
    description: "Online booking in equipment rental",
  },
  {
    icon: "💰",
    title: "Dodatni Prihodki",
    value: "+45%",
    description: "Najem opreme in aktivnosti",
  },
  {
    icon: "😊",
    title: "Guest Satisfaction",
    value: "4.8⭐",
    description: "Easy booking in dobre storitve",
  },
  {
    icon: "⚡",
    title: "Hitrejši Check-in",
    value: "-70%",
    description: "Digitalni check-in proces",
  },
];

// ─── Main Camps Solutions Page ───────────────────────────────────────────────

export default function CampsSolutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">⛺</div>
            <h1 className="text-5xl font-bold mb-6">
              Rešitev za Kampe in Glamping
            </h1>
            <p className="text-xl text-yellow-100 max-w-3xl mx-auto mb-8">
              Popoln PMS za kampinge, glamping resort-e in outdoor nastanitve. 
              Upravljajte parcele, opremo in aktivnosti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding?type=camp"
                className="bg-white text-yellow-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                ✨ Brezplačni Trial
              </Link>
              <Link
                href="/demo/camps"
                className="bg-yellow-700 hover:bg-yellow-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20"
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
            Vse Funkcije za Kampinge
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
        <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preprosta Cenitev
          </h2>
          <div className="text-5xl font-bold text-yellow-600 mb-2">€44</div>
          <div className="text-gray-600 mb-6">na mesec + DDV</div>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Vključuje vse funkcije za kampinge do 100 parcel. 
            Za večje kampinge prilagodimo cenitev glede na kapaciteto.
          </p>
          <Link
            href="/pricing/camps"
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
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
            "AgentFlow Pro nam je pomagal povečati zasedenost za 60%. 
            Gostje lahko bookajo parcele in najamejo opremo online."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Marko Berjak</div>
              <div className="text-gray-600">Direktor, Kamp Jezero ****</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-yellow-600 text-white px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Pripravljeni na Začetek?
          </h2>
          <p className="text-yellow-100 mb-8 text-lg">
            14-dnevni brezplačni trial • Brez kreditne kartice • Specializirano za kampinge
          </p>
          <Link
            href="/onboarding?type=camp"
            className="inline-block bg-white text-yellow-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            ✨ Začnite Brezplačno
          </Link>
        </div>
      </div>
    </div>
  );
}
