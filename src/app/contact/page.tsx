"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    plan: "Enterprise",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission to API
    console.log("Form submitted:", formData);
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">Get in Touch</h1>
          <p className="text-xl text-gray-300">
            Have questions about Enterprise plans? We&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="-mt-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
              <h2 className="mb-6 text-2xl font-bold">Send us a Message</h2>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mb-4 text-6xl">✅</div>
                  <h3 className="mb-2 text-xl font-bold">Thank You!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                  >
                    ← Back to Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Interested Plan
                    </label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Starter">Starter ($29/mo)</option>
                      <option value="Pro">Pro ($99/mo)</option>
                      <option value="Enterprise">Enterprise ($499/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Tell us about your needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 py-4 font-semibold text-white transition-all hover:bg-blue-700"
                  >
                    Send Message
                  </button>

                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    🔒 We respect your privacy. No spam, ever.
                  </p>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-6 text-2xl font-bold">Contact Information</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📧</div>
                    <div>
                      <h3 className="mb-1 font-semibold">Email</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        sales@agentflow.pro
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        support@agentflow.pro
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-2xl">💬</div>
                    <div>
                      <h3 className="mb-1 font-semibold">Live Chat</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Available Mon-Fri, 9am-6pm PST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📅</div>
                    <div>
                      <h3 className="mb-1 font-semibold">Schedule a Demo</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Book a 30-minute demo with our team
                      </p>
                      <Link
                        href="/register"
                        className="mt-2 inline-block font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Book Now →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise Features */}
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="mb-4 text-xl font-bold">Enterprise Includes</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Unlimited Agent Runs
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Dedicated Support Manager
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Custom Integrations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      SLA Guarantee (99.9% uptime)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      On-premise Deployment Option
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Custom Training & Onboarding
                    </span>
                  </li>
                </ul>
              </div>

              {/* Response Time */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/30">
                <h3 className="mb-2 text-lg font-bold">⏱️ Response Time</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Enterprise inquiries:{" "}
                  <span className="font-semibold">Within 2 hours</span>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  General inquiries:{" "}
                  <span className="font-semibold">Within 24 hours</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            Ready to Transform Your Business?
          </h2>
          <p className="mb-8 text-xl text-gray-300">
            Let&apos;s discuss how AgentFlow Pro can help your team.
          </p>
          <Link
            href="/pricing"
            className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-900 shadow-lg transition-all hover:scale-105 hover:bg-gray-100"
          >
            View Pricing Plans
          </Link>
        </div>
      </section>
    </main>
  );
}
