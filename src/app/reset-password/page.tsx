"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Manjka žeton za ponastavitev.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Geslo mora imeti vsaj 8 znakov.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Gesli se ne ujemata.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.data?.message ?? "Geslo uspešno posodobljeno.");
      } else {
        setStatus("error");
        setMessage(data.error?.message ?? data.error ?? "Prišlo je do napake.");
      }
    } catch {
      setStatus("error");
      setMessage("Prišlo je do napake. Poskusite znova.");
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Neveljavna povezava
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Povezava za ponastavitev gesla manjka ali je neveljavna. Zahtevajte novo povezavo.
          </p>
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

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Geslo posodobljeno
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Prijava
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Ponastavitev gesla
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Vnesite novo geslo. Mora imeti vsaj 8 znakov.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Novo geslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
              placeholder="Vsaj 8 znakov"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Potrdi geslo
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
              placeholder="Ponovi geslo"
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
            {status === "loading" ? "Shranjevanje..." : "Shrani geslo"}
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
