import Link from "next/link";
import { SOLUTIONS, INDUSTRIES } from "@/data/solutions";

export default function SolutionsHubPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Solutions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            AgentFlow Pro tailors to your role and industry. Pick your path.
          </p>
        </div>
      </section>

      {/* Solutions by Role */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 dark:text-white">
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
                className="rounded-xl bg-gray-50 dark:bg-gray-900 p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 block"
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

      {/* Solutions by Industry */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 dark:text-white">
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
                className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 block"
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

      {/* Back to Home */}
      <section className="py-8 px-4 text-center">
        <Link
          href="/"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
