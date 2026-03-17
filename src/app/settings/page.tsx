"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const PROVIDERS = [
  { key: "firecrawl", label: "Firecrawl", placeholder: "fc_...", href: "https://firecrawl.dev" },
  { key: "context7", label: "Context7", placeholder: "ctx7sk_...", href: "https://context7.com" },
  { key: "serpapi", label: "SerpAPI", placeholder: "Get key at serpapi.com/manage-api-key", href: "https://serpapi.com/manage-api-key" },
  { key: "openai", label: "OpenAI", placeholder: "sk-...", href: "https://platform.openai.com/api-keys" },
  { key: "github", label: "GitHub", placeholder: "ghp_...", href: "https://github.com/settings/tokens" },
  { key: "vercel", label: "Vercel", placeholder: "...", href: "https://vercel.com/account/tokens" },
  { key: "netlify", label: "Netlify", placeholder: "nfp_...", href: "https://app.netlify.com/user/applications#personal-access-tokens" },
  { key: "mailchimp", label: "Mailchimp", placeholder: "xxx-us19 (API key + datacenter)", href: "https://mailchimp.com/help/about-api-keys" },
] as const;

const TOURISM_PROVIDERS = [
  { key: "openai", label: "OpenAI", placeholder: "sk-...", href: "https://platform.openai.com/api-keys" },
  { key: "firecrawl", label: "Firecrawl", placeholder: "fc_... (opcijsko)", href: "https://firecrawl.dev" },
  { key: "mailchimp", label: "Mailchimp", placeholder: "xxx-us19 (opcijsko)", href: "https://mailchimp.com/help/about-api-keys" },
] as const;

const DEVELOPER_PROVIDERS = [
  { key: "github", label: "GitHub", placeholder: "ghp_...", href: "https://github.com/settings/tokens" },
  { key: "vercel", label: "Vercel", placeholder: "...", href: "https://vercel.com/account/tokens" },
  { key: "netlify", label: "Netlify", placeholder: "nfp_...", href: "https://app.netlify.com/user/applications#personal-access-tokens" },
  { key: "context7", label: "Context7", placeholder: "ctx7sk_...", href: "https://context7.com" },
  { key: "serpapi", label: "SerpAPI", placeholder: "Get key at serpapi.com/manage-api-key", href: "https://serpapi.com/manage-api-key" },
] as const;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [connections, setConnections] = useState<{
    linkedin: boolean;
    twitter: boolean;
    hubspot: boolean;
    salesforce: boolean;
  }>({
    linkedin: false,
    twitter: false,
    hubspot: false,
    salesforce: false,
  });
  const [companyKnowledge, setCompanyKnowledge] = useState({
    products: "",
    competitors: "",
    keyFacts: "",
  });
  const [companyKnowledgeSaving, setCompanyKnowledgeSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [usageAlerts, setUsageAlerts] = useState<Array<{ id: string; type: string; threshold: number }>>([]);
  const [usageAlertsLoading, setUsageAlertsLoading] = useState(false);
  const [newAlertType, setNewAlertType] = useState("agent_runs");
  const [newAlertThreshold, setNewAlertThreshold] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [receptionMode, setReceptionMode] = useState(false);
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [showAdvancedKeys, setShowAdvancedKeys] = useState(false);
  const [billing, setBilling] = useState<{
    subscription: { planId?: string; status?: string; currentPeriodEnd?: string } | null;
  } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingAction, setBillingAction] = useState<"idle" | "checkout" | "cancel">("idle");
  const [mailchimpCampaigns, setMailchimpCampaigns] = useState<Array<{ id: string; status?: string; subject_line?: string; create_time?: string; send_time?: string }> | null>(null);
  const [mailchimpCampaignsLoading, setMailchimpCampaignsLoading] = useState(false);
  const [hubspotCompanies, setHubspotCompanies] = useState<Array<{ id?: string; name?: string; domain?: string; industry?: string }> | null>(null);
  const [hubspotCompaniesLoading, setHubspotCompaniesLoading] = useState(false);

  useEffect(() => {
    try {
      setReceptionMode(localStorage.getItem("agentflow-reception-mode") === "1");
    } catch { }
  }, []);

  useEffect(() => {
    const linkedin = searchParams.get("linkedin");
    const twitter = searchParams.get("twitter");
    const hubspot = searchParams.get("hubspot");
    const salesforce = searchParams.get("salesforce");
    const err = searchParams.get("error");
    if (linkedin === "ok") setMessage("LinkedIn connected successfully.");
    if (twitter === "ok") setMessage("Twitter connected successfully.");
    if (hubspot === "ok") setMessage("HubSpot connected successfully.");
    if (salesforce === "connected") setMessage("Salesforce connected successfully.");
    if (err) setMessage(`Connection error: ${err}`);
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/user/keys").then((r) => r.json()),
      fetch("/api/auth/connections").then((r) => r.json()),
      fetch("/api/onboarding").then((r) => r.json()),
      fetch("/api/usage/alerts").then((r) => r.json()),
      fetch("/api/v1/billing").then((r) => r.json()),
    ])
      .then(([keysData, connData, onboardingData, alertsData, billingData]) => {
        if (!keysData.error) {
          setKeys(keysData);
          setFormData({});
        }
        if (!connData.error) setConnections({
          linkedin: connData.linkedin ?? false,
          twitter: connData.twitter ?? false,
          hubspot: connData.hubspot ?? false,
          salesforce: connData.salesforce ?? false,
        });
        if (!onboardingData.error && onboardingData.onboarding) {
          setUserIndustry(onboardingData.onboarding.industry ?? null);
          const ck = onboardingData.onboarding.company_knowledge;
          if (ck) {
            setCompanyKnowledge({
              products: Array.isArray(ck.products) ? ck.products.join("\n") : "",
              competitors: Array.isArray(ck.competitors) ? ck.competitors.join("\n") : "",
              keyFacts: Array.isArray(ck.keyFacts) ? ck.keyFacts.join("\n") : "",
            });
          }
        }
        if (alertsData?.success && alertsData?.data?.alerts) {
          setUsageAlerts(alertsData.data.alerts);
        }
        if (!billingData?.error) {
          const sub = billingData?.subscription ?? (billingData?.planId != null ? billingData : null);
          setBilling({ subscription: sub });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [status]);

  const handleDisconnect = async (provider: "linkedin" | "twitter" | "hubspot" | "salesforce") => {
    const res = await fetch(`/api/auth/connections?provider=${provider}`, { method: "DELETE" });
    if (res.ok) setConnections((c) => ({ ...c, [provider]: false }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const p of PROVIDERS) {
        const v = formData[p.key]?.trim();
        if (v && !v.includes("*")) body[p.key] = v;
      }
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setMessage(typeof err === "object" && err?.message ? err.message : (typeof err === "string" ? err : "Failed to save"));
        return;
      }
      setMessage("API keys saved. Your workflows will use these keys.");
      const refetch = await fetch("/api/user/keys");
      const refreshed = await refetch.json();
      if (!refreshed.error) setKeys(refreshed);
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-gray-400 transition-colors hover:text-white"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white">Settings</h1>
        <p className="mb-6 text-gray-400">
          Add your own API keys. Your workflows will use these keys instead of
          platform defaults. Keys are stored securely and never shared.
        </p>
        <div className="mb-8 flex gap-4 flex-wrap">
          <Link
            href="/pricing"
            className="inline-block rounded-lg border border-indigo-500 px-4 py-2 text-indigo-400 transition-colors hover:bg-indigo-500/10"
            aria-label="Manage billing and subscription"
          >
            Billing / Subscription →
          </Link>
          <Link
            href="/settings/api-keys"
            className="inline-block rounded-lg border border-blue-500 px-4 py-2 text-blue-400 transition-colors hover:bg-blue-500/10"
          >
            API Keys (BYOK) – alternate view →
          </Link>
          <Link
            href="/settings/public-api"
            className="inline-block rounded-lg border border-green-500 px-4 py-2 text-green-400 transition-colors hover:bg-green-500/10"
          >
            Public API Keys →
          </Link>
          <Link
            href="/settings/audit"
            className="inline-block rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
          >
            AI Audit Logs →
          </Link>
          <Link
            href="/settings/teams"
            className="inline-block rounded-lg border border-purple-500 px-4 py-2 text-purple-400 transition-colors hover:bg-purple-500/10"
          >
            Teams →
          </Link>
          <Link
            href="/admin"
            className="inline-block rounded-lg border border-amber-600 px-4 py-2 text-amber-400 transition-colors hover:bg-amber-600/10"
          >
            Admin →
          </Link>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Naročnina</h2>
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4 max-w-md space-y-3">
          {billing === null ? (
            <p className="text-gray-400 text-sm">Podatki o naročnini niso na voljo.</p>
          ) : billing?.subscription ? (
            <>
              <p className="text-gray-300 text-sm">
                <span className="text-gray-500">Plan:</span>{" "}
                {(billing.subscription as { planId?: string }).planId ?? "—"}
              </p>
              <p className="text-gray-300 text-sm">
                <span className="text-gray-500">Status:</span>{" "}
                {(billing.subscription as { status?: string }).status ?? "—"}
              </p>
              <p className="text-gray-300 text-sm">
                <span className="text-gray-500">Odnova:</span>{" "}
                {(billing.subscription as { currentPeriodEnd?: string }).currentPeriodEnd
                  ? new Date((billing.subscription as { currentPeriodEnd: string }).currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={billingAction !== "idle"}
                  onClick={async () => {
                    setBillingAction("checkout");
                    setMessage(null);
                    try {
                      const res = await fetch("/api/v1/billing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "checkout", planId: "pro" }),
                      });
                      const data = await res.json();
                      if (data?.url) {
                        window.location.href = data.url;
                        return;
                      }
                      setMessage(data?.error ?? "Checkout ni uspel.");
                    } catch {
                      setMessage("Checkout ni uspel.");
                    } finally {
                      setBillingAction("idle");
                    }
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {billingAction === "checkout" ? "Preusmerjanje..." : "Nadgradi / Upgrade"}
                </button>
                <button
                  type="button"
                  disabled={billingAction !== "idle"}
                  onClick={async () => {
                    if (!confirm("Prekiniti naročnino? Do konca plačanega obdobja boste še imeli dostop.")) return;
                    setBillingAction("cancel");
                    setMessage(null);
                    try {
                      const res = await fetch("/api/v1/billing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "cancel", immediately: false }),
                      });
                      const data = await res.json();
                      if (res.ok && data?.canceled) {
                        setMessage("Naročnina bo prekinjena ob koncu obdobja.");
                        const refetch = await fetch("/api/v1/billing").then((r) => r.json());
                        if (!refetch?.error) {
                          const sub = refetch.subscription ?? (refetch.planId != null ? refetch : null);
                          setBilling({ subscription: sub });
                        }
                      } else {
                        setMessage(data?.error ?? "Preklic ni uspel.");
                      }
                    } catch {
                      setMessage("Preklic ni uspel.");
                    } finally {
                      setBillingAction("idle");
                    }
                  }}
                  className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 disabled:opacity-50"
                >
                  {billingAction === "cancel" ? "Preklicujem..." : "Prekini naročnino"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm">Nimate aktivne naročnine.</p>
              <button
                type="button"
                disabled={billingAction !== "idle"}
                onClick={async () => {
                  setBillingAction("checkout");
                  setMessage(null);
                  try {
                    const res = await fetch("/api/v1/billing", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "checkout", planId: "pro" }),
                    });
                    const data = await res.json();
                    if (data?.url) {
                      window.location.href = data.url;
                      return;
                    }
                    setMessage(data?.error ?? "Checkout ni uspel.");
                  } catch {
                    setMessage("Checkout ni uspel.");
                  } finally {
                    setBillingAction("idle");
                  }
                }}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {billingAction === "checkout" ? "Preusmerjanje..." : "Nadgradi / Upgrade"}
              </button>
            </>
          )}
          <div className="pt-2">
            <Link
              href="/pricing"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Ogled cen in načrtov →
            </Link>
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Reception / Tourism</h2>
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 max-w-md">
          <input
            id="reception-mode"
            type="checkbox"
            checked={receptionMode}
            onChange={(e) => {
              const v = e.target.checked;
              setReceptionMode(v);
              try {
                localStorage.setItem("agentflow-reception-mode", v ? "1" : "0");
              } catch { }
            }}
            className="h-4 w-4 rounded-sm border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="reception-mode" className="text-sm text-gray-300 cursor-pointer">
            Reception način – poenostavljen pregled „Danes“ ob vsakem obisku dashboarda
          </label>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Sprememba gesla</h2>
        <p className="mb-2 text-gray-400 text-sm">
          Uporabniki z email/geslom lahko spremenite geslo. (Google prijava nima gesla.)
        </p>
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3 max-w-md">
          <input
            type="password"
            placeholder="Trenutno geslo"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500"
          />
          <input
            type="password"
            placeholder="Novo geslo (min. 8 znakov)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500"
          />
          <input
            type="password"
            placeholder="Potrdi novo geslo"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500"
          />
          <button
            type="button"
            disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
            onClick={async () => {
              setMessage(null);
              setPasswordSaving(true);
              try {
                const res = await fetch("/api/auth/password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    currentPassword,
                    newPassword,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  const err = data.error?.message ?? data.error ?? "Napaka";
                  setMessage(typeof err === "string" ? err : "Napaka pri spremembi gesla");
                  return;
                }
                setMessage("Geslo uspešno spremenjeno.");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              } catch {
                setMessage("Napaka pri spremembi gesla");
              } finally {
                setPasswordSaving(false);
              }
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {passwordSaving ? "Shranjujem..." : "Spremeni geslo"}
          </button>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Publish Connections</h2>
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-white">LinkedIn</span>
            {connections.linkedin ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Connected</span>
                <button
                  type="button"
                  onClick={() => handleDisconnect("linkedin")}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/linkedin/connect"
                className="rounded-lg bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white hover:bg-[#004182]"
              >
                Connect LinkedIn
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-white">Twitter/X</span>
            {connections.twitter ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Connected</span>
                <button
                  type="button"
                  onClick={() => handleDisconnect("twitter")}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/twitter/connect"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Connect Twitter
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-white">HubSpot</span>
            {connections.hubspot ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Connected</span>
                <button
                  type="button"
                  onClick={() => handleDisconnect("hubspot")}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/hubspot/connect"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Connect HubSpot
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-white">Salesforce</span>
            {connections.salesforce ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Connected</span>
                <button
                  type="button"
                  onClick={() => handleDisconnect("salesforce")}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/salesforce/connect"
                className="rounded-lg bg-[#00a1e0] px-4 py-2 text-sm font-medium text-white hover:bg-[#008ab8]"
              >
                Connect Salesforce
              </Link>
            )}
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Usage Alerts</h2>
        <p className="mb-4 text-gray-400">
          Nastavite opozorila, ko presežete uporabniške limite (agenti, API klici, prostor, stroški).
        </p>
        <div className="mb-8 space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
          {usageAlerts.length > 0 && (
            <ul className="space-y-2">
              {usageAlerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-white">{a.type}: prag {a.threshold}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <select
              title="Tip opozorila"
              aria-label="Tip opozorila (Agent runs, API calls, Storage, Cost)"
              value={newAlertType}
              onChange={(e) => setNewAlertType(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm"
            >
              <option value="agent_runs">Agent runs</option>
              <option value="api_calls">API calls</option>
              <option value="storage">Storage</option>
              <option value="cost">Cost</option>
            </select>
            <input
              type="number"
              aria-label="Prag opozorila (npr. 100)"
              value={newAlertThreshold}
              onChange={(e) => setNewAlertThreshold(e.target.value)}
              placeholder="Prag (npr. 100)"
              className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm w-32"
            />
            <button
              type="button"
              disabled={usageAlertsLoading || !newAlertThreshold.trim()}
              onClick={async () => {
                setUsageAlertsLoading(true);
                setMessage(null);
                try {
                  const res = await fetch("/api/usage/alerts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: newAlertType,
                      threshold: Number(newAlertThreshold),
                    }),
                  });
                  const data = await res.json();
                  if (!data.success) {
                    const errMsg = typeof data.error === "object" ? data.error?.message : data.error;
                    setMessage(errMsg ?? "Napaka pri ustvarjanju opozorila");
                    return;
                  }
                  setUsageAlerts((prev) => [...prev, data.data.alert]);
                  setNewAlertThreshold("");
                  setMessage("Opozorilo ustvarjeno.");
                } catch {
                  setMessage("Napaka pri ustvarjanju opozorila");
                } finally {
                  setUsageAlertsLoading(false);
                }
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {usageAlertsLoading ? "Shranjevanje..." : "Dodaj opozorilo"}
            </button>
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Integracije – pregled</h2>
        <p className="mb-4 text-gray-400">
          Mailchimp liste in HubSpot kontakti (zahteva konfigurirane ključe / povezavo zgoraj).
        </p>
        <div className="mb-8 space-y-4">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Mailchimp liste</span>
              <button
                type="button"
                onClick={async () => {
                  setMessage(null);
                  try {
                    const res = await fetch("/api/mailchimp/lists");
                    const data = await res.json();
                    if (data.error) {
                      setMessage(data.error);
                      return;
                    }
                    setMessage(`Mailchimp: ${data.lists?.length ?? 0} list.`);
                    setTimeout(() => setMessage(null), 3000);
                  } catch {
                    setMessage("Napaka pri nalaganju Mailchimp list.");
                  }
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Naloži liste
              </button>
            </div>
            <p className="text-xs text-gray-500">Dodajte Mailchimp API ključ zgoraj (All API Keys).</p>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Kampanje</span>
                <button
                  type="button"
                  disabled={mailchimpCampaignsLoading}
                  onClick={async () => {
                    setMessage(null);
                    setMailchimpCampaignsLoading(true);
                    try {
                      const res = await fetch("/api/mailchimp/campaigns");
                      const data = await res.json();
                      if (data.error) {
                        setMessage(typeof data.error === "string" ? data.error : data.error?.message ?? "Napaka");
                        return;
                      }
                      setMailchimpCampaigns(data.campaigns ?? []);
                    } catch {
                      setMessage("Napaka pri nalaganju kampanj.");
                    } finally {
                      setMailchimpCampaignsLoading(false);
                    }
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  {mailchimpCampaignsLoading ? "Nalagam..." : "Naloži kampanje"}
                </button>
              </div>
              {mailchimpCampaigns && (
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="py-1 pr-2">Predmet</th>
                        <th className="py-1 pr-2">Status</th>
                        <th className="py-1">Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mailchimpCampaigns.length === 0 ? (
                        <tr><td colSpan={3} className="py-2 text-gray-500">Ni kampanj</td></tr>
                      ) : (
                        mailchimpCampaigns.map((c) => (
                          <tr key={c.id} className="border-t border-gray-700/50">
                            <td className="py-1 pr-2 text-gray-300 truncate max-w-[120px]" title={c.subject_line}>{c.subject_line ?? "—"}</td>
                            <td className="py-1 pr-2 text-gray-400">{c.status ?? "—"}</td>
                            <td className="py-1 text-gray-500">{c.send_time || c.create_time ? new Date(c.send_time || c.create_time || "").toLocaleDateString() : "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">HubSpot kontakti</span>
              <button
                type="button"
                onClick={async () => {
                  setMessage(null);
                  try {
                    const res = await fetch("/api/hubspot/contacts");
                    const data = await res.json();
                    if (data.error) {
                      const err = data.error;
                      setMessage(typeof err === "object" && err?.message ? err.message : String(err));
                      return;
                    }
                    setMessage(`HubSpot: ${data.contacts?.length ?? 0} kontaktov.`);
                    setTimeout(() => setMessage(null), 3000);
                  } catch {
                    setMessage("Napaka pri nalaganju HubSpot kontaktov.");
                  }
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Naloži kontakte
              </button>
            </div>
            <p className="text-xs text-gray-500">Povežite HubSpot v Publish Connections zgoraj.</p>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Podjetja</span>
                <button
                  type="button"
                  disabled={hubspotCompaniesLoading}
                  onClick={async () => {
                    setMessage(null);
                    setHubspotCompaniesLoading(true);
                    try {
                      const res = await fetch("/api/hubspot/companies");
                      const data = await res.json();
                      if (data.error) {
                        setMessage(typeof data.error === "string" ? data.error : data.error?.message ?? "Napaka");
                        return;
                      }
                      setHubspotCompanies(data.companies ?? []);
                    } catch {
                      setMessage("Napaka pri nalaganju podjetij.");
                    } finally {
                      setHubspotCompaniesLoading(false);
                    }
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  {hubspotCompaniesLoading ? "Nalagam..." : "Naloži podjetja"}
                </button>
              </div>
              {hubspotCompanies && (
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="py-1 pr-2">Ime</th>
                        <th className="py-1">Domena</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hubspotCompanies.length === 0 ? (
                        <tr><td colSpan={2} className="py-2 text-gray-500">Ni podjetij</td></tr>
                      ) : (
                        hubspotCompanies.map((c) => (
                          <tr key={c.id ?? c.name ?? ""} className="border-t border-gray-700/50">
                            <td className="py-1 pr-2 text-gray-300">{c.name ?? "—"}</td>
                            <td className="py-1 text-gray-400">{c.domain ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">Company Knowledge</h2>
        <p className="mb-4 text-gray-400">
          Products, competitors, and key facts used when generating content. One item per line or comma-separated.
        </p>
        <div className="mb-8 space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Products</label>
            <textarea
              value={companyKnowledge.products}
              onChange={(e) =>
                setCompanyKnowledge((prev) => ({ ...prev, products: e.target.value }))
              }
              rows={3}
              placeholder="Product A, Product B, Product C"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Competitors</label>
            <textarea
              value={companyKnowledge.competitors}
              onChange={(e) =>
                setCompanyKnowledge((prev) => ({ ...prev, competitors: e.target.value }))
              }
              rows={3}
              placeholder="Competitor A, Competitor B"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Key Facts</label>
            <textarea
              value={companyKnowledge.keyFacts}
              onChange={(e) =>
                setCompanyKnowledge((prev) => ({ ...prev, keyFacts: e.target.value }))
              }
              rows={3}
              placeholder="Founded 2020, HQ in Berlin"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            disabled={companyKnowledgeSaving}
            onClick={async () => {
              setMessage(null);
              setCompanyKnowledgeSaving(true);
              try {
                const parse = (s: string) =>
                  s
                    .split(/[\n,]+/)
                    .map((x) => x.trim())
                    .filter(Boolean);
                const res = await fetch("/api/onboarding", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    company_knowledge: {
                      products: parse(companyKnowledge.products),
                      competitors: parse(companyKnowledge.competitors),
                      keyFacts: parse(companyKnowledge.keyFacts),
                    },
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  const err = data.error;
                  setMessage(typeof err === "object" && err?.message ? err.message : (typeof err === "string" ? err : "Failed to save company knowledge"));
                  return;
                }
                setMessage("Company knowledge saved.");
              } catch {
                setMessage("Failed to save company knowledge");
              } finally {
                setCompanyKnowledgeSaving(false);
              }
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {companyKnowledgeSaving ? "Saving..." : "Save Company Knowledge"}
          </button>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-white">
          {userIndustry === "tourism" || userIndustry === "travel-agency"
            ? "API ključi za turizem"
            : "All API Keys"}
        </h2>
        <p className="mb-4 text-gray-400 text-sm">
          {userIndustry === "tourism" || userIndustry === "travel-agency"
            ? "Odprite ključe za AI generiranje vsebin. OpenAI je obvezen za generiranje besedil."
            : "Add your own API keys. Your workflows will use these keys instead of platform defaults. Keys are stored securely and never shared."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(userIndustry === "tourism" || userIndustry === "travel-agency"
            ? TOURISM_PROVIDERS
            : PROVIDERS
          ).map(({ key, label, placeholder, href }) => (
            <div
              key={key}
              className="rounded-lg border border-gray-700 bg-gray-800 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor={key}
                  className="block text-sm font-medium text-white"
                >
                  {label}
                </label>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Get key →
                </a>
              </div>
              <input
                id={key}
                type="password"
                value={formData[key] ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={keys[key] ? "••••••••" : placeholder}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
                autoComplete="off"
              />
              {keys[key] && (
                <p className="mt-1 text-xs text-gray-500">Current: {keys[key]}</p>
              )}
            </div>
          ))}

          {(userIndustry === "tourism" || userIndustry === "travel-agency") && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <button
                type="button"
                onClick={() => setShowAdvancedKeys((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <span>{showAdvancedKeys ? "▲" : "▼"}</span>
                <span>Napredne integracije (opcijsko)</span>
              </button>
              {showAdvancedKeys && (
                <div className="mt-4 space-y-4">
                  {DEVELOPER_PROVIDERS.map(({ key, label, placeholder, href }) => (
                    <div key={key} className="rounded-lg border border-gray-600 bg-gray-800 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor={`dev-${key}`} className="block text-sm font-medium text-white">
                          {label}
                        </label>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">
                          Get key →
                        </a>
                      </div>
                      <input
                        id={`dev-${key}`}
                        type="password"
                        value={formData[key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={keys[key] ? "••••••••" : placeholder}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
                        autoComplete="off"
                      />
                      {keys[key] && (
                        <p className="mt-1 text-xs text-gray-500">Current: {keys[key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {message && (
            <p
              className={
                message.includes("saved") || message.includes("successfully")
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save API Keys"}
          </button>
        </form>
      </div>
    </div>
  );
}
