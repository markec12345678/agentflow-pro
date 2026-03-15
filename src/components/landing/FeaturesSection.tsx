'use client';

import { useState } from 'react';

/**
 * Features Section - 8 Core Features
 * Showcases the main capabilities of AgentFlow Pro
 */
export default function FeaturesSection() {
  const features = [
    {
      emoji: '🤖',
      title: 'Multi-Agent AI System',
      description: '8 specialized AI agents working together - Research, Content, Code, Deploy, Communication, and more.',
      gradient: 'from-blue-500 to-cyan-500',
      details: ['Research Agent', 'Content Agent', 'Code Agent', 'Deploy Agent']
    },
    {
      emoji: '📊',
      title: 'Visual Workflow Builder',
      description: 'Drag-and-drop interface to orchestrate AI agents. No coding required.',
      gradient: 'from-purple-500 to-pink-500',
      details: ['Drag & Drop', 'Conditional Logic', 'HITL Checkpoints', 'Version Control']
    },
    {
      emoji: '🧠',
      title: 'Knowledge Graph',
      description: 'Persistent memory across sessions. Your business context never gets lost.',
      gradient: 'from-indigo-500 to-blue-500',
      details: ['Long-term Memory', 'Context Persistence', 'Entity Mapping', 'Smart Retrieval']
    },
    {
      emoji: '🏨',
      title: 'Tourism Specialized',
      description: 'Built specifically for hotels, resorts, camps, and travel agencies.',
      gradient: 'from-orange-500 to-red-500',
      details: ['Property Management', 'Guest Communication', 'Channel Sync', 'AJPES eTurizem']
    },
    {
      emoji: '💰',
      title: 'Stripe Integration',
      description: 'Complete payment system with subscriptions, invoices, and usage tracking.',
      gradient: 'from-green-500 to-emerald-500',
      details: ['Subscriptions', 'Usage Billing', 'Invoices', 'Payment Processing']
    },
    {
      emoji: '📝',
      title: 'Multi-Language Content',
      description: 'Generate SEO-optimized content in 20+ languages automatically.',
      gradient: 'from-yellow-500 to-orange-500',
      details: ['20+ Languages', 'SEO Optimized', 'Brand Voice', 'Auto-translation']
    },
    {
      emoji: '🔌',
      title: '14+ MCP Integrations',
      description: 'Connect with GitHub, Vercel, Firecrawl, Playwright, and more.',
      gradient: 'from-pink-500 to-rose-500',
      details: ['GitHub', 'Vercel', 'Firecrawl', 'Playwright', 'Sentry']
    },
    {
      emoji: '🦀',
      title: 'Rust Performance',
      description: '10-50x faster than TypeScript for critical operations.',
      gradient: 'from-slate-600 to-gray-600',
      details: ['Pricing Engine', 'Workflow Executor', 'NAPI-RS Bindings', 'Zero-cost Abstractions']
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Automate Your Business
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            AgentFlow Pro combines cutting-edge AI with tourism expertise to deliver 
            a complete automation platform.
          </p>
        </div>

        {/* Features Grid - Bento Box Style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              emoji={feature.emoji}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              details={feature.details}
              wide={index === 1 || index === 2} // Make Workflow Builder and Knowledge Graph wider
            />
          ))}
        </div>

        {/* View All Features Link */}
        <div className="text-center mt-12">
          <a
            href="/features"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View all features
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  emoji, 
  title, 
  description, 
  gradient, 
  details,
  wide = false 
}: {
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  details: string[];
  wide?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        wide ? 'md:col-span-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0,0,0,0.1)' 
          : '0 4px 6px rgba(0,0,0,0.05)'
      }}
    >
      {/* Icon with Gradient */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl mb-4`}>
        {emoji}
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>

      {/* Feature Details */}
      <ul className="space-y-1">
        {details.map((detail) => (
          <li key={detail} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {detail}
          </li>
        ))}
      </ul>

      {/* Hover Effect Border */}
      <div 
        className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          borderColor: isHovered ? 'rgba(59, 130, 246, 0.3)' : 'transparent'
        }}
      />
    </div>
  );
}
