import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/docs"
          className="mb-6 inline-block text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Documentation
        </Link>
        <h1 className="mb-6 text-4xl font-bold dark:text-white">
          Public API
        </h1>
        <p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
          Generate content from external systems. Create API keys in{" "}
          <Link href="/settings/public-api" className="text-blue-600 hover:underline dark:text-blue-400">
            Settings → Public API Keys
          </Link>
          .
        </p>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            Authentication
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Include your API key in the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded-sm">Authorization</code> header:
          </p>
          <pre className="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
            {`Authorization: Bearer afp_your_api_key_here`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            OpenAPI Spec
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Machine-readable API specification for code generation and tooling.
          </p>
          <a
            href="/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-gray-700 px-4 py-2 font-medium text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            openapi.json
          </a>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            POST /api/v1/generate
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Generate blog content for a topic.
          </p>
          <h3 className="mb-2 font-semibold dark:text-white">Request</h3>
          <pre className="mb-6 rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "topic": "How to optimize React performance"
}`}
          </pre>
          <h3 className="mb-2 font-semibold dark:text-white">Response</h3>
          <pre className="mb-6 rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "topic": "How to optimize React performance",
  "title": "How to optimize React performance",
  "content": "# How to optimize React performance\\n\\n...",
  "keywords": ["react", "performance", "optimization"]
}`}
          </pre>
          <h3 className="mb-2 font-semibold dark:text-white">Example (curl)</h3>
          <pre className="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl -X POST https://your-app.vercel.app/api/v1/generate \\
  -H "Authorization: Bearer afp_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"topic": "How to optimize React performance"}'`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            Workflows API
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Requires session (dashboard). Create, update, execute workflows. Supports Slack webhook and Email notifications.
          </p>
          <table className="mb-6 w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Method</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Endpoint</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-400">
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">GET</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/workflows</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">List workflows</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">POST</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/workflows</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Create workflow</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">GET/PUT/DELETE</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/workflows/:id</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Get, update, delete workflow</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">POST</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/workflows/:id</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Execute workflow</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            Chat & HITL Escalations API
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Streaming chat and HITL escalation management. Requires session.
          </p>
          <table className="mb-6 w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Method</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Endpoint</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-400">
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">POST</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/chat</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Streaming chat (messages, planExecute, threadId)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">GET</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/chat/escalations</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">List escalations (?status, ?threadId, ?all for admin)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">PATCH</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 font-mono">/api/chat/escalations/:id</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Update status (pending, acknowledged, resolved)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-white">
            Errors
          </h2>
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Status</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left dark:text-white">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-400">
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">401</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Invalid or missing API key</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">400</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Missing required field (e.g. topic)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 p-2">500</td>
                <td className="border border-gray-300 dark:border-gray-600 p-2">Server error</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="mt-12">
          <Link
            href="/settings/public-api"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Create API Key →
          </Link>
        </div>
      </div>
    </main>
  );
}
