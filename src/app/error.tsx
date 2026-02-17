"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4 text-6xl">😕</div>
        <h1 className="mb-4 text-3xl font-bold">Oops! Something went wrong</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          We&apos;re sorry for the inconvenience. Please try again.
        </p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
