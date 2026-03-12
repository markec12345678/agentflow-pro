"use client";

import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PropertyType {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  price: string;
  popular?: boolean;
}

// ─── Property Types Data ──────────────────────────────────────────────────────
const PROPERTY_TYPES: PropertyType[] = [
  {
    id: "hotels",
    name: "Hoteli",
    icon: "🏨",
    description: "Za hotele, hostle, boutique hotele in penzione",
    features: [
      "Housekeeping management",
      "Room status (čisto/umazano)",
      "Multi-property support",
      "Shift management",
      "Room service ordering",
      "Porčila po nadstropjih",
      "Guest check-in kiosk",
      "POS integration",
    ],
    price: "€44/mesec",
    popular: true,
  },
  {
    id: "apartments",
    name: "Apartmaji",
    icon: "🏢",
    description: "Za apartmaje, studio sobe in vacation rentals",
    features: [
      "Self check-in navodila",
      "Smart lock integration",
      "Owner statements",
      "Cleaning task management",
      "Multi-calendar sync",
      "Automated messaging",
      "Dynamic pricing",
      "Direct booking website",
    ],
    price: "€39/mesec",
    popular: true,
  },
  {
    id: "farms",
    name: "Turistične Kmetije",
    icon: "🚜",
    description: "Za kmetije, vinotoče in doživetja",
    features: [
      "Activities booking (jahanje, degustacije)",
      "Product sales (sir, vino, med)",
      "Restaurant/table management",
      "Doživetja booking",
      "Kolesa/aktivnosti rental",
      "Tour booking",
      "Multi-language support",
      "Guest experience management",
    ],
    price: "€44/mesec",
  },
  {
    id: "camps",
    name: "Kampi / Glamping",
    icon: "⛺",
    description: "Za kampinge, glamping resort-e in outdoor stays",
    features: [
      "Site/parcel management",
      "Oprema (elektrika, voda, kanalizacija)",
      "Dnevne cene po sezoni",
      "Rezervacija opreme",
      "Sanitary facilities tracking",
      "Aktivnosti (kolesa, čolni...)",
      "Length-of-stay rules",
      "Equipment rental",
    ],
    price: "€44/mesec",
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function FeatureCheck({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <span className="text-green-500 mt-0.5">✓</span>
      <span>{text}</span>
    </li>
  );
}

function PropertyTypeCard({ type }: { type: PropertyType }) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
        type.popular ? "border-blue-600" : "border-gray-200"
      }`}
    >
      {type.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            ⭐ NAJPRILJUBLJENEJŠI
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">{type.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{type.description}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">{type.price}</div>
          <div className="text-sm text-gray-500">z DDV</div>
        </div>

        <ul className="space-y-3 mb-6 min-h-[240px]">
          {type.features.map((feature, index) => (
            <FeatureCheck key={index} text={feature} />
          ))}
        </ul>

        <Link
          href={`/solutions/${type.id}/demo`}
          className={`block w-full py-3 px-4 rounded-lg text-center font-semibold transition-colors ${
            type.popular
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          👉 Ogled {type.name}
        </Link>
      </div>
    </div>
  );
}

// ─── Main Solutions Page ──────────────────────────────────────────────────────

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏷️ Rešitve za Vsak Tip Nastanitve
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            AgentFlow Pro se prilagodi vašemu tipu nastanitve. 
            Izberite rešitev ki najbolj ustreza vašemu poslu.
          </p>
        </div>
      </div>

      {/* Property Types Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROPERTY_TYPES.map((type) => (
            <PropertyTypeCard key={type.id} type={type} />
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Primerjava Funkcij
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Funkcija</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">🏨 Hoteli</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">🏢 Apartmaji</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">🚜 Kmetije</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">⛺ Kampi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "PMS", all: true },
                  { feature: "Channel Manager", all: true },
                  { feature: "Booking Engine", all: true },
                  { feature: "Unified Inbox", all: true },
                  { feature: "Housekeeping", hotels: true, camps: true },
                  { feature: "Smart Locks", apartments: true },
                  { feature: "Activities Booking", farms: true, camps: true },
                  { feature: "Product Sales", farms: true },
                  { feature: "Site Management", camps: true },
                  { feature: "Multi-property", hotels: true, apartments: true },
                  { feature: "Owner Statements", apartments: true },
                  { feature: "POS Integration", hotels: true, farms: true },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {row.all || row.hotels ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">✗</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.all || row.apartments ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">✗</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.all || row.farms ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">✗</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.all || row.camps ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white px-8 py-12 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Začnite Brezplačno Še Danes
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            14-dnevni brezplačni trial • Brez kreditne kartice • Odpoveste kadar koli
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              ✨ Začni Brezplačno
            </Link>
            <Link
              href="/demo"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20"
            >
              📹 Ogled Dema
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
