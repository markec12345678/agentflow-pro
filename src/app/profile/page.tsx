"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface OnboardingData {
  industry?: string | null;
  companySize?: string | null;
  workType?: string | null;
  workspaceName?: string | null;
  blogUrl?: string | null;
}

interface ProfileData {
  user: { id: string; email: string | null; name: string | null };
  onboarding: OnboardingData | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && data.error !== "Unauthorized") throw new Error(data.error);
        setProfile(data);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const { user, onboarding } = profile;
  const labels: Record<string, string> = {
    industry: "Industry",
    companySize: "Company Size",
    workType: "Work Type",
    workspaceName: "Workspace Name",
    blogUrl: "Blog URL",
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold dark:text-white">Profile</h1>
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Dashboard
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold dark:text-white">
            Account
          </h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                Email
              </dt>
              <dd className="font-medium dark:text-white">{user.email}</dd>
            </div>
            {user.name && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                <dd className="font-medium dark:text-white">{user.name}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold dark:text-white">
            Onboarding
          </h2>
          {onboarding ? (
            <dl className="space-y-3">
              {(Object.keys(labels) as Array<keyof OnboardingData>).map(
                (key) => {
                  const val = onboarding[key];
                  if (val == null || val === "") return null;
                  return (
                    <div key={key}>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        {labels[key]}
                      </dt>
                      <dd className="font-medium dark:text-white">{String(val)}</dd>
                    </div>
                  );
                }
              )}
            </dl>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No onboarding data yet.{" "}
              <Link href="/onboarding" className="text-blue-600 hover:underline">
                Complete onboarding
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/settings" className="text-blue-600 hover:underline">
            Settings
          </Link>
        </p>
      </div>
    </main>
  );
}
