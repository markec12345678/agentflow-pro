"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface GuestForm {
  dateOfBirth: string;
  countryCode: string;
  documentType: string;
  documentId: string;
  gender: string;
}

const DOC_TYPES = [
  { value: "P", label: "Potni list" },
  { value: "I", label: "Osebna izkaznica" },
  { value: "V", label: "Viza" },
];

export default function CheckInPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [guestName, setGuestName] = useState("");
  const [form, setForm] = useState<GuestForm>({
    dateOfBirth: "",
    countryCode: "",
    documentType: "P",
    documentId: "",
    gender: "M",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mrzPaste, setMrzPaste] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Manjkajoč token");
      return;
    }
    fetch(`/api/v1/tourism/eturizem/check-in?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error ?? "Rezervacija ni najdena");
          return;
        }
        setGuestName(data.guestName ?? "Gost");
        setStatus("form");
        return data;
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Napaka pri nalaganju");
      });
  }, [token]);

  const handleParseMrz = async () => {
    const lines = mrzPaste.split(/[\r\n]+/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    try {
      const res = await fetch("/api/v1/tourism/eturizem/parse-mrz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mrzLines: lines }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({
          ...f,
          dateOfBirth: data.dateOfBirth ?? f.dateOfBirth,
          countryCode: data.countryCode ?? f.countryCode,
          documentType: data.documentType ?? f.documentType,
          documentId: data.documentId ?? f.documentId,
          gender: data.gender ?? f.gender,
        }));
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dateOfBirth || !form.countryCode || !form.documentId) {
      setErrorMsg("Izpolnite vse obvezne podatke");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/tourism/eturizem/check-in-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          guestUpdates: form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Napaka");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Nalagam...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
          <p className="text-sm text-gray-500 mt-2">Povezava je morda neveljavna ali je potekla.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            Prijava uspešna
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hvala! Vaši podatki so bili prijavljeni. Prijeten bivanje!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Self check-in: {guestName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Izpolnite podatke iz osebnega dokumenta za prijavo v nastanitev.
        </p>

        <div className="mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
          <label htmlFor="checkin-mrz" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prilepi MRZ vrstice (2–3 vrstice)
          </label>
          <textarea
            id="checkin-mrz"
            value={mrzPaste}
            onChange={(e) => setMrzPaste(e.target.value)}
            placeholder="Prilepi 2–3 MRZ vrstice iz dokumenta..."
            rows={3}
            aria-label="MRZ vrstice iz dokumenta"
            className="w-full rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleParseMrz}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Parsiraj in izpolni
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="checkin-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Datum rojstva *
            </label>
            <input
              id="checkin-date"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              required
              aria-label="Datum rojstva"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="checkin-country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Država (ISO 2) *
            </label>
            <input
              id="checkin-country"
              type="text"
              value={form.countryCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))
              }
              placeholder="SI"
              maxLength={2}
              required
              aria-label="Država ISO koda"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="checkin-doctype" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vrsta dokumenta *
            </label>
            <select
              id="checkin-doctype"
              value={form.documentType}
              onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
              aria-label="Vrsta dokumenta"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="checkin-docid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Številka dokumenta *
            </label>
            <input
              id="checkin-docid"
              type="text"
              value={form.documentId}
              onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}
              required
              aria-label="Številka dokumenta"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="checkin-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Spol
            </label>
            <select
              id="checkin-gender"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              aria-label="Spol"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="M">Moški</option>
              <option value="F">Ženski</option>
            </select>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Pošiljam..." : "Pošlji prijavo"}
          </button>
        </form>
      </div>
    </div>
  );
}
