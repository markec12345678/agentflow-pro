"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  plan: string | null;
  status: string | null;
}

type AdminTab = "submissions" | "users" | "usage" | "analytics" | "features";

interface AnalyticsOverview {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  totalUsers: number;
  newUsersThisMonth: number;
  churnedThisMonth: number;
  churnRate: number;
  byPlan: Array<{ planId: string; count: number; mrr: number }>;
}

interface UsageOverview {
  periodStart: string;
  totalAgentRuns: number;
  totalCreditsUsed: number;
  byAgentType: Array<{ agentType: string; runs?: number; credits?: number }>;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  plan: string | null;
  message: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: _session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [usage, setUsage] = useState<UsageOverview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("submissions");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/contact-submissions").then((r) => r.json()),
      fetch("/api/admin/usage").then((r) => r.json()),
    ])
      .then(([usersData, subsData, usageData]) => {
        if (usersData.error && usersData.error.includes("Admin")) {
          setAccessDenied(true);
          return;
        }
        if (!usersData.error) setUsers(usersData.users ?? []);
        if (!subsData.error) setSubmissions(subsData.submissions ?? []);
        if (!usageData.error) setUsage(usageData);
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-gray-900 p-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">Admin Access Required</h1>
          <p className="mb-6 text-gray-400">
            Add your email to ADMIN_EMAILS in .env to access the admin dashboard.
          </p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="text-blue-400 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-700 pb-2">
          {(["submissions", "users", "usage", "analytics", "features"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded px-4 py-2 text-sm font-medium ${activeTab === tab
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "submissions" && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-white">Contact Submissions</h2>
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
              {submissions.length === 0 ? (
                <p className="p-8 text-center text-gray-400">No contact submissions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-700/50">
                        <th className="px-4 py-3 text-gray-300">Date</th>
                        <th className="px-4 py-3 text-gray-300">Name</th>
                        <th className="px-4 py-3 text-gray-300">Email</th>
                        <th className="px-4 py-3 text-gray-300">Company</th>
                        <th className="px-4 py-3 text-gray-300">Plan</th>
                        <th className="px-4 py-3 text-gray-300">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s) => (
                        <tr key={s.id} className="border-b border-gray-700/50">
                          <td className="px-4 py-3 text-gray-400">
                            {new Date(s.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-white">{s.name}</td>
                          <td className="px-4 py-3 text-white">{s.email}</td>
                          <td className="px-4 py-3 text-gray-400">{s.company ?? "-"}</td>
                          <td className="px-4 py-3 text-gray-400">{s.plan ?? "-"}</td>
                          <td className="max-w-xs px-4 py-3 text-gray-400 truncate" title={s.message}>
                            {s.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Users</h2>
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
              {users.length === 0 ? (
                <p className="p-8 text-center text-gray-400">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-700/50">
                        <th className="px-4 py-3 text-gray-300">Email</th>
                        <th className="px-4 py-3 text-gray-300">Name</th>
                        <th className="px-4 py-3 text-gray-300">Plan</th>
                        <th className="px-4 py-3 text-gray-300">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-700/50">
                          <td className="px-4 py-3 text-white">{u.email}</td>
                          <td className="px-4 py-3 text-gray-400">{u.name ?? "-"}</td>
                          <td className="px-4 py-3 text-gray-400">{u.plan ?? "trial"}</td>
                          <td className="px-4 py-3 text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Analytics Dashboard</h2>
            {analytics ? (
              <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">MRR</p>
                    <p className="text-2xl font-bold text-green-400">${analytics.mrr}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">ARR</p>
                    <p className="text-2xl font-bold text-white">${analytics.arr}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-white">{analytics.activeSubscriptions}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalUsers}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">New This Month</p>
                    <p className="text-2xl font-bold text-white">{analytics.newUsersThisMonth}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Churned This Month</p>
                    <p className="text-2xl font-bold text-white">{analytics.churnedThisMonth}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Churn Rate</p>
                    <p className="text-2xl font-bold text-white">{analytics.churnRate.toFixed(1)}%</p>
                  </div>
                </div>
                {analytics.byPlan.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">Revenue by Plan</p>
                    <div className="space-y-2">
                      {analytics.byPlan.map((p) => (
                        <div key={p.planId} className="flex justify-between rounded bg-gray-700/50 px-4 py-2">
                          <span className="text-white">{p.planId}</span>
                          <span className="text-gray-400">{p.count} subs · ${p.mrr}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Loading analytics...</p>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Usage Overview</h2>
            {usage ? (
              <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
                <p className="text-gray-400">
                  Period: {new Date(usage.periodStart).toLocaleDateString()} – today
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Total Agent Runs</p>
                    <p className="text-2xl font-bold text-white">{usage.totalAgentRuns}</p>
                  </div>
                  <div className="rounded bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400">Total Credits Used</p>
                    <p className="text-2xl font-bold text-white">{usage.totalCreditsUsed}</p>
                  </div>
                </div>
                {usage.byAgentType.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-300">By Agent Type</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="py-1">Agent</th>
                          <th className="py-1">Runs</th>
                          <th className="py-1">Credits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.byAgentType.map((a) => (
                          <tr key={a.agentType} className="border-t border-gray-700">
                            <td className="py-2 text-white">{a.agentType}</td>
                            <td className="py-2 text-gray-400">{a.runs}</td>
                            <td className="py-2 text-gray-400">{a.credits}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No usage data available.</p>
            )}
          </div>
        )}

        {activeTab === "features" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Feature Flags & Plan Limits</h2>
            <p className="mb-6 text-gray-400">
              Features are controlled by plan. Future: admin toggles for LangGraph, advanced workflows (Enterprise).
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-700/50">
                    <th className="px-4 py-3 text-gray-300">Plan</th>
                    <th className="px-4 py-3 text-gray-300">Agent Runs/mo</th>
                    <th className="px-4 py-3 text-gray-300">Blog Posts</th>
                    <th className="px-4 py-3 text-gray-300">Credits/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { plan: "Free", runs: 20, posts: 1, credits: 60 },
                    { plan: "Starter", runs: 100, posts: 3, credits: 300 },
                    { plan: "Pro", runs: 500, posts: 10, credits: 1500 },
                    { plan: "Enterprise", runs: 5000, posts: 999, credits: 10000 },
                  ].map((row) => (
                    <tr key={row.plan} className="border-b border-gray-700/50">
                      <td className="px-4 py-3 text-white">{row.plan}</td>
                      <td className="px-4 py-3 text-gray-400">{row.runs}</td>
                      <td className="px-4 py-3 text-gray-400">{row.posts}</td>
                      <td className="px-4 py-3 text-gray-400">{row.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
