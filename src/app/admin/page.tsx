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
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
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
    ])
      .then(([usersData, subsData]) => {
        if (usersData.error && usersData.error.includes("Admin")) {
          setAccessDenied(true);
          return;
        }
        if (!usersData.error) setUsers(usersData.users ?? []);
        if (!subsData.error) setSubmissions(subsData.submissions ?? []);
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
      </div>
    </main>
  );
}
