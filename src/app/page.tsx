"use client";

import Link from "next/link";
import { CASE_STUDIES } from "@/data/case-studies";
import { SOLUTIONS, INDUSTRIES } from "@/data/solutions";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { DashboardPreview } from "@/components/DashboardPreview";

export default function HomePage() {
  return (
    <>
      <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 text-white py-20 md:py-24 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* Left side: Text */}
          <div className="text-center md:text-left">
            <span className="badge bg-primary-600 text-sm px-3 py-1 rounded-full">
              🚀 The First AI Operations System for Modern Tourism
            </span>

            <h1 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
              Automate Your Hotel, <br />
              <span className="text-yellow-300">Reclaim Your Day.</span>
            </h1>

            <p className="text-lg md:text-xl mt-6 text-primary-200 max-w-xl mx-auto md:mx-0">
              8 specialized AI agents work for you—handling reservations, guest
              communication, eTourism compliance, and payments. All in one
              place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/demo"
                className="bg-yellow-400 text-primary-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition text-center"
              >
                🎯 Get a Free Demo
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-primary-900 transition text-center"
              >
                ▶ See How It Works
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-primary-200 justify-center md:justify-start">
              <span>✅ 14-Day Free Trial</span>
              <span>✅ No Credit Card Required</span>
            </div>
          </div>

          {/* Right side: Dashboard Preview */}
          <div className="relative hidden md:block">
            <div className="bg-white/10 backdrop-blur rounded-xl shadow-2xl border-4 border-white/20 p-4">
              <DashboardPreview />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-bounce">
              <span>🤖</span>
              <span>87% Automated Bookings</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-bounce" style={{ animationDelay: "0.5s" }}>
              <span>⏱️</span>
              <span>5 Mins/Day Management</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SEKCIJA */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase mb-8">
            Trusted by leaders in Slovenian tourism
          </p>

          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
            {/* Logo 1: eTurizem */}
            <div className="logo-item opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0">
              <img
                src="/logos/eturizem.svg"
                alt="eTurizem AJPES"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => {
                  // Fallback če slika ne obstaja
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23666">eTurizem</text></svg>';
                }}
              />
            </div>

            {/* Logo 2: Booking.com */}
            <div className="logo-item opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0">
              <img
                src="/logos/booking.svg"
                alt="Booking.com"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23666">Booking.com</text></svg>';
                }}
              />
            </div>

            {/* Logo 3: Airbnb */}
            <div className="logo-item opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0">
              <img
                src="/logos/airbnb.svg"
                alt="Airbnb"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23666">Airbnb</text></svg>';
                }}
              />
            </div>

            {/* Logo 4: Stripe */}
            <div className="logo-item opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0">
              <img
                src="/logos/stripe.svg"
                alt="Stripe"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23666">Stripe</text></svg>';
                }}
              />
            </div>

            {/* Logo 5: Custom Partner */}
            <div className="logo-item opacity-60 hover:opacity-100 transition duration-300 grayscale hover:grayscale-0">
              <img
                src="/logos/partner-placeholder.svg"
                alt="Partner"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23666">Partner</text></svg>';
                }}
              />
            </div>
          </div>

          {/* Optional: Trust badge */}
          <div className="mt-8 flex justify-center items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              GDPR Compliant
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              EU Data Hosting
            </span>
          </div>
        </div>
      </section>

      {/* Why AgentFlow Pro? */}

      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Why AgentFlow Pro?
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Other tools just offer AI content. AgentFlow Pro combines content
            with operations: reservation calendars, email schedulers, and PMS
            sync—all in one.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                5+
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Content Languages
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                SEO
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Optimized
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                7
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Day Free Trial
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                0
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Credit Card Needed
              </div>
            </div>
          </div>

          <p className="text-center mt-6">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Read our customer stories →
            </Link>
          </p>
        </div>
      </section>

      {/* PROBLEM → SOLUTION SEKCIJA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Does this sound familiar? 😓
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You're not alone. Most hospitality managers face these daily challenges.
            </p>
          </div>
          
          {/* Problem Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* Problem 1: Phone Calls */}
            <div className="card p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Endless Phone Calls</h3>
              <p className="text-gray-600 mb-4">
                Guests calling for basic info that could be automated – check-in times, 
                WiFi password, parking details.
              </p>
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium inline-block">
                − 2 hours/day lost
              </div>
            </div>
            
            {/* Problem 2: Manual Price Updates */}
            <div className="card p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Price Updates</h3>
              <p className="text-gray-600 mb-4">
                Every week you manually update prices on eTurizem, Booking, Airbnb... 
                One mistake costs you money.
              </p>
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium inline-block">
                − 5 hours/week lost
              </div>
            </div>
            
            {/* Problem 3: Email Overload */}
            <div className="card p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Overload</h3>
              <p className="text-gray-600 mb-4">
                Confirmations, instructions, thank-yous – writing each one manually 
                while trying to run your business.
              </p>
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium inline-block">
                − 50+ emails/week
              </div>
            </div>
            
          </div>
          
          {/* Solution Box */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 md:p-10 rounded-2xl border border-green-200">
            <div className="text-center max-w-3xl mx-auto">
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                🎯 The Solution: AgentFlow Pro
              </h3>
              
              <p className="text-lg text-gray-700 mb-8">
                Our AI agents take over <span className="font-semibold text-green-700">87% of your daily tasks</span> – 
                you focus on guests and growing your business.
              </p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 md:gap-12">
                
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">87%</div>
                  <div className="text-gray-600 text-sm md:text-base">Automated</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">5 min</div>
                  <div className="text-gray-600 text-sm md:text-base">Work per day</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">24/7</div>
                  <div className="text-gray-600 text-sm md:text-base">Available to guests</div>
                </div>
                
              </div>
              
              {/* Optional CTA */}
              <div className="mt-8">
                <a 
                  href="#pricing" 
                  className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition"
                >
                  See how it works →
                </a>
              </div>
              
            </div>
          </div>
          
        </div>
      </section>

      {/* HOW IT WORKS SEKCIJA */}
      <section id="kako-deluje" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works? 🤔
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Just 3 simple steps to full automation
            </p>
          </div>
          
          {/* Steps Grid with Connecting Line (Desktop) */}
          <div className="relative">
            
            {/* Connecting line - visible only on desktop */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 z-0"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              
              {/* Step 1: Connect */}
              <div className="text-center">
                {/* Step Number Circle */}
                <div className="w-24 h-24 mx-auto bg-blue-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg border-4 border-white">
                  1
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect Your System</h3>
                <p className="text-gray-600 mb-4">
                  Link your existing booking system, eTurizem, and other channels. 
                  No coding required.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  ⏱️ 30 minutes setup
                </div>
              </div>
              
              {/* Step 2: Configure */}
              <div className="text-center">
                {/* Step Number Circle */}
                <div className="w-24 h-24 mx-auto bg-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg border-4 border-white">
                  2
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Configure Your Agents</h3>
                <p className="text-gray-600 mb-4">
                  Set rules for auto-approvals, dynamic pricing, and notifications. 
                  Customize to your business needs.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  ⏱️ 1 hour configuration
                </div>
              </div>
              
              {/* Step 3: Automate */}
              <div className="text-center">
                {/* Step Number Circle */}
                <div className="w-24 h-24 mx-auto bg-yellow-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg border-4 border-white">
                  3
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Automation Works</h3>
                <p className="text-gray-600 mb-4">
                  The system runs automatically – you only review exceptions. 
                  Focus on guests and growth.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  ⏱️ 5 min/day monitoring
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Optional: Visual Flow Diagram Placeholder */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <p className="text-gray-500 text-sm mb-2">Visual Workflow Preview</p>
              <div className="flex items-center justify-center gap-4 text-gray-400">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Guest Books</span>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">AI Agents Process</span>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">Confirmed ✓</span>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* FEATURES SEKCIJA - 8 AI AGENTS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              8 Specialized AI Agents 🤖
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each agent is an expert in its domain – working together as one intelligent system.
            </p>
          </div>
          
          {/* Agents Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Agent 1: Research */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Research Agent</h3>
              <p className="text-gray-600 text-sm">
                Market intelligence, competitor analysis, and tourism trends – automatically gathered.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 2: Content */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📝</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Content Agent</h3>
              <p className="text-gray-600 text-sm">
                SEO-optimized blog posts, landing pages, and social media – in 20+ languages.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 3: Reservation */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏨</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reservation Agent</h3>
              <p className="text-gray-600 text-sm">
                Automated booking management, availability sync, and guest confirmation workflows.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 4: Communication */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Communication Agent</h3>
              <p className="text-gray-600 text-sm">
                Personalized guest emails, SMS notifications, and 24/7 automated responses.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 5: Personalization */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Personalization Agent</h3>
              <p className="text-gray-600 text-sm">
                Brand voice consistency, guest preference learning, and tailored experiences.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 6: Optimization */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Optimization Agent</h3>
              <p className="text-gray-600 text-sm">
                Dynamic pricing, A/B testing, and conversion optimization – data-driven decisions.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 7: Deploy */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deploy Agent</h3>
              <p className="text-gray-600 text-sm">
                One-click deployments to Vercel/Netlify, automated updates, and rollback protection.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Agent 8: Code */}
            <div className="agent-card group p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-500 transition duration-300 cursor-default">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Code Agent</h3>
              <p className="text-gray-600 text-sm">
                Automated development tasks, bug fixes, and feature suggestions – your dev assistant.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
          </div>
          
          {/* Optional: CTA Row */}
          <div className="mt-12 text-center">
            <a 
              href="#pricing" 
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition"
            >
              See all features in detail →
            </a>
          </div>
          
        </div>
      </section>

      {/* TOURISM SPECIFICS SEKCIJA */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Slovenia 🇸🇮
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed specifically for Slovenian tourism – with local integrations and compliance built-in.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Feature 1: eTurizem AJPES */}
            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏛️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">eTurizem AJPES Integration</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Auto-sync prices & availability
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Real-time updates to national portal
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      GDPR-compliant data handling
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Zero manual entry required
                    </li>
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <span>View integration docs</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature 2: GDPR Compliance */}
            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">GDPR Compliance Built-In</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      EU-based data hosting (Frankfurt)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      One-click data export/delete
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Consent management dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Full audit logs for compliance
                    </li>
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <span>Read GDPR policy</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature 3: Multi-Language */}
            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">20+ Languages Supported</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Auto-translate content & emails
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Guest-facing UI in their language
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Localized pricing (EUR, USD, GBP...)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Cultural adaptation for content
                    </li>
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <span>See supported languages</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature 4: Stripe Payments */}
            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Stripe Payments Integrated</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      All major credit cards accepted
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Apple Pay / Google Pay support
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Auto-invoice generation (PDF)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Refund processing automation
                    </li>
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <span>View payment options</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Trust Badge Row */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              ISO 27001 Certified
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              SOC 2 Type II Compliant
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              99.9% Uptime SLA
            </div>
          </div>
          
        </div>
      </section>

      {/* PRICING SEKCIJA */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing 💰
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. 14-day free trial. Cancel anytime.
            </p>
          </div>
          
          {/* Pricing Toggle (Monthly/Yearly) - Optional */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-2 text-sm font-medium bg-white text-gray-900 rounded-md shadow-sm">
                Monthly
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Yearly <span className="text-green-600 text-xs ml-1">Save 20%</span>
              </button>
            </div>
          </div>
          
          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Starter Tier */}
            <div className="pricing-card p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition duration-300 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">€99</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">1 property</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Up to 100 bookings/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">4 AI agents</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-400">eTurizem integration</span>
                </li>
              </ul>
              
              <button className="w-full py-3 border-2 border-blue-500 text-blue-500 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition">
                Start Free Trial
              </button>
            </div>
            
            {/* Professional Tier (HIGHLIGHTED) */}
            <div className="pricing-card relative p-8 rounded-2xl border-2 border-yellow-400 bg-yellow-50 hover:border-yellow-500 transition duration-300">
              {/* Most Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-blue-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                🌟 MOST POPULAR
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">€299</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Up to 5 properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Up to 500 bookings/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">All 8 AI agents</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">eTurizem integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              
              <button className="w-full py-3 bg-yellow-400 text-blue-900 rounded-lg font-bold hover:bg-yellow-300 transition shadow-md">
                Start Free Trial
              </button>
            </div>
            
            {/* Enterprise Tier */}
            <div className="pricing-card p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition duration-300 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">€999</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Unlimited properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Unlimited bookings</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">White-label option</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Dedicated support</span>
                </li>
              </ul>
              
              <button className="w-full py-3 border-2 border-blue-500 text-blue-500 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition">
                Contact Sales
              </button>
            </div>
            
          </div>
          
          {/* Trust/FAQ Row */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              All plans include: ✅ 14-day free trial ✅ No credit card required ✅ Cancel anytime ✅ GDPR compliant
            </p>
            <a 
              href="#faq" 
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition"
            >
              Have questions? View FAQ →
            </a>
          </div>
          
        </div>
      </section>

      {/* TESTIMONIALS SEKCIJA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say 💬
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real results from Slovenian hospitality businesses using AgentFlow Pro.
            </p>
          </div>
          
          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Testimonial 1: Hotel Director */}
            <div className="testimonial-card bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-gray-700 mb-6 italic">
                "Before AgentFlow Pro, I spent 3 hours daily on reservations. Now it's just 15 minutes. 
                The auto-approval for eTurizem alone saved us countless hours. Absolutely invaluable!"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-blue-700">JN</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Janez Novak</div>
                  <div className="text-sm text-gray-500">Director, Hotel Bled</div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    ✅ 87% auto-approval rate
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2: Apartment Owner */}
            <div className="testimonial-card bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-gray-700 mb-6 italic">
                "The eTurizem sync works flawlessly. I no longer worry about updating prices manually. 
                My guests get instant confirmations in their language. It just works!"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-green-700">MZ</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Maja Zupan</div>
                  <div className="text-sm text-gray-500">Owner, Apartmaji Piran</div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    ✅ Zero manual price updates
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3: Resort Manager */}
            <div className="testimonial-card bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-gray-700 mb-6 italic">
                "87% of our bookings are now fully automated. The AI agents handle everything from 
                initial inquiry to check-out instructions. I finally have time for strategy."
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-yellow-700">PK</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Peter Kralj</div>
                  <div className="text-sm text-gray-500">Manager, Resort Portorož</div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    ✅ 4.8/5 guest satisfaction
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600 text-sm">Happy Customers</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
              <div className="text-gray-600 text-sm">Auto-Approval Rate</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-yellow-600 mb-2">4.8/5</div>
              <div className="text-gray-600 text-sm">Avg. Rating</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600 text-sm">Support Available</div>
            </div>
          </div>
          
          {/* Optional: CTA */}
          <div className="mt-12 text-center">
            <a 
              href="#pricing" 
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition"
            >
              Join them – Start your free trial →
            </a>
          </div>
          
        </div>
      </section>

      {/* FAQ SEKCIJA */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions ❓
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about AgentFlow Pro. Can't find your answer? 
              <a href="/contact" className="text-blue-600 hover:underline ml-1">Contact us</a>.
            </p>
          </div>
          
          {/* FAQ Grid - 2 Columns on Desktop */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* FAQ Item 1 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    Do I need technical skills to use AgentFlow Pro?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Not at all! AgentFlow Pro is designed for hospitality professionals, not developers. 
                  Setup takes 1-2 hours with our guided wizard, and the interface is intuitive. 
                  If you can use email and a calendar, you can use AgentFlow Pro.
                </p>
              </details>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    Is my data secure and GDPR compliant?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Absolutely. All data is hosted in EU data centers (Frankfurt), encrypted in transit and at rest. 
                  We're GDPR compliant with built-in tools for data export, deletion, and consent management. 
                  Full audit logs are available for compliance reporting.
                </p>
              </details>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    What happens if the system goes down?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We maintain 99.9% uptime with redundant infrastructure and automated failover. 
                  In the rare event of an issue, you'll receive instant alerts, and our support team 
                  is available 24/7. Professional and Enterprise plans include priority response within 15 minutes.
                </p>
              </details>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    Can I cancel anytime? Are there hidden fees?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Yes, you can cancel anytime with no penalties. There are no hidden fees, setup costs, 
                  or long-term contracts. What you see is what you pay. Your data is always yours – 
                  export it anytime in standard formats.
                </p>
              </details>
            </div>
            
            {/* FAQ Item 5 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    Does it integrate with my existing booking system?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Yes! AgentFlow Pro integrates with most major booking systems, channel managers, 
                  and the Slovenian eTurizem portal. If your system has an API, we can likely connect. 
                  Our team helps with setup during onboarding.
                </p>
              </details>
            </div>
            
            {/* FAQ Item 6 */}
            <div className="faq-item bg-gray-50 rounded-xl p-6 border border-gray-200">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    How does the 14-day free trial work?
                  </h3>
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Sign up with your email – no credit card required. You get full access to all features 
                  of your selected plan for 14 days. If you love it, upgrade anytime. If not, your account 
                  automatically downgrades to free with no charges. Simple and risk-free.
                </p>
              </details>
            </div>
            
          </div>
          
          {/* Still Have Questions? CTA */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Still have questions?</h3>
              <p className="text-gray-600 mb-6">
                Our team is here to help. Get personalized answers in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  💬 Chat with us
                </a>
                <a 
                  href="mailto:support@agentflow.pro" 
                  className="inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  📧 Email support
                </a>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* FINAL CTA SEKCIJA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Automate Your Hospitality Business? 🚀
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join 100+ Slovenian hotels and apartments saving 10+ hours per week with AgentFlow Pro.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="/signup" 
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition shadow-lg"
            >
              🎯 Start Your Free Trial
            </a>
            <a 
              href="/demo" 
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-900 transition"
            >
              ▶ Watch Demo (2 min)
            </a>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Cancel anytime
            </span>
          </div>
          
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <span className="text-white font-bold text-xl">AgentFlow Pro</span>
              </div>
              <p className="text-sm mb-6 max-w-xs">
                AI-powered automation for Slovenian tourism. Save time, grow your business, delight your guests.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a href="https://linkedin.com" className="hover:text-white transition" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="https://twitter.com" className="hover:text-white transition" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="https://facebook.com" className="hover:text-white transition" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/features" className="hover:text-white transition">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="/demo" className="hover:text-white transition">Live Demo</a></li>
                <li><a href="/integrations" className="hover:text-white transition">Integrations</a></li>
                <li><a href="/changelog" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>
            
            {/* Resources Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/docs" className="hover:text-white transition">Documentation</a></li>
                <li><a href="/guides" className="hover:text-white transition">User Guides</a></li>
                <li><a href="/api" className="hover:text-white transition">API Reference</a></li>
                <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="/support" className="hover:text-white transition">Support Center</a></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/about" className="hover:text-white transition">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
                <li><a href="/careers" className="hover:text-white transition">Careers</a></li>
                <li><a href="/partners" className="hover:text-white transition">Partners</a></li>
                <li><a href="/press" className="hover:text-white transition">Press</a></li>
              </ul>
            </div>
            
          </div>
          
          {/* Legal Row */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} AgentFlow Pro. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition">Terms of Service</a>
              <a href="/gdpr" className="hover:text-white transition">GDPR</a>
              <a href="/cookies" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
          
          {/* Optional: Status Badge */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <a href="/status" className="hover:text-gray-300 transition flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              All systems operational • 99.9% uptime
            </a>
          </div>
          
        </div>
      </footer>

      {/* Try Now Section */}

      <section
        id="demo-video"
        className="py-12 px-4 bg-gray-50 dark:bg-gray-800/50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Get Your First Content in Five Minutes
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select your accommodation type, enter a name and location—our AI
            will generate descriptions, guides, or campaigns for you. No credit
            card required.
          </p>

          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Start Now
            <svg
              className="h-4 w-4"
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
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Alpine Destinations
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {" "}
                — 60% content time saved, 30 guides/quarter
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-3 text-center">
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                Nexus Digital
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {" "}
                — 50% time per deliverable, 8 new clients in 6 months
              </span>
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
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-sm">
                  Web Research
                </span>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-sm">
                  Market Analysis
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
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-sm">
                  AI Content
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-sm">
                  SEO Optimization
                </span>
              </div>
            </div>

            {/* Code Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-purple-500">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold mb-2">Code Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Code generation, reviews, and automated pull requests.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-sm">
                  Code Review
                </span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-sm">
                  Automated Commits
                </span>
              </div>
            </div>

            {/* Deploy Agent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Deploy Agent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                One-click website publishing with rollback capabilities.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-sm">
                  Website Publishing
                </span>
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-sm">
                  Automated Deployment
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

      {/* ICP - Who is AgentFlow Pro For? */}

      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Who is AgentFlow Pro For?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-3">
                Primary Audience
              </h3>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Boutique hotels (10-50 rooms) with direct bookings</li>

                <li>• Local DMOs managing multiple properties</li>

                <li>• Campsites with seasonal pricing and tourist tax</li>
              </ul>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">
                Secondary Audience
              </h3>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Apartment complexes (3-10 units)</li>

                <li>• Tour operators creating their own content</li>
              </ul>
            </div>

            <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-3">
                Not For
              </h3>

              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Hotel chains with a dedicated IT department</li>

                <li>• Users of enterprise-level PMS</li>
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
            AgentFlow Pro adapts to your industry. Tourism, hotels, DMOs, tech,
            e-commerce.
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

      {/* Trust and Security */}

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Trust and Security
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Your data and content are secure. Transparent and compliant by
            design.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🔒</span>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                GDPR compliant
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                EU hosting, data in Europe
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🛡️</span>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                SOC 2 Type I
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                In progress (2026 Q2)
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">🔐</span>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Google OAuth + 2FA
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google Login ✓, 2FA coming soon
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">💾</span>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Automatic Backups
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Data backup (PostgreSQL)
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl mb-2 block">📋</span>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Transparent Logs
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Link
                  href="/settings/audit"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Every AI action is logged →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-linear-to-r from-blue-900 to-purple-900">
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
      <PwaInstallPrompt />
    </>
  );
}
