"use client";

import { useState } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { toast } from "sonner";
import { substitutePrompt } from '@/core/domain/tourism/substitute-prompt';
import { Skeleton, SkeletonText } from "@/web/components/Skeleton";

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Pred prihodom gosta – dobrodošlica + check-in navodila",
    prompt: `Napiši topel welcome email za gosta pred prihodom.
Vključi:
- Osebno dobrodošlico z imenom nastanitve
- Check-in navodila (naslov, kontakt, kodna ključavnica)
- Priporočila za prvi dan (kavarna, supermarket, atrakcija)
- Kontakt za nujna vprašanja
- Povezavo do Google Maps lokacije

Ton: topel, jasen, koristen
Jezik: {jezik}
Nastanitev: {name}, {location}
Check-in: {checkin_time}, Check-out: {checkout_time}`,
  },
  {
    id: "followup",
    name: "Follow-up Email",
    description: "Po odhodu gosta – hvala + prošnja za review",
    prompt: `Napiši follow-up email po odhodu gosta.
Vključi:
- Iskreno hvalo za obisk
- Prošnjo za review na Booking/Google (z direktnim linkom)
- Ponudbo za popust pri naslednjem bivanju
- Povabilo da se vrnejo

Ton: prijazen, ne preveč prodajen
Jezik: {jezik}
Nastanitev: {name}`,
  },
  {
    id: "seasonal",
    name: "Sezonska Ponudba",
    description: "Email za pretekle goste o novi sezoni/ponudbi",
    prompt: `Napiši sezonski email za pretekle goste.
Vključi:
- Osebni nagovor (upoštevaj da so že bili pri nas)
- Novosti v nastanitvi ali okolici
- Posebno ponudbo za zgodnje rezervacije
- Omejitev časa za akcijo

Ton: navdušen, ekskluziven
Jezik: {jezik}
Sezona: {sezona}
Posebna ponudba: {ponudba}`,
  },
];

export default function TourismEmailWorkflow() {
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0].id);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    guestName: "",
    checkin_time: "15:00",
    checkout_time: "10:00",
    jezik: "sl",
    sezona: "",
    ponudba: "",
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setOutput("");
    const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template) {
      setLoading(false);
      return;
    }

    try {
      const prompt = substitutePrompt(template.prompt, formData);
      const response = await fetch("/api/v1/tourism/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, variables: formData }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.content ?? "");
    } catch (err) {
      logger.error("Email generation failed:", err);
      toast.error(err instanceof Error ? err.message : "Napaka pri generiranju.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success("Kopirano v odložišče");
    }
  };

  const gmailLink = output
    ? `mailto:?body=${encodeURIComponent(output)}`
    : "#";

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Generator za Goste
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hitro ustvari profesionalne emaile za vsako fazo gostovega potovanja
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Izberi Tip Emaila
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {EMAIL_TEMPLATES.map((tpl) => (
                  <label
                    key={tpl.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate === tpl.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    <input
                      type="radio"
                      name="email-template"
                      value={tpl.id}
                      checked={selectedTemplate === tpl.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mt-1 accent-blue-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {tpl.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tpl.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Podatki za Email
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ime Nastanitve
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Vnesite ime nastanitve"
                    placeholder="npr. Apartmaji Bela Krajina"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Lokacija
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Vnesite lokacijo"
                    placeholder="npr. Črnomelj"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ime Gosta (opcijsko)
                  </label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="npr. Ana"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Jezik
                  </label>
                  <select
                    value={formData.jezik}
                    onChange={(e) => setFormData({ ...formData, jezik: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Izberite jezik za email"
                  >
                    <option value="sl">Slovenščina</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Check-in
                  </label>
                  <input
                    type="text"
                    value={formData.checkin_time}
                    onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Check-in čas"
                    placeholder="Vnesite check-in čas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Check-out
                  </label>
                  <input
                    type="text"
                    value={formData.checkout_time}
                    onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Check-out čas"
                    placeholder="Vnesite check-out čas"
                  />
                </div>
              </div>

              {selectedTemplate === "seasonal" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Sezona / Dogodek
                    </label>
                    <input
                      type="text"
                      value={formData.sezona}
                      onChange={(e) => setFormData({ ...formData, sezona: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="npr. Poletje 2026, Velika Noč..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Posebna Ponudba
                    </label>
                    <textarea
                      value={formData.ponudba}
                      onChange={(e) => setFormData({ ...formData, ponudba: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      title="Vnesite ponudbo"
                      placeholder="npr. 15% popust za rezervacije do 31.3."
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                {loading ? "Generiram..." : "Generiraj Email"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Rezultat
              </h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-4">
                  <SkeletonText lines={12} className="rounded-xl" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              ) : output ? (
                <div className="space-y-4">
                  <textarea
                    value={output}
                    readOnly
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none"
                    title="Generirana e-pošta"
                    placeholder="Generirana e-pošta se bo prikazala tukaj"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Kopiraj vsebino v odložišče"
                      className="min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                    >
                      Kopiraj
                    </button>
                    <a
                      href={gmailLink}
                      className="min-h-[44px] inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                    >
                      Pošlji prek Gmaila
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Izpolni form in klikni &quot;Generiraj&quot; za prikaz emaila.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
