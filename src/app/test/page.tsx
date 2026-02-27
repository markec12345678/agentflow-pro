"use client";

/**
 * AgentFlow Pro - Stran za testiranje vseh APIjev in funkcionalnosti
 * En klik na gumb = en test. Dostop: /test
 * V produkciji priporočeno onemogočiti ali zaščititi.
 */
import { useState } from "react";
import Link from "next/link";

type TestResult = { ok: boolean; text: string; status?: number };

export default function TestPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function runTest(
    key: string,
    fn: () => Promise<{ ok: boolean; text: string; status?: number }>
  ) {
    setLoading(key);
    try {
      const r = await fn();
      setResults((prev) => ({ ...prev, [key]: r }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          text: String(e),
        },
      }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AgentFlow Pro – testna stran
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Klikni na gumb za test. Vsak gumb kliče en API ali akcijo.
        </p>

        <div className="space-y-4">
          {/* Health */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Health & DB
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Health (DB)"
                loading={loading === "health"}
                onClick={() =>
                  runTest("health", async () => {
                    const r = await fetch("/api/health");
                    const j = await r.json();
                    return {
                      ok: r.ok && j?.ok,
                      text: j?.ok ? "DB OK" : j?.error ?? JSON.stringify(j),
                      status: r.status,
                    };
                  })
                }
              />
              <TestButton
                label="Health Resilience"
                loading={loading === "health-resilience"}
                onClick={() =>
                  runTest("health-resilience", async () => {
                    const r = await fetch("/api/health/resilience");
                    const j = await r.json();
                    return {
                      ok: r.ok,
                      text: j?.retry ? "Retry configured" : JSON.stringify(j),
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.health && <ResultBlock {...results.health} />}
            {results["health-resilience"] && (
              <ResultBlock {...results["health-resilience"]} />
            )}
          </section>

          {/* Auth */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Auth
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Session"
                loading={loading === "session"}
                onClick={() =>
                  runTest("session", async () => {
                    const r = await fetch("/api/auth/session");
                    const j = await r.json();
                    const hasUser = !!j?.user;
                    return {
                      ok: r.ok,
                      text: hasUser
                        ? `Prijavljen: ${j.user?.email ?? j.user?.name ?? "?"}`
                        : "Ni prijave",
                      status: r.status,
                    };
                  })
                }
              />
              <TestButton
                label="Providers"
                loading={loading === "providers"}
                onClick={() =>
                  runTest("providers", async () => {
                    const r = await fetch("/api/auth/providers");
                    const j = await r.json();
                    const list = Object.keys(j || {}).join(", ") || "nič";
                    return {
                      ok: r.ok,
                      text: list,
                      status: r.status,
                    };
                  })
                }
              />
              <TestButton
                label="Register (test@test.si)"
                loading={loading === "register"}
                onClick={() =>
                  runTest("register", async () => {
                    const r = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: "test@test.si",
                        password: "Test1234",
                        name: "Test User",
                      }),
                    });
                    const j = await r.json();
                    if (r.ok)
                      return {
                        ok: true,
                        text: j.data?.id ? "Ustvarjen" : JSON.stringify(j),
                        status: r.status,
                      };
                    const msg =
                      j?.error?.message ?? j?.error ?? JSON.stringify(j);
                    return {
                      ok: false,
                      text: msg,
                      status: r.status,
                    };
                  })
                }
              />
              <TestButton
                label="Forgot password (test@test.si)"
                loading={loading === "forgot"}
                onClick={() =>
                  runTest("forgot", async () => {
                    const r = await fetch("/api/auth/password", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: "test@test.si" }),
                    });
                    const j = await r.json();
                    return {
                      ok: r.ok,
                      text: r.ok
                        ? "Zahteva poslana"
                        : j?.error?.message ?? JSON.stringify(j),
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.session && <ResultBlock {...results.session} />}
            {results.providers && <ResultBlock {...results.providers} />}
            {results.register && <ResultBlock {...results.register} />}
            {results.forgot && <ResultBlock {...results.forgot} />}
          </section>

          {/* Tourism */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Tourism API
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Tourism Complete (detect_language)"
                loading={loading === "tourism"}
                onClick={() =>
                  runTest("tourism", async () => {
                    const r = await fetch("/api/tourism/complete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "detect_language",
                        data: { content: "Hello world" },
                      }),
                    });
                    const j = await r.json();
                    return {
                      ok: r.ok,
                      text: j?.data?.detectedLanguage ?? j?.error ?? JSON.stringify(j).slice(0, 120),
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.tourism && <ResultBlock {...results.tourism} />}
          </section>

          {/* Chat (needs auth) */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Chat (zahteva prijavo)
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Chat POST"
                loading={loading === "chat"}
                onClick={() =>
                  runTest("chat", async () => {
                    const r = await fetch("/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: [{ role: "user", content: "Hi" }],
                      }),
                    });
                    const ct = r.headers.get("content-type");
                    if (r.status === 401)
                      return { ok: false, text: "401 – prijavi se", status: 401 };
                    if (ct?.includes("stream")) {
                      const text = await r.text();
                      return {
                        ok: r.ok,
                        text: text.slice(0, 80) + "...",
                        status: r.status,
                      };
                    }
                    const j = await r.json();
                    return {
                      ok: r.ok,
                      text: j?.error ?? "Stream OK",
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.chat && <ResultBlock {...results.chat} />}
          </section>

          {/* Workflows (needs auth) */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Workflows (zahteva prijavo)
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Workflows GET"
                loading={loading === "workflows"}
                onClick={() =>
                  runTest("workflows", async () => {
                    const r = await fetch("/api/workflows");
                    const j = await r.json();
                    if (r.status === 401)
                      return { ok: false, text: "401 – prijavi se", status: 401 };
                    const count = Array.isArray(j) ? j.length : 0;
                    return {
                      ok: r.ok,
                      text: `${count} workflow(s)`,
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.workflows && <ResultBlock {...results.workflows} />}
          </section>

          {/* Config */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Konfiguracija
            </h2>
            <div className="flex flex-wrap gap-2">
              <TestButton
                label="Config (MOCK_MODE, API keys)"
                loading={loading === "mock"}
                onClick={() =>
                  runTest("mock", async () => {
                    const r = await fetch("/api/test/config");
                    const j = await r.json();
                    const parts = [
                      j.mockMode ? "MOCK" : "REAL",
                      j.hasOpenAi && "OpenAI",
                      j.hasQwen && "Qwen",
                      j.hasContext7 && "Context7",
                    ].filter(Boolean);
                    return {
                      ok: r.ok,
                      text: parts.join(" | "),
                      status: r.status,
                    };
                  })
                }
              />
            </div>
            {results.mock && <ResultBlock {...results.mock} />}
          </section>
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          <Link
            href="/login"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Prijava
          </Link>
          <Link
            href="/register"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Registracija
          </Link>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function TestButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? "…" : label}
    </button>
  );
}

function ResultBlock({ ok, text, status }: TestResult) {
  return (
    <div
      className={`mt-2 rounded px-3 py-2 text-sm ${
        ok ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      }`}
    >
      {status != null && <span className="opacity-75 mr-2">{status}</span>}
      {text}
    </div>
  );
}
