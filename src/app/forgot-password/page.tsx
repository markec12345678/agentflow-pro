"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/v1/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.data?.message ?? "Če račun obstaja, boste prejeli e-pošto s povezavo za ponastavitev gesla.");
      } else {
        setStatus("error");
        const err = data.error;
        setMessage(typeof err === "object" && err?.message ? err.message : (typeof err === "string" ? err : "Prišlo je do napake."));
      }
    } catch {
      setStatus("error");
      setMessage("Prišlo je do napake. Poskusite znova.");
    }
  };

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Preverite e-pošto
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Nazaj na prijavo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pozabljeno geslo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Vnesite e-poštni naslov vašega računa. Poslali vam bomo povezavo za ponastavitev gesla.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-pošta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
              placeholder="vas@email.com"
            />
          </div>
          {status === "error" && (
            <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "loading" ? "Pošiljanje..." : "Pošlji povezavo"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Nazaj na prijavo
          </Link>
        </p>
      </div>
    </main>
  );
}
