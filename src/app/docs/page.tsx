"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold">Documentation</h1>
        <p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
          Welcome to AgentFlow Pro documentation. Learn how to build and deploy
          AI-powered workflows.
        </p>

        <div className="space-y-8">
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Quick Start</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Get started in minutes. Create your first workflow with our visual
              builder.
            </p>
            <Link
              href="/workflows"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Open Workflow Builder →
            </Link>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">AI Agents</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Research, Content, Code, and Deploy agents. Each specializes in
              different tasks.
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              View Dashboard →
            </Link>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Need Help?</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Contact our team for support or enterprise custom pricing.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Contact Sales →
            </Link>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
