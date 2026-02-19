"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { status } = useSession();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const startCheckout = async (planId: string) => {
    if (checkoutLoading) return;
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else setCheckoutLoading(null);
    } catch {
      setCheckoutLoading(null);
    }
  };

  const plans = [
    {
      name: "Pro",
      id: "pro",
      price: isAnnual ? "$49" : "$59",
      period: isAnnual ? "month (billed yearly)" : "month/seat",
      description: "Powerful AI to stay on-brand, even at scale.",
      features: [
        "1 seat included",
        "10 Blog Posts/Month",
        "Canvas platform for accelerated content",
        "Essential Apps for core workflows",
        "2 Brand Voices",
        "5 Knowledge Items",
        "3 Audiences",
        "SEO Optimization",
        "1-Click Publish",
      ],
      cta: "Start Free 7-Day Trial",
      link: "/register?plan=pro",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Business",
      id: "business",
      price: "Custom",
      period: "pricing",
      description: "The AI platform built to elevate your brand.",
      features: [
        "Everything in Pro plus:",
        "Unlimited Blog Posts",
        "Advanced Apps for complex campaigns",
        "No-code AI App Builder",
        "Unlimited Brand Voices",
        "Unlimited Knowledge Items",
        "API access",
        "Dedicated account management",
        "Priority support",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      link: "/contact",
      highlighted: false,
      badge: null as string | null,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 7-day free
            trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={
                !isAnnual ? "text-white font-semibold" : "text-gray-300"
              }
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-blue-600 rounded-full"
              aria-label={
                isAnnual ? "Switch to monthly" : "Switch to annual"
              }
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  isAnnual ? "right-1" : "left-1"
                }`}
              />
            </button>
            <span
              className={
                isAnnual ? "text-white font-semibold" : "text-gray-300"
              }
            >
              Annual
            </span>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 20%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 -mt-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 transition-all ${
                  plan.highlighted
                    ? "shadow-2xl scale-105 border-2 border-blue-500"
                    : "shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-500 text-lg flex-shrink-0">
                        ✓
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.id === "pro" && status === "authenticated" ? (
                  <button
                    type="button"
                    onClick={() => startCheckout("pro")}
                    disabled={!!checkoutLoading}
                    data-testid="pro-checkout-cta"
                    className={`block w-full py-4 px-6 rounded-lg font-semibold text-center transition-all ${
                      plan.highlighted
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl disabled:opacity-70"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    }`}
                  >
                    {checkoutLoading === "pro" ? "Redirecting..." : plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.link}
                    data-testid={plan.id === "pro" ? "pro-checkout-cta" : undefined}
                    className={`block w-full py-4 px-6 rounded-lg font-semibold text-center transition-all ${
                      plan.highlighted
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                  🔒 7-day free trial • No credit card required
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                will be prorated and applied to your next billing cycle.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! All plans come with a 7-day free trial. No credit card
                required to start.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You&apos;ll receive a notification at 80% usage. You can either
                upgrade your plan or purchase additional posts at $10/post.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses automating their content with AI.
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-900 hover:bg-gray-100 text-lg px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Start Free 7-Day Trial
          </Link>
          <p className="text-gray-400 mt-6 text-sm">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  );
}
