"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardPreview } from "@/components/DashboardPreview";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "reservations" | "automation">("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <span className="badge bg-white/20 text-sm px-4 py-1.5 rounded-full inline-block mb-4">
            🎯 See AgentFlow Pro in Action
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Experience the Future of Hotel Automation
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            See how 8 AI agents work together to automate 87% of your daily tasks
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition text-center"
            >
              🚀 Start 14-Day Free Trial
            </Link>
            <Link
              href="#book-demo"
              className="border-2 border-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition text-center"
            >
              📅 Book Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Product Demo
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore the dashboard and see how AgentFlow Pro simplifies your operations
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "overview"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab("reservations")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "reservations"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                📅 Reservations
              </button>
              <button
                onClick={() => setActiveTab("automation")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "automation"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                🤖 Automation
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="flex-1 ml-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 max-w-md">
                      agentflow.pro/dashboard
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Content Area */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <DashboardPreview />
                  </div>
                )}

                {activeTab === "reservations" && (
                  <div className="space-y-6">
                    {/* Reservation Calendar Preview */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Today's Stats */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Arrivals Today</div>
                        <div className="text-3xl font-bold text-blue-900 dark:text-white">12</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">↑ 3 from yesterday</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-5 border border-green-200 dark:border-green-700">
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Departures Today</div>
                        <div className="text-3xl font-bold text-green-900 dark:text-white">8</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-2">All checked out</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5 border border-purple-200 dark:border-purple-700">
                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Occupancy Rate</div>
                        <div className="text-3xl font-bold text-purple-900 dark:text-white">87%</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">↑ 12% this week</div>
                      </div>
                    </div>

                    {/* Upcoming Reservations Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Reservations</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-in</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-out</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[
                              { name: "John Smith", room: "Deluxe Suite", checkin: "Mar 15", checkout: "Mar 20", status: "Confirmed", statusColor: "green" },
                              { name: "Maria García", room: "Ocean View", checkin: "Mar 16", checkout: "Mar 22", status: "Pending", statusColor: "yellow" },
                              { name: "Thomas Müller", room: "Standard Room", checkin: "Mar 17", checkout: "Mar 19", status: "Confirmed", statusColor: "green" },
                              { name: "Sophie Dubois", room: "Family Suite", checkin: "Mar 18", checkout: "Mar 25", status: "Checked In", statusColor: "blue" },
                            ].map((reservation, i) => (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                                      {reservation.name.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{reservation.name}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{reservation.room}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{reservation.checkin}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{reservation.checkout}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    reservation.statusColor === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    reservation.statusColor === "yellow" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}>
                                    {reservation.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "automation" && (
                  <div className="space-y-6">
                    {/* Automation Stats */}
                    <div className="grid md:grid-cols-4 gap-4">
                      {[
                        { label: "Emails Automated", value: "247", change: "+18%", icon: "📧", color: "blue" },
                        { label: "Bookings Auto-Approved", value: "89", change: "+12%", icon: "✅", color: "green" },
                        { label: "Tasks Completed", value: "1,284", change: "+24%", icon: "⚡", color: "purple" },
                        { label: "Hours Saved", value: "42", change: "this week", icon: "⏰", color: "orange" },
                      ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-800/20 rounded-xl p-5 border border-${stat.color}-200 dark:border-${stat.color}-700`}>
                          <div className="text-2xl mb-2">{stat.icon}</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-2">{stat.change}</div>
                        </div>
                      ))}
                    </div>

                    {/* Automation Workflow */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Active Automation Workflows</h3>
                      <div className="space-y-4">
                        {[
                          { name: "Guest Welcome Email", trigger: "After booking confirmed", status: "Active", runs: "124 runs this week" },
                          { name: "Pre-Arrival Reminder", trigger: "2 days before check-in", status: "Active", runs: "89 runs this week" },
                          { name: "Review Request", trigger: "1 day after checkout", status: "Active", runs: "67 runs this week" },
                          { name: "Dynamic Pricing Update", trigger: "Daily at 6 AM", status: "Active", runs: "7 runs this week" },
                          { name: "eTourism Sync", trigger: "Real-time", status: "Active", runs: "234 runs this week" },
                        ].map((workflow, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                                ⚙️
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{workflow.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Trigger: {workflow.trigger}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                {workflow.status}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{workflow.runs}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What You'll Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to automate your hotel operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: "🤖",
                title: "8 AI Agents",
                description: "Specialized agents for research, content, reservations, guest communication, and more.",
                features: ["Research Agent", "Content Agent", "Reservation Agent", "Guest Communication Agent"],
              },
              {
                icon: "📊",
                title: "Real-Time Analytics",
                description: "Live dashboard with occupancy rates, revenue tracking, and performance metrics.",
                features: ["Revenue Dashboard", "Occupancy Tracking", "Channel Performance", "Custom Reports"],
              },
              {
                icon: "⚡",
                title: "Automation Workflows",
                description: "Set up powerful automations that run 24/7 without manual intervention.",
                features: ["Email Automation", "Auto-Approval Rules", "Dynamic Pricing", "PMS Sync"],
              },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Hoteliers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what our customers say about AgentFlow Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "AgentFlow Pro saved us 15+ hours per week. The automation is incredible!",
                author: "Ana Novak",
                role: "Hotel Manager, Hotel Slovenija",
                avatar: "AN",
              },
              {
                quote: "Finally, a tool that understands tourism. The eTourism integration is flawless.",
                author: "Marko Horvat",
                role: "Owner, Bled Apartments",
                avatar: "MH",
              },
              {
                quote: "Our direct bookings increased by 40% thanks to the automated marketing.",
                author: "Petra Zupan",
                role: "Director, Coastal Resorts",
                avatar: "PZ",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book Demo Section */}
      <section id="book-demo" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to See It Live?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Book a personalized demo with our team. We'll show you exactly how AgentFlow Pro can transform your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition"
              >
                🚀 Start Free Trial (No Card Required)
              </Link>
              <a
                href="mailto:demo@agentflow.pro"
                className="border-2 border-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition"
              >
                📧 Contact Sales
              </a>
            </div>
            <div className="mt-8 text-sm text-blue-100">
              ✓ 14-day free trial  •  ✓ No credit card required  •  ✓ Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Join 500+ hotels already using AgentFlow Pro
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Get started now →
          </Link>
        </div>
      </section>
    </div>
  );
}
