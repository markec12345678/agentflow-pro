"use client";

import Link from "next/link";
import { CASE_STUDIES } from "@/data/case-studies";

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-block text-blue-600 hover:underline dark:text-blue-400 mb-8"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold dark:text-white mb-2">
          Customer Stories
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
          See how marketing teams use AgentFlow Pro to scale content without
          scaling headcount.
        </p>

        <div className="space-y-12">
          {CASE_STUDIES.map((study) => (
            <article
              key={study.id}
              className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white mb-1">
                    {study.company}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {study.industry} • {study.role}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-green-100 dark:bg-green-900/30 px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {study.metric}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {study.metricLabel}
                  </p>
                </div>
              </div>

              <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-6 pl-4 border-l-4 border-blue-500">
                &quot;{study.quote}&quot;
              </blockquote>

              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    The challenge
                  </h3>
                  <p>{study.challenge}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    The solution
                  </h3>
                  <p>{study.solution}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    The outcome
                  </h3>
                  <p>{study.outcome}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white mb-4">
            Ready to get similar results?
          </h2>
          <Link
            href="/onboarding"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Start Free 7-Day Trial
          </Link>
        </div>
      </div>
    </main>
  );
}
