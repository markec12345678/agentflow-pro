"use client";

import Link from "next/link";
import { useState } from "react";

// Feature Check Component
function FeatureCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 text-lg text-green-500">✓</span>
      <span className="text-gray-700 dark:text-gray-300">{children}</span>
    </li>
  );
}

// Feature X Component (for excluded features)
function FeatureX({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 opacity-50">
      <span className="flex-shrink-0 text-lg text-gray-400">✕</span>
      <span className="text-gray-500 dark:text-gray-400">{children}</span>
    </li>
  );
}

// Pricing Card Component
function PricingCard({
  plan,
  price,
  period,
  description,
  features,
  excludedFeatures,
  ctaText,
  ctaLink,
  highlighted = false,
  badge,
}: {
  plan: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  excludedFeatures?: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-white p-8 transition-all dark:bg-gray-800 ${highlighted
        ? "scale-105 border-2 border-blue-500 shadow-2xl"
        : "border-gray-200 shadow-lg hover:shadow-xl dark:border-gray-700"
        }`}
    >
      {/* Popular Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
            {badge}
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {plan}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {price}
          </span>
          <span className="text-gray-600 dark:text-gray-400">{period}</span>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      {/* Features List */}
      <ul className="mb-8 space-y-4">
        {features.map((feature, index) => (
          <FeatureCheck key={index}>{feature}</FeatureCheck>
        ))}
        {excludedFeatures?.map((feature, index) => (
          <FeatureX key={index}>{feature}</FeatureX>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={ctaLink}
        className={`block w-full rounded-lg px-6 py-4 text-center font-semibold transition-all ${highlighted
          ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl"
          : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          }`}
      >
        {ctaText}
      </Link>

      {/* Money Back Guarantee */}
      <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        🔒 14-day money-back guarantee
      </p>
    </div>
  );
}

// FAQ Item Component
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          {question}
        </span>
        <span className="text-2xl text-gray-500">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <p className="mt-3 text-gray-600 dark:text-gray-400">{answer}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const plans = [
    {
      plan: "Starter",
      priceMonthly: 29,
      description: "Perfect for freelancers and solo entrepreneurs",
      features: [
        "100 Agent Runs/month",
        "3 Active Workflows",
        "4 AI Agents (Research, Content, Code, Deploy)",
        "Basic Analytics",
        "Email Support",
        "API Access",
      ],
      excludedFeatures: [
        "Custom Integrations",
        "Priority Support",
        "Team Collaboration",
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/register?plan=starter",
      highlighted: false,
    },
    {
      plan: "Pro",
      priceMonthly: 99,
      description: "Best for growing teams and businesses",
      features: [
        "1,000 Agent Runs/month",
        "20 Active Workflows",
        "4 AI Agents + Custom Agents",
        "Advanced Analytics",
        "Priority Email Support",
        "API Access + Webhooks",
        "Team Collaboration (5 users)",
        "Custom Integrations",
      ],
      excludedFeatures: ["Unlimited Runs", "Dedicated Support"],
      ctaText: "Start Free Trial",
      ctaLink: "/register?plan=pro",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      plan: "Enterprise",
      priceMonthly: 499,
      description: "For large organizations with custom needs",
      features: [
        "Unlimited Agent Runs",
        "Unlimited Workflows",
        "All AI Agents + Custom Development",
        "Custom Analytics & Reporting",
        "24/7 Dedicated Support",
        "Full API Access",
        "Unlimited Team Members",
        "Custom Integrations",
        "SLA Guarantee",
        "On-premise Deployment Option",
      ],
      excludedFeatures: [],
      ctaText: "Contact Sales",
      ctaLink: "/contact",
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: "Can I change my plan later?",
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated and applied to your next billing cycle.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes! All plans come with a 14-day free trial. No credit card required to start.",
    },
    {
      question: "What happens if I exceed my agent runs?",
      answer:
        "You'll receive a notification at 80% usage. You can either upgrade your plan or purchase additional runs at $0.01/run.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes! Save 20% when you bill annually. Contact us for enterprise custom pricing.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Absolutely. You can cancel your subscription at any time. Your account will remain active until the end of your billing period.",
    },
  ];

  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
            Choose the plan that fits your needs. All plans include a 14-day
            free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={isAnnual ? "text-gray-300" : "font-semibold text-white"}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative h-7 w-14 rounded-full bg-blue-600"
              aria-label={isAnnual ? "Switch to monthly" : "Switch to annual"}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${isAnnual ? "right-1" : "left-1"
                  }`}
              />
            </button>
            <span
              className={isAnnual ? "font-semibold text-white" : "text-gray-300"}
            >
              Annual
            </span>
            <span className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">
              Save 20%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="-mt-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                {...plan}
                price={
                  isAnnual
                    ? `$${Math.round(plan.priceMonthly * 0.8)}`
                    : `$${plan.priceMonthly}`
                }
                period={
                  isAnnual ? "/month (billed yearly)" : "/month"
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="bg-white px-4 py-20 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-4xl font-bold">
            What&apos;s Included in All Plans
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600 dark:text-gray-400">
            Every plan comes with our core features to help you automate your
            business.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 text-center">
              <div className="mb-4 text-4xl">🤖</div>
              <h3 className="mb-2 text-xl font-bold">4 AI Agents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Research, Content, Code, and Deploy agents included
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 text-4xl">🎨</div>
              <h3 className="mb-2 text-xl font-bold">Visual Builder</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag & drop workflow builder with conditional logic
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-xl font-bold">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time monitoring and performance insights
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-2 text-xl font-bold">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                SOC 2 compliant, data encryption, access controls
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-4xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="mb-12 text-center text-gray-600 dark:text-gray-400">
            Everything you need to know about pricing and billing.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-xl text-gray-300">
            Join thousands of businesses automating their workflows with AI.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-900 shadow-lg transition-all hover:scale-105 hover:bg-gray-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white hover:text-blue-900"
            >
              Contact Sales
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-100 px-4 py-12 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Trusted by innovative teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Company A</div>
            <div className="text-2xl font-bold text-gray-400">Company B</div>
            <div className="text-2xl font-bold text-gray-400">Company C</div>
            <div className="text-2xl font-bold text-gray-400">Company D</div>
            <div className="text-2xl font-bold text-gray-400">Company E</div>
          </div>
        </div>
      </section>
    </main>
  );
}
