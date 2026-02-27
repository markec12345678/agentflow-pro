"use client";

/**
 * Preprosta prijava - form direktno POST na NextAuth.
 * Backup če glavni login ne deluje.
 * Uporaba: http://localhost:3002/login-simple
 */
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginSimplePage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams?.get("error");
  const error = errorParam === "CredentialsSignin" ? "Napačen email ali geslo" : errorParam || null;

  const [csrfToken, setCsrfToken] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => {
        setCsrfToken(d.csrfToken || "");
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-4 text-xl font-bold dark:text-white">Sign in (simple)</h1>
        {error && (
          <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}
        <form method="post" action="/api/auth/callback/credentials">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="e2e@test.com"
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="e2e-secret"
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!ready}
              className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Sign in
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="text-indigo-600 hover:underline">
            Nazaj na login
          </Link>
        </p>
      </div>
    </main>
  );
}
