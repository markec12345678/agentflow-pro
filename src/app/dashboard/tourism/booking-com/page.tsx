"use client";

import Link from "next/link";

export default function BookingComPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/tourism"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Tourism Hub
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Booking.com Partner
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        4–8 tednov čakanja; vsak dan zamude = zamujeno partnerstvo. Glej vodilo spodaj.
      </p>

      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <section>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Tip registracije
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <strong>Connectivity partner</strong> (API):{" "}
              <a
                href="https://partner.booking.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                partner.booking.com
              </a>
              {" "}– API integracija za PMS
            </li>
            <li>
              <strong>Affiliate partner</strong>:{" "}
              <a
                href="https://partnerships.booking.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                partnerships.booking.com
              </a>
              {" "}– promocija linkov, provizije
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Koraki – Connectivity partner
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              Obiski: partner.booking.com → Sign up, preberi pogoje
            </li>
            <li>
              Priprava: uporabi <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">src/lib/booking-com-partnership.ts</code> → <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">generatePartnershipApplication()</code>
            </li>
            <li>
              Dokumenti: poslovna registracija, GDPR, tehnična specifikacija
            </li>
            <li>
              Pošlji aplikacijo; čakanje 4–8 tednov
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Status (za sledenje)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Odločitev: Connectivity / Affiliate / Oba · Datum prijave · Status odziva
          </p>
        </section>

        <Link
          href="https://partner.booking.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
        >
          Odpri partner.booking.com →
        </Link>
      </div>
    </div>
  );
}
