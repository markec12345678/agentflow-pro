"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Communication {
  id: string;
  type: "pre-arrival" | "post-stay";
  status: "draft" | "scheduled" | "sent";
  content: string;
  scheduledFor: string | null;
  sentAt: string | null;
  guest: {
    name: string;
    email: string;
  } | null;
}

export default function GuestCommunicationPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pre-arrival" | "post-stay">("all");

  useEffect(() => {
    if (activePropertyId) {
      fetchCommunications();
    }
  }, [activePropertyId, activeTab]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tourism/guest-communication?propertyId=${activePropertyId}&type=${activeTab}`
      );
      const data = await res.json();
      setCommunications(data.communications || []);
    } catch (error) {
      toast.error("Napaka pri nalaganju komunikacij");
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunications = communications.filter((c) =>
    activeTab === "all" ? true : c.type === activeTab
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Komunikacija z Gosti
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Pre-arrival emaili, prošnje za ocene, FAQ chatbot
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/tourism/generate?prompt=pre-arrival-email"
          className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">✉️</div>
          <div className="font-semibold">Nov Pre-Arrival Email</div>
          <div className="text-sm text-white/80">Navodila pred prihodom</div>
        </Link>

        <Link
          href="/dashboard/tourism/generate?prompt=post-stay-review"
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">⭐</div>
          <div className="font-semibold">Prošnja za Oceno</div>
          <div className="text-sm text-white/80">Po odhodu gosta</div>
        </Link>

        <Link
          href="#faq-section"
          className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">💬</div>
          <div className="font-semibold">FAQ Chatbot</div>
          <div className="text-sm text-white/80">Avtomatski odgovori</div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {[
            { id: "all", label: "Vse", count: communications.length },
            { id: "pre-arrival", label: "Pre-Arrival", count: communications.filter((c) => c.type === "pre-arrival").length },
            { id: "post-stay", label: "Post-Stay", count: communications.filter((c) => c.type === "post-stay").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as string)}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Communications List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold">Email Kampanje</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Nalaganje...</div>
        ) : filteredCommunications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Ni najdenih komunikacij. Ustvarite novo z gumboma zgoraj.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCommunications.map((comm) => (
              <div
                key={comm.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          comm.type === "pre-arrival"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        }`}
                      >
                        {comm.type === "pre-arrival" ? "Pre-Arrival" : "Post-Stay"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          comm.status === "sent"
                            ? "bg-green-100 text-green-700"
                            : comm.status === "scheduled"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {comm.status === "sent"
                          ? "Poslano"
                          : comm.status === "scheduled"
                          ? "Načrtovano"
                          : "Osnutek"}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {comm.guest?.name || "Neznani gost"}
                    </p>
                    <p className="text-sm text-gray-500">{comm.guest?.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {comm.content.slice(0, 100)}...
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {comm.scheduledFor && (
                      <div>Načrtovano: {new Date(comm.scheduledFor).toLocaleDateString("sl-SI")}</div>
                    )}
                    {comm.sentAt && (
                      <div>Poslano: {new Date(comm.sentAt).toLocaleDateString("sl-SI")}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Chatbot Section */}
      <div id="faq-section" className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <h2 className="font-semibold flex items-center gap-2">
            <span>💬</span> FAQ Chatbot za Goste
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avtomatski odgovori na pogosta vprašanja gostov
          </p>
        </div>
        <FaqChatbotDemo />
      </div>
    </div>
  );
}

// FAQ Chatbot Demo Component
function FaqChatbotDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tourism/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch {
      setAnswer("Žal je prišlo do napake. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Kako pridem do nastanitve?",
    "Kdaj je check-in?",
    "Ali je WiFi na voljo?",
    "Ali sprejemate hišne ljubljenčke?",
    "Kaj je v bližini za početi?",
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Sample Questions */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q);
              setAnswer(null);
            }}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          placeholder="Vprašanje gosta..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
        <button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
        >
          {loading ? "..." : "Vprašaj"}
        </button>
      </div>

      {/* Answer */}
      {answer && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-gray-800 dark:text-gray-200">{answer}</p>
        </div>
      )}

      {/* FAQ Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        {["prihod", "čas", "storitve", "pravila", "aktivnosti", "oprema", "rezervacije"].map((cat) => (
          <Link
            key={cat}
            href={`/api/tourism/faq?category=${cat}`}
            className="text-sm text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors capitalize"
          >
            {cat}
          </Link>
        ))}
      </div>
    </div>
  );
}
