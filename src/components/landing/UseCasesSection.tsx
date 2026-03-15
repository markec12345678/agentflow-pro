'use client';

/**
 * Use Cases Section - Tourism Specific
 * Shows how different tourism businesses use AgentFlow Pro
 */
export default function UseCasesSection() {
  const useCases = [
    {
      icon: '🏨',
      title: 'Hotels & Resorts',
      description: 'Automate guest communication, manage reservations, and optimize operations.',
      features: [
        'Auto-respond to inquiries',
        'Manage multi-property portfolios',
        'Sync with Booking.com & Airbnb',
        'Generate SEO content for website'
      ],
      metric: 'Save 20hrs/week',
      color: 'blue'
    },
    {
      icon: '🏕️',
      title: 'Camps & Glamping',
      description: 'Streamline bookings, manage pitches, and deliver exceptional guest experiences.',
      features: [
        'Pitch availability tracking',
        'Seasonal pricing automation',
        'Guest communication in 20+ languages',
        'AJPES eTurizem integration'
      ],
      metric: '30% more direct bookings',
      color: 'green'
    },
    {
      icon: '🏠',
      title: 'Vacation Rentals',
      description: 'Scale your property management business with AI automation.',
      features: [
        'Multi-calendar synchronization',
        'Automated check-in instructions',
        'Review management',
        'Dynamic pricing suggestions'
      ],
      metric: 'Manage 3x more properties',
      color: 'purple'
    },
    {
      icon: '🚌',
      title: 'Tour Operators',
      description: 'Create itineraries, manage bookings, and personalize customer experiences.',
      features: [
        'AI-powered itinerary generation',
        'Group booking management',
        'Multi-language tour descriptions',
        'Payment tracking & invoicing'
      ],
      metric: '50% faster quote generation',
      color: 'orange'
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for Tourism & Hospitality
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Unlike generic AI tools, AgentFlow Pro is purpose-built for 
            hotels, resorts, camps, and travel businesses.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.title} {...useCase} />
          ))}
        </div>

        {/* CTA for Tourism */}
        <div className="text-center mt-16">
          <a
            href="/solutions"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Explore all tourism solutions
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function UseCaseCard({ 
  icon, 
  title, 
  description, 
  features, 
  metric, 
  color 
}: {
  icon: string;
  title: string;
  description: string;
  features: string[];
  metric: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
  };

  const metricColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={`p-8 rounded-2xl border ${colorClasses[color as keyof typeof colorClasses]}`}>
      {/* Icon & Title */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-5xl">{icon}</div>
        <div>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      {/* Features List */}
      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Metric */}
      <div className={`text-lg font-bold ${metricColors[color as keyof typeof metricColors]}`}>
        {metric}
      </div>
    </div>
  );
}
