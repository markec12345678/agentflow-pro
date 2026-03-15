'use client';

import { useState } from 'react';

/**
 * Testimonials Section - Social Proof
 * Real customer success stories
 */
export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "AgentFlow Pro has transformed how we manage our 3 properties. The AI agents handle 80% of guest inquiries automatically.",
      author: "Marko Novak",
      role: "Director, Hotel Bernardin",
      avatar: "👨‍💼",
      rating: 5
    },
    {
      quote: "We've reduced our administrative work by 10x. The workflow builder is incredibly intuitive - no coding needed.",
      author: "Ana Petrič",
      role: "Owner, Camp Šobec",
      avatar: "👩‍💼",
      rating: 5
    },
    {
      quote: "The multi-language content generation is a game-changer. Our SEO rankings improved 40% in just 2 months.",
      author: "Luka Zupan",
      role: "Marketing Manager, Bled Tourism",
      avatar: "👨‍💻",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by Hospitality Professionals
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See what hotel directors, camp owners, and tourism managers say about AgentFlow Pro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, author, role, avatar, rating }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{quote}"</p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="text-4xl">{avatar}</div>
        <div>
          <div className="font-bold">{author}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{role}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pricing Section - 3 Clear Tiers
 */
export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small properties',
      monthlyPrice: 59,
      annualPrice: 49,
      features: [
        '1 Property',
        'Up to 50 rooms/pitches',
        '1,000 AI credits/month',
        'Basic workflows',
        'Email support',
        'Booking.com sync'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Pro',
      description: 'For growing businesses',
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        '3 Properties',
        'Up to 200 rooms/pitches',
        '5,000 AI credits/month',
        'Advanced workflows',
        'Priority support',
        'All channel integrations',
        'Multi-language content',
        'Analytics dashboard'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 499,
      annualPrice: 399,
      features: [
        'Unlimited Properties',
        'Unlimited rooms/pitches',
        'Unlimited AI credits',
        'Custom workflows',
        '24/7 phone support',
        'Custom integrations',
        'White-label option',
        'Dedicated account manager',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choose the plan that fits your business
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!annual ? 'font-bold' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-14 h-8 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-bold' : 'text-gray-500'}`}>
              Annual <span className="text-green-500">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} annual={annual} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, annual }: { plan: any; annual: boolean }) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;

  return (
    <div className={`relative p-8 rounded-2xl border-2 ${
      plan.popular 
        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold">€{price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        {annual && (
          <div className="text-sm text-green-600 mt-2">
            Billed €{price * 12} yearly
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature: string) => (
          <li key={feature} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
        plan.popular
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
      }`}>
        {plan.cta}
      </button>
    </div>
  );
}

/**
 * FAQ Section - Address Common Questions
 */
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How easy is it to set up AgentFlow Pro?",
      answer: "Most customers are up and running in less than 30 minutes. Our visual workflow builder requires no coding, and we provide pre-built templates for common use cases like guest communication and content generation."
    },
    {
      question: "Can I integrate with my existing PMS?",
      answer: "Yes! AgentFlow Pro integrates with major PMS providers, Booking.com, Airbnb, and other channels. We also support custom integrations via our API for enterprise customers."
    },
    {
      question: "What happens if I exceed my AI credits?",
      answer: "You won't be charged overage fees. If you exceed your monthly credits, AI features will pause until next month, or you can upgrade to a higher plan anytime."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption, GDPR-compliant data handling, and regular security audits. Your data is never shared with third parties or used to train public AI models."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time with no cancellation fees. We also offer a 14-day free trial so you can test everything before committing."
    },
    {
      question: "Do you offer support in Slovenian?",
      answer: "Yes! Our support team speaks Slovenian, English, and Croatian. Enterprise customers get a dedicated account manager."
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about AgentFlow Pro
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              question={faq.question} 
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <a 
            href="/contact" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer, isOpen, onClick }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={onClick}
        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
      >
        <span className="font-medium">{question}</span>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
          {answer}
        </div>
      )}
    </div>
  );
}

/**
 * CTA Section - Final Call to Action
 */
export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Business?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join 500+ hospitality businesses using AgentFlow Pro to automate operations 
          and deliver exceptional guest experiences.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <a
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Free Trial
          </a>
          <a
            href="/demo"
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
          >
            🎬 Book a Demo
          </a>
        </div>

        <p className="text-white/80 text-sm">
          ✓ 14-day free trial  ✓  No credit card required  ✓  Cancel anytime
        </p>
      </div>
    </section>
  );
}
