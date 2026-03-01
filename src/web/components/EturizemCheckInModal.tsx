"use client";

import { useState } from "react";
import { toast } from "sonner";

interface GuestData {
  id: string;
  name: string;
  dateOfBirth: string | null;
  countryCode: string | null;
  documentType: string | null;
  documentId: string | null;
  gender: string | null;
}

interface ArrivalItem {
  id: string;
  guestId?: string | null;
  guestName: string;
  guest?: GuestData | null;
  eturizemSubmittedAt?: string | null;
}

interface EturizemCheckInModalProps {
  arrival: ArrivalItem;
  onClose: () => void;
  onSuccess: () => void;
}

const DOC_TYPES = [
  { value: "P", label: "Potni list" },
  { value: "I", label: "Osebna izkaznica" },
  { value: "V", label: "Viza" },
  { value: "H", label: "Potni list (drugo)" },
  { value: "F", label: "Drugo" },
];

export function EturizemCheckInModal({ arrival, onClose, onSuccess }: EturizemCheckInModalProps) {
  const g = arrival.guest;
  const [form, setForm] = useState({
    dateOfBirth: g?.dateOfBirth ?? "",
    countryCode: g?.countryCode ?? "",
    documentType: g?.documentType ?? "P",
    documentId: g?.documentId ?? "",
    gender: g?.gender ?? "M",
  });
  const [mrzPaste, setMrzPaste] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleParseMrz = async () => {
    const lines = mrzPaste
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast.error("Prilepite 2 ali 3 vrstici MRZ iz potnega lista");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/tourism/eturizem/parse-mrz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mrzLines: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka pri parsiranju");
      setForm((f) => ({
        ...f,
        dateOfBirth: data.dateOfBirth ?? f.dateOfBirth,
        countryCode: data.countryCode ?? f.countryCode,
        documentType: data.documentType ?? f.documentType,
        documentId: data.documentId ?? f.documentId,
        gender: data.gender ?? f.gender,
      }));
      toast.success("MRZ prebran");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.dateOfBirth || !form.countryCode || !form.documentType || !form.documentId) {
      toast.error("Izpolnite vse obvezne podatke (datum rojstva, država, vrsta dokumenta, številka)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tourism/eturizem/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: arrival.id,
          guestUpdates: {
            dateOfBirth: form.dateOfBirth,
            countryCode: form.countryCode,
            documentType: form.documentType,
            documentId: form.documentId,
            gender: form.gender,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka pri pošiljanju");
      toast.success("Prijava v eTurizem uspešna");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prijava v eTurizem: {arrival.guestName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Zapri"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MRZ (prilepite 2–3 vrstici iz potnega lista)
            </label>
            <textarea
              value={mrzPaste}
              onChange={(e) => setMrzPaste(e.target.value)}
              placeholder="I&lt;UTOD23145890&lt;1233..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={handleParseMrz}
              disabled={parsing || mrzPaste.trim().length < 20}
              className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {parsing ? "Branje..." : "Preberi MRZ"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="eturizem-dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum rojstva *
              </label>
              <input
                id="eturizem-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                aria-label="Datum rojstva"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="eturizem-country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Država (ISO 2) *
              </label>
              <input
                id="eturizem-country"
                type="text"
                value={form.countryCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))
                }
                placeholder="SI"
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="eturizem-doctype" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vrsta dokumenta *
            </label>
            <select
              id="eturizem-doctype"
              value={form.documentType}
              onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
              aria-label="Vrsta dokumenta"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="eturizem-docid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Številka dokumenta *
            </label>
            <input
              id="eturizem-docid"
              type="text"
              value={form.documentId}
              onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}
              placeholder="123456789"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="eturizem-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Spol
            </label>
            <select
              id="eturizem-gender"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              aria-label="Spol"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              <option value="M">Moški</option>
              <option value="F">Ženski</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
          >
            Prekliči
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.dateOfBirth || !form.countryCode || !form.documentId}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Pošiljam..." : "Pošlji v AJPES"}
          </button>
        </div>
      </div>
    </div>
  );
}
