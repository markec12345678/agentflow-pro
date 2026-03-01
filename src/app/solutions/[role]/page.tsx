import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolutionById } from "@/data/solutions";

export default async function SolutionRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const solution = getSolutionById(role);

  if (!solution) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <section className="relative py-20 px-4 bg-linear-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6">
            {solution.headline}
          </h1>
          <p className="text-xl text-gray-300 mb-8">{solution.description}</p>
          <Link
            href="/onboarding"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all"
          >
            {solution.ctaText}
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">
            Built for {solution.name}s
          </h2>
          <ul className="space-y-4">
            {solution.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
              >
                <span className="text-green-600 dark:text-green-400 mt-0.5">
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 px-4 text-center">
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
