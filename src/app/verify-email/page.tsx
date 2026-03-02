"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Manjka žeton za potrditev.");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const urlEmail = searchParams?.get("email");
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.data?.message ?? "E-pošta uspešno potrjena.");
        } else {
          setStatus("error");
          setMessage(data.error?.message ?? data.error ?? "Neveljaven ali potekel žeton.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Prišlo je do napake. Poskusite znova.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Potrjevanje e-pošte...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
        {status === "success" ? (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              E-pošta potrjena
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Nadaljuj na dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✕</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Napaka
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Nazaj na prijavo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
