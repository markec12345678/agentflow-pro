"use client";

import Link from "next/link";

// ─── Hotel Features Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Front Desk Operations",
    icon: "🏨",
    items: [
      "Check-in/Check-out management",
      "Guest registration",
      "Room assignment",
      "Key card management",
      "Guest check-in kiosk",
      "Express check-out",
    ],
  },
  {
    category: "Housekeeping",
    icon: "🧹",
    items: [
      "Room status tracking (čisto/umazano)",
      "Cleaning task assignment",
      "Housekeeping mobile app",
      "Inspection checklists",
      "Laundry management",
      "Maintenance requests",
      "Porčila po nadstropjih",
    ],
  },
  {
    category: "Revenue Management",
    icon: "💰",
    items: [
      "Dynamic pricing",
      "Competitor rate shopping",
      "Seasonal pricing rules",
      "Occupancy-based pricing",
      "Revenue forecasting",
      "Channel management",
    ],
  },
  {
    category: "Guest Experience",
    icon: "⭐",
    items: [
      "Unified inbox",
      "AI messaging (93% automation)",
      "Guest profiles & CRM",
      "Review management",
      "Digital guidebook",
      "Room service ordering",
      "Conierge services",
    ],
  },
  {
    category: "Multi-Property",
    icon: "🏢",
    items: [
      "Central dashboard",
      "Cross-property reporting",
      "Shared resources",
      "Staff rotation",
      "Consolidated billing",
      "Brand standards",
    ],
  },
  {
    category: "POS & F&B",
    icon: "🍽️",
    items: [
      "Restaurant POS",
      "Bar management",
      "Room service",
      "Mini-bar tracking",
      "Inventory management",
      "Recipe costing",
    ],
  },
];

const BENEFITS = [
  {
    icon: "⏱️",
    title: "Prihranek Časa",
    value: "27 ur/teden",
    description: "Avtomatizacija routine opravil",
  },
  {
    icon: "📈",
    title: "Več Prihodkov",
    value: "+35%",
    description: "Boljša zasedenost in pricing",
  },
  {
    icon: "😊",
    title: "Guest Satisfaction",
    value: "4.8⭐",
    description: "Hitrejši odzivi in boljša storitev",
  },
  {
    icon: "💵",
    title: "Lower Costs",
    value: "-40%",
    description: "Manj administracije in napak",
  },
];

// ─── Main Hotel Solutions Page ────────────────────────────────────────────────

export default function HotelsSolutionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h1 className="text-5xl font-bold mb-6">
              Rešitev za Hotele
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Popoln PMS za hotele, hostle, boutique hotele in penzione. 
              Vse kar potrebujete za uspešno vodenje hotela.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding?type=hotel"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                ✨ Brezplačni Trial
              </Link>
              <Link
                href="/demo/hotels"
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20"
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
            Vse Funkcije za Vodenje Hotela
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
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preprosta Cenitev
          </h2>
          <div className="text-5xl font-bold text-blue-600 mb-2">€44</div>
          <div className="text-gray-600 mb-6">na mesec + DDV</div>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Vključuje vse funkcije za hotele do 50 sob. 
            Za večje hotele prilagodimo cenitev glede na število sob.
          </p>
          <Link
            href="/pricing/hotels"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
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
            "AgentFlow Pro je popolnoma spremenil način vodenja našega hotela. 
            Housekeeping deluje kot ura, gostje so zadovoljnejši, mi pa prihranimo 20 ur na teden."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Janez Novak</div>
              <div className="text-gray-600">Direktor, Hotel Slon ****</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 text-white px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Pripravljeni na Začetek?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            14-dnevni brezplačni trial • Brez kreditne kartice • Namestitev v 1 uri
          </p>
          <Link
            href="/onboarding?type=hotel"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            ✨ Začnite Brezplačno
          </Link>
        </div>
      </div>
    </div>
  );
}
