"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function TestLoginButton({
  email,
  password,
  onResult,
}: {
  email: string;
  password: string;
  onResult: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function test() {
    if (!email || !password) {
      onResult("Vpiši email in geslo pred testom");
      return;
    }
    setLoading(true);
    onResult("");
    try {
      const r = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const d = await r.json();
      onResult(d.ok ? `✓ Test OK: ${d.message}` : `✗ Test: ${d.message}`);
    } catch (e) {
      onResult(`Test napaka: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      type="button"
      onClick={test}
      disabled={loading}
      className="mt-2 w-full rounded-sm border border-amber-300 bg-amber-50 py-1 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
    >
      {loading ? "Testiram..." : "Test prijave (dev)"}
    </button>
  );
}

function LoginForm() {
  useSession();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agentflow-remember-me");
      if (saved !== null) setRememberMe(saved === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const err = searchParams?.get("error");
    if (err === "CredentialsSignin") {
      setError("Napačen email ali geslo");
    }
    const urlEmail = searchParams?.get("email");
    if (urlEmail) setEmail(decodeURIComponent(urlEmail));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data: { google?: boolean }) => setGoogleEnabled(!!data?.google))
      .catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""))
      .catch(() => { });
  }, []);

  async function handleGoogleSignIn() {
    if (!googleEnabled) {
      setError("Google prijava ni konfigurirana. Dodaj GOOGLE_CLIENT_ID in GOOGLE_CLIENT_SECRET v .env");
      return;
    }
    setError("");
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  let callbackUrl = searchParams?.get("callbackUrl") ?? "/dashboard";
  if (typeof window !== "undefined" && callbackUrl.startsWith("http")) {
    try {
      const u = new URL(callbackUrl);
      callbackUrl = u.pathname + u.search || "/dashboard";
    } catch {
      callbackUrl = "/dashboard";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8 relative z-40">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 relative z-50">
        <h1 className="mb-4 text-xl font-bold dark:text-white">Sign in</h1>
        {error && error.includes("Google") && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            {error}
          </p>
        )}
        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  or with email
                </span>
              </div>
            </div>
          </>
        )}
        <form method="post" action="/api/auth/callback/credentials" className="space-y-4">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                Pozabljeno geslo?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                const v = e.target.checked;
                setRememberMe(v);
                try {
                  localStorage.setItem("agentflow-remember-me", v ? "1" : "0");
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-sm border-gray-300 text-indigo-600 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Ostani prijavljen</span>
          </label>
          {error && !error.includes("Google") && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!csrfToken}
            className="w-full rounded-sm bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          No account? <Link href="/register" className="text-indigo-600 hover:underline">Register</Link>
          {" · "}
          <Link href="/login-simple" className="text-amber-600 hover:underline">Preprosta prijava</Link>
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-500" role="status">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Vaši podatki so varni. GDPR skladno.
        </p>
        {process.env.NODE_ENV === "development" && (
          <>
            <TestLoginButton email={email} password={password} onResult={setTestMsg} />
            {testMsg && (
              <p className={`mt-2 text-center text-xs ${testMsg.startsWith("✓") ? "text-green-600" : "text-amber-600"}`}>
                {testMsg}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-sm w-24 mb-4 dark:bg-gray-600" />
        <div className="h-10 bg-gray-200 rounded-sm mb-4 dark:bg-gray-600" />
        <div className="h-4 bg-gray-200 rounded-sm w-full mb-4 dark:bg-gray-600" />
        <div className="h-10 bg-gray-200 rounded-sm mb-4 dark:bg-gray-600" />
        <div className="h-4 bg-gray-200 rounded-sm w-full mb-4 dark:bg-gray-600" />
        <div className="h-10 bg-gray-200 rounded-sm dark:bg-gray-600" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
