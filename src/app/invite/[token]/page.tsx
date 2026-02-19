"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;
  const [statusMsg, setStatusMsg] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }
    if (status !== "authenticated" || !token) return;

    fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatusMsg("success");
          setMessage("You have joined the team.");
        } else {
          setStatusMsg("error");
          setMessage(data.error ?? "Failed to accept invite");
        }
      })
      .catch(() => {
        setStatusMsg("error");
        setMessage("Failed to accept invite");
      });
  }, [token, status, router]);

  if (status === "loading" || statusMsg === "loading") {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Accepting invite...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl bg-gray-800 p-8 text-center">
        {statusMsg === "success" ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to the team!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link
              href="/settings/teams"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Go to Teams
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">Invite Error</h1>
            <p className="text-red-400 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
