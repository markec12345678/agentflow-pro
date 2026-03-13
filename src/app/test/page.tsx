"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
  const [status, setStatus] = useState("Checking...");
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    fetch("/dashboard", { method: "HEAD" })
      .then((r) => {
        setStatus(`✅ Server is running! Status: ${r.status}`);
      })
      .catch((e) => {
        setStatus(`❌ Server error: ${e.message}`);
      });
  }, []);

  async function testAPI(path: string) {
    setResults((prev) => [...prev, `Testing ${path}...`]);
    try {
      const start = Date.now();
      const response = await fetch(path);
      const duration = Date.now() - start;
      const data = await response.json().catch(() => null);

      setResults((prev) => [
        ...prev,
        `✅ ${path} - Status: ${response.status}, Duration: ${duration}ms`,
      ]);
    } catch (e: any) {
      setResults((prev) => [...prev, `❌ ${path} - Error: ${e.message}`]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">🎯 Dashboard Test Page</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Server Status</h2>
        <div className={`p-3 rounded ${status.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {status}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">KPI Cards (Mock Data)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm opacity-90">Occupancy Rate</h3>
            <div className="text-3xl font-bold">78%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm opacity-90">RevPAR</h3>
            <div className="text-3xl font-bold">€142</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm opacity-90">ADR</h3>
            <div className="text-3xl font-bold">€182</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm opacity-90">Direct Bookings</h3>
            <div className="text-3xl font-bold">35%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm opacity-90">Tasks Pending</h3>
            <div className="text-3xl font-bold">12</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">API Tests</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => testAPI("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test /dashboard
          </button>
          <button
            onClick={() => testAPI("/api/dashboard/boot")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test /api/dashboard/boot
          </button>
          <button
            onClick={() => testAPI("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test /login
          </button>
          <a
            href="/dashboard"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
          >
            Go to Dashboard →
          </a>
        </div>
        <div className="space-y-2">
          {results.map((result, i) => (
            <div key={i} className={`p-2 rounded ${result.includes("✅") ? "bg-green-100 text-green-800" : result.includes("❌") ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
