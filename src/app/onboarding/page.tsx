"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    industry: "",
    company_size: "",
    work_type: "",
    role: "",
    workspace_name: "",
    blog_url: "",
    style_guide: "",
    primary_color: "",
    secondary_color: "",
    font_family: "",
    logo_url: "",
  });
  const [audiences, setAudiences] = useState<
    { id: string; name: string; messaging: string }[]
  >([
    { id: "aud1", name: "", messaging: "" },
    { id: "aud2", name: "", messaging: "" },
    { id: "aud3", name: "", messaging: "" },
  ]);
  const [companyKnowledge, setCompanyKnowledge] = useState({
    products: "",
    competitors: "",
    key_facts: "",
  });

  const industries = [
    { id: "tourism", name: "Tourism / Hospitality", icon: "🏨" },
    { id: "travel-agency", name: "Travel Agency / DMO", icon: "✈️" },
    { id: "technology", name: "Technology / SaaS", icon: "💻" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "marketing", name: "Marketing / Agency", icon: "📢" },
    { id: "ecommerce", name: "E-commerce", icon: "🛒" },
    { id: "finance", name: "Finance", icon: "💰" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "media", name: "Media / Publishing", icon: "📰" },
    { id: "other", name: "Other", icon: "📌" },
  ];

  const companySizes = [
    { id: "solo", name: "Just Me", icon: "👤" },
    { id: "small", name: "2-200 (Small Team)", icon: "👥" },
    { id: "medium", name: "201-1000", icon: "🏢" },
    { id: "large", name: "1001+", icon: "🏛️" },
  ];

  const workTypes = [
    { id: "marketing", name: "Marketing", icon: "📣" },
    { id: "design", name: "Design", icon: "🎨" },
    { id: "content", name: "Content Writing", icon: "📝" },
    { id: "sales", name: "Sales", icon: "💼" },
    { id: "product", name: "Product", icon: "🚀" },
    { id: "other", name: "Other", icon: "📌" },
  ];

  const tourismRoles = [
    { id: "tourism-marketing", name: "Tourism Marketing Manager", icon: "✈️" },
    { id: "dmo-manager", name: "DMO Manager", icon: "🏛️" },
    { id: "hotel-marketing", name: "Hotel Marketing", icon: "🏨" },
    { id: "other", name: "Other", icon: "📌" },
  ];

  const isTourismIndustry =
    answers.industry === "tourism" || answers.industry === "travel-agency";

  const buildVisualGuidelines = () => {
    const parts: string[] = [];
    if (answers.primary_color?.trim())
      parts.push(`Primary color: ${answers.primary_color.trim()}`);
    if (answers.secondary_color?.trim())
      parts.push(`Secondary color: ${answers.secondary_color.trim()}`);
    if (answers.font_family?.trim())
      parts.push(`Font family: ${answers.font_family.trim()}`);
    if (answers.logo_url?.trim())
      parts.push(`Logo URL: ${answers.logo_url.trim()}`);
    return parts.length ? parts.join(", ") : "";
  };

  const handleFinish = async () => {
    try {
      const payload: Record<string, unknown> = { ...answers };
      const visualGuidelines = buildVisualGuidelines();
      if (visualGuidelines) payload.visual_guidelines = visualGuidelines;
      const filteredAudiences = audiences.filter(
        (a) => a.name.trim() || a.messaging.trim()
      );
      if (filteredAudiences.length > 0) {
        payload.audiences = filteredAudiences.map((a) => ({
          id: a.id,
          name: a.name.trim() || a.id,
          messaging: a.messaging.trim(),
        }));
      }
      const products = companyKnowledge.products
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const competitors = companyKnowledge.competitors
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const keyFacts = companyKnowledge.key_facts
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (products.length || competitors.length || keyFacts.length) {
        payload.company_knowledge = { products, competitors, keyFacts };
      }
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push("/pricing");
    } catch (error) {
      console.error("Error saving onboarding:", error);
      router.push("/pricing");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {step} of 8</span>
            <span>{Math.round((step / 8) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome! I&apos;m excited to work with you.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              I&apos;ll start with a few quick questions to learn more about you
              and your company. This will help me tailor your experience!
            </p>
            <h3 className="text-xl font-semibold mb-6">
              What industry does your company work in?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  type="button"
                  onClick={() => {
                    setAnswers({ ...answers, industry: industry.id });
                    setStep(2);
                  }}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                >
                  <span className="text-3xl mb-2 block">{industry.icon}</span>
                  <span className="font-semibold">{industry.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Company Size */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-6">
              What is the size of your company?
            </h3>
            <div className="space-y-4">
              {companySizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => {
                    setAnswers({ ...answers, company_size: size.id });
                    setStep(3);
                  }}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex items-center gap-4"
                >
                  <span className="text-3xl">{size.icon}</span>
                  <span className="font-semibold">{size.name}</span>
                </button>
              ))}
            </div>
            {answers.company_size === "small" && (
              <p className="mt-4 text-blue-600 font-medium">
                A small, but mighty team! 💪
              </p>
            )}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Role (tourism) or Work Type (other) */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold mb-6">
              {isTourismIndustry
                ? "What's your role in tourism?"
                : "Almost done! What kind of work do you do?"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isTourismIndustry
                ? tourismRoles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, role: r.id });
                      setStep(4);
                    }}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                  >
                    <span className="text-3xl mb-2 block">{r.icon}</span>
                    <span className="font-semibold">{r.name}</span>
                  </button>
                ))
                : workTypes.map((work) => (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, work_type: work.id });
                      setStep(4);
                    }}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                  >
                    <span className="text-3xl mb-2 block">{work.icon}</span>
                    <span className="font-semibold">{work.name}</span>
                  </button>
                ))}
            </div>
            {(isTourismIndustry ? answers.role : answers.work_type) && (
              <p className="mt-4 text-blue-600 font-medium">
                We&apos;re going to create some amazing things together. ✨
              </p>
            )}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 4: Workspace Name */}
        {step === 4 && (
          <div>
            <h3 className="text-xl font-semibold mb-6">
              What do you want to name your workspace?
            </h3>
            <input
              type="text"
              value={answers.workspace_name}
              onChange={(e) =>
                setAnswers({ ...answers, workspace_name: e.target.value })
              }
              placeholder="yourcompanyname"
              className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            />
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                disabled={!answers.workspace_name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Blog URL */}
        {step === 5 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              One more thing.
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Can you share the URL of a blog post or a high-converting web page
              from your brand? This will help me get to know your unique voice
              and tone so I can craft content that feels just right for your
              brand.
            </p>
            <input
              type="url"
              value={answers.blog_url}
              onChange={(e) =>
                setAnswers({ ...answers, blog_url: e.target.value })
              }
              placeholder="yourcompanyname.com/blog-post"
              className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            />
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Style Guide */}
        {step === 6 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Add your brand style guide (optional)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Any guidelines for tone, formatting, or terminology? We&apos;ll use
              this to keep your content consistent with your brand.
            </p>
            <textarea
              value={answers.style_guide}
              onChange={(e) =>
                setAnswers({ ...answers, style_guide: e.target.value })
              }
              placeholder="e.g. Use second person (you). Avoid jargon. Keep sentences short."
              rows={4}
              className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white resize-y"
            />
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(7)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Visual Guidelines */}
        {step === 7 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Visual guidelines (optional)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add colors, font, and logo for consistent brand visuals in your
              content.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Primary color (hex)
                </label>
                <input
                  type="text"
                  value={answers.primary_color}
                  onChange={(e) =>
                    setAnswers({ ...answers, primary_color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Secondary color (hex)
                </label>
                <input
                  type="text"
                  value={answers.secondary_color}
                  onChange={(e) =>
                    setAnswers({ ...answers, secondary_color: e.target.value })
                  }
                  placeholder="#10B981"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Font family
                </label>
                <input
                  type="text"
                  value={answers.font_family}
                  onChange={(e) =>
                    setAnswers({ ...answers, font_family: e.target.value })
                  }
                  placeholder="Inter, sans-serif"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={answers.logo_url}
                  onChange={(e) =>
                    setAnswers({ ...answers, logo_url: e.target.value })
                  }
                  placeholder="https://yoursite.com/logo.png"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(8)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Audiences */}
        {step === 8 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Target audiences (optional)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Define up to 3 target audiences. We&apos;ll tailor your content tone
              and messaging for each.
            </p>
            <div className="space-y-6">
              {audiences.map((aud, i) => (
                <div
                  key={aud.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-600 p-4"
                >
                  <p className="text-sm font-medium mb-2">
                    Audience {i + 1}
                  </p>
                  <input
                    type="text"
                    value={aud.name}
                    onChange={(e) => {
                      const next = [...audiences];
                      next[i] = { ...next[i], name: e.target.value };
                      setAudiences(next);
                    }}
                    placeholder="e.g. B2B Decision Makers"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 mb-3"
                  />
                  <textarea
                    value={aud.messaging}
                    onChange={(e) => {
                      const next = [...audiences];
                      next[i] = { ...next[i], messaging: e.target.value };
                      setAudiences(next);
                    }}
                    placeholder="Tone, pain points, value proposition..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(7)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(9)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 9: Company Knowledge */}
        {step === 9 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Company knowledge (optional)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add products, competitors, and key facts. We&apos;ll use this to
              tailor your content.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Products / Services (one per line or comma-separated)
                </label>
                <textarea
                  value={companyKnowledge.products}
                  onChange={(e) =>
                    setCompanyKnowledge({
                      ...companyKnowledge,
                      products: e.target.value,
                    })
                  }
                  placeholder="e.g. SaaS platform, API integration"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Competitors
                </label>
                <textarea
                  value={companyKnowledge.competitors}
                  onChange={(e) =>
                    setCompanyKnowledge({
                      ...companyKnowledge,
                      competitors: e.target.value,
                    })
                  }
                  placeholder="e.g. Competitor A, Competitor B"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Key facts about your company
                </label>
                <textarea
                  value={companyKnowledge.key_facts}
                  onChange={(e) =>
                    setCompanyKnowledge({
                      ...companyKnowledge,
                      key_facts: e.target.value,
                    })
                  }
                  placeholder="e.g. Founded 2020, 50+ customers"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep(8)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
              >
                Start Your Free 7-Day Trial
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No credit card required
            </p>
            <p className="mt-2 text-center text-sm">
              <Link
                href="/login"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Already have an account? Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
