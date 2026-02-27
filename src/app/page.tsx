"use client";

import Link from "next/link";
import { CASE_STUDIES } from "@/data/case-studies";
import { SOLUTIONS, INDUSTRIES } from "@/data/solutions";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-white/90">
              Specialized for Tourism & Hospitality
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Generate{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              booking descriptions
            </span>
            , destination guides, and campaigns — in seconds.
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-lg text-blue-100 md:text-xl">
            Od AI besedila do polnega koledarja – vse v enem orodju za turizem
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/onboarding"
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              Start Free Trial
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() =>
                document.getElementById("demo-video")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Watch 90-sec Demo
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> SL, EN, DE, IT, HR
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> SEO-optimized
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span> No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Zakaj AgentFlow Pro? */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Zakaj AgentFlow Pro?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Druga orodja ponujajo samo AI vsebino. AgentFlow Pro združuje vsebino in operacije: koledar rezervacij, email scheduler, PMS sinhronizacija – vse v enem.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">5+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Jezikov vsebine</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">SEO</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Optimizirano</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dni brezplačno</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Kreditna kartica</div>
            </div>
          </div>
          <p className="text-center mt-6">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Preberite uspešne primere uporabe →
            </Link>
          </p>
        </div>
      </section>

      {/* Try Now Section */}
      <section id="demo-video" className="py-12 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            V petih minutah do prve vsebine
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Odberite tip nastanitve, vnesite ime in lokacijo – AI ustvari opis, vodič ali kampanjo. Brez kreditne kartice.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Začni zdaj
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Two Ways Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-4xl font-bold text-center mb-12">
          Two Ways to Use AgentFlow Pro
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Simple Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-green-500">
            <div className="text-4xl mb-4">🟢</div>
            <h3 className="text-2xl font-bold mb-4">Simple Mode</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>One-click content generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>No configuration needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Perfect for beginners</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Get results in minutes</span>
              </li>
            </ul>
            <Link
              href="/generate"
              className="mt-6 block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
            >
              Try Simple Mode →
            </Link>
          </div>

          {/* Advanced Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-blue-500">
            <div className="text-4xl mb-4">🔵</div>
            <h3 className="text-2xl font-bold mb-4">Advanced Mode</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Visual workflow builder</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Custom AI agent configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Export/Import workflows</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Full control & flexibility</span>
              </li>
            </ul>
            <Link
              href="/workflows"
              className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
            >
              Try Advanced Mode →
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Stories / Case Studies */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Customer Stories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            See how teams use AgentFlow Pro to scale their content without
            scaling headcount.
          </p>
          <div className="mb-10 flex flex-wrap justify-center gap-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-5 py-3 text-center">
              <span className="font-semibold text-blue-900 dark:text-blue-100">Alpine Destinations</span>
              <span className="text-gray-600 dark:text-gray-400"> — 60% content time saved, 30 guides/quarter</span>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-3 text-center">
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">Nexus Digital</span>
              <span className="text-gray-600 dark:text-gray-400"> — 50% time per deliverable, 8 new clients in 6 months</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CASE_STUDIES.map((study, i) => {
              const colorClasses = [
                "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
              ];
              const cls = colorClasses[i % 3];
              return (
                <div
                  key={study.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-4 ${cls}`}
                  >
                    {study.company.charAt(0)}
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-4">
                    &quot;{study.quote}&quot;
                  </blockquote>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {study.company}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {study.role}
                  </p>
                  <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                    {study.metric} {study.metricLabel}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/stories"
              className="inline-block text-blue-600 hover:underline dark:text-blue-400 font-medium"
            >
              Read full case studies →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            4 AI Agents at Your Service
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Each agent specializes in a different task. Combine them to create
            powerful automated workflows.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Research Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Research Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Web scraping, market intelligence, competitor analysis
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Firecrawl
                </span>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  SerpAPI
                </span>
              </div>
            </div>

            {/* Content Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold mb-2">Content Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Blog posts, social media, emails with SEO optimization
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Context7
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  LLM
                </span>
              </div>
            </div>

            {/* Code Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold mb-2">Code Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Code generation, reviews, auto PR creation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  GitHub MCP
                </span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  Code Review
                </span>
              </div>
            </div>

            {/* Deploy Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Deploy Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                One-click deploy to Vercel, Netlify with rollback
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                  Vercel
                </span>
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                  Netlify
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Build powerful automation workflows in minutes, not days.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Choose Agents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select from 4 specialized AI agents for your workflow
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Build Workflow</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag & drop visual builder with conditional logic
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Deploy & Scale</h3>
              <p className="text-gray-600 dark:text-gray-400">
                One-click deploy with automatic scaling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Role */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Solutions by Role
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            AgentFlow Pro tailors to your role. Pick your path.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SOLUTIONS.map((solution) => (
              <Link
                key={solution.id}
                href={`/solutions/${solution.id}`}
                className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 block"
              >
                {solution.icon && (
                  <span className="text-2xl mb-2 block">{solution.icon}</span>
                )}
                <h3 className="text-xl font-bold dark:text-white mb-2">
                  {solution.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {solution.cardDescription ?? solution.description}
                </p>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ICP - Za koga je AgentFlow Pro? */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Za koga je AgentFlow Pro?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-3">Primarni cilji</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Boutique hoteli (10–50 sob) z direktnimi rezervacijami</li>
                <li>• Lokalni DMO z več nastanitvami pod enim krovom</li>
                <li>• Kampi z sezonskimi cenami in turistično takso</li>
              </ul>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">Sekundarni cilji</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Apartmaji z več enotami (3–10)</li>
                <li>• Touroperatorji z lastno vsebino</li>
              </ul>
            </div>
            <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-3">Ne ciljam</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Verige hotelov z lastnim IT oddelkom</li>
                <li>• Enterprise PMS uporabniki</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Industry */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Solutions by Industry
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            AgentFlow Pro adapts to your industry. Tourism, hotels, DMOs, tech, e-commerce.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INDUSTRIES.map((industry) => (
              <Link
                key={industry.id}
                href={`/solutions/industry/${industry.id}`}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 block"
              >
                <span className="text-2xl mb-2 block">
                  {industry.icon ?? "📌"}
                </span>
                <h3 className="text-lg font-bold dark:text-white mb-2">
                  {industry.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {industry.cardDescription ?? industry.description}
                </p>
                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-2 inline-block">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Zaupanje in varnost - Trust Signals */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Zaupanje in varnost
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Vaši podatki in vsebina so varni. Transparentno in skladno s predpisi.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🔒</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">GDPR compliant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">EU hosting, podatki v Evropi</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🛡️</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">SOC 2 Type I</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">V pripravi (2026 Q2)</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🔐</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Google OAuth + 2FA</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prijava z Google ✓, 2FA prihaja</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">💾</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Avtomatski backup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Backup podatkov (PostgreSQL)</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">📋</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Transparentni logi</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Link href="/settings/audit" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Vsaka AI akcija se logira →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Automate Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the future of AI-powered business automation.
          </p>
          <Link
            href="/onboarding"
            className="bg-white text-blue-900 hover:bg-gray-100 text-lg px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
