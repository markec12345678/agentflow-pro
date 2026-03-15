// =============================================================================
// AgentFlow Pro - Complete Landing Page (2026)
// Conversion-optimized with all sections
// =============================================================================

import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      {/* Hero Section - Above the fold */}
      <HeroSection />
      
      {/* Social Proof - Logos */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
            Trusted by 500+ innovative hospitality teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Replace with real customer logos */}
            {['Grand Hotel Bernardin', 'Hotel Lev', 'Camp Šobec', 'Turizem Bled', 'Adria Kombi'].map((company) => (
              <div key={company} className="text-xl font-bold text-gray-400">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Core capabilities */}
      <FeaturesSection />

      {/* Use Cases Section - Tourism-specific */}
      <UseCasesSection />

      {/* How It Works - Simple 3-step process */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in minutes, not months
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                emoji: '🏨',
                title: 'Connect Your Property',
                description: 'Add your hotel, resort, or camp in minutes. Import existing data from Booking.com, Airbnb, or your PMS.'
              },
              {
                step: '2',
                emoji: '🤖',
                title: 'Build AI Workflows',
                description: 'Use our visual builder to create automated workflows for guest communication, content creation, and operations.'
              },
              {
                step: '3',
                emoji: '🚀',
                title: 'Scale Your Business',
                description: 'Watch your efficiency soar while AI agents handle repetitive tasks. Focus on what matters most - your guests.'
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                  <div className="text-6xl mb-4">{item.emoji}</div>
                  <div className="text-5xl font-bold text-blue-600 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
                {item.step !== '3' && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Social proof */}
      <TestimonialsSection />

      {/* Stats Section - Quantifiable benefits */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '10x', label: 'Faster Operations' },
              { value: '80%', label: 'Cost Reduction' },
              { value: '24/7', label: 'Guest Support' },
              { value: '99.9%', label: 'Uptime SLA' }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Clear tiers */}
      <PricingSection />

      {/* FAQ Section - Address objections */}
      <FAQSection />

      {/* Final CTA - Last push */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
