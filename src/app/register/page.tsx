"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/providers")
      .then((r) => r.json())
      .then((data: { google?: boolean }) => setGoogleEnabled(!!data?.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function handleGoogleSignIn() {
    if (!googleEnabled) {
      setError("Google prijava ni konfigurirana.");
      return;
    }
    setError("");
    try {
      await signIn("google", { redirectTo: "/onboarding" });
    } catch (error) {
      console.error("[Register] Google sign in error:", error);
      setError("Google prijava ni uspela. Poskusi ponovno.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Geslo mora imeti vsaj 8 znakov");
      return;
    }
    setLoading(true);
    try {
      const normEmail = email.trim().toLowerCase();
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normEmail, password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = typeof data.error === "object" && data.error?.message ? data.error.message : (data.error ?? "Registracija ni uspela");
        setError(typeof errMsg === "string" ? errMsg : "Registracija ni uspela");
        return;
      }
      const signInRes = await signIn("credentials", {
        email: normEmail,
        password,
        redirect: false,
        callbackUrl: "/onboarding",
      });
      if (signInRes?.error) {
        setError("Račun ustvarjen! Prijavite se spodaj.");
        return;
      }
      await update();
      window.location.href = signInRes?.url ?? "/onboarding";
    } catch {
      setError("Registracija ni uspela. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl">
            <span>⚡</span>
            <span>AgentFlow<span className="text-blue-300"> Pro</span></span>
          </Link>
          <p className="text-blue-200 mt-2 text-sm">AI vsebina za turizem & gostinstvo</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ustvarite račun</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              7 dni brezplačno • Brez kreditne kartice
            </p>
          </div>

          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Nadaljuj z Google
              </button>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-gray-800 px-3 text-gray-400">ali z emailom</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Ime (neobvezno)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. Janez Novak"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Geslo *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Vsaj 8 znakov"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Skrij geslo" : "Prikaži geslo"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M3 3l3 3m15 15l-3-3" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-xl">⏳</span>
                  Ustvarjam račun...
                </>
              ) : (
                "🚀 Začnite brezplačno"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Z registracijo sprejemate{" "}
            <Link href="/docs" className="underline hover:text-gray-600">pogoje uporabe</Link>
            {" "}in{" "}
            <Link href="/docs" className="underline hover:text-gray-600">politiko zasebnosti</Link>
          </p>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Že imate račun?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Prijavite se
            </Link>
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-500" role="status">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Vaši podatki so varni. GDPR skladno.
          </p>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-blue-300 text-xs">
          <span>🔒 SSL zaščita</span>
          <span>🇸🇮 Strežniki v EU</span>
          <span>✓ GDPR skladno</span>
        </div>
      </div>
    </main>
  );
}
