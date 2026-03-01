"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Communication {
  id: string;
  type: "pre-arrival" | "post-stay";
  channel?: "email" | "whatsapp";
  status: "draft" | "scheduled" | "sent" | "pending";
  content: string;
  scheduledFor: string | null;
  sentAt: string | null;
  guest: {
    name: string;
    email: string | null;
    phone?: string | null;
  } | null;
}

export default function GuestCommunicationPage() {
  const searchParams = useSearchParams();
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pre-arrival" | "post-stay">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    const prop = searchParams.get("propertyId");
    if (prop) setActivePropertyId(prop);
  }, [searchParams]);

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

  const pendingPreArrivalCount = communications.filter(
    (c) => c.type === "pre-arrival" && (c.status === "draft" || c.status === "pending")
  ).length;

  const handleBulkApprove = async () => {
    if (!activePropertyId) {
      toast.error("Izberite nastanitev");
      return;
    }
    setBulkApproving(true);
    try {
      const res = await fetch("/api/tourism/guest-communication", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-approve",
          propertyId: activePropertyId,
          type: "pre-arrival",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Odobreno: ${data.approved ?? 0} pre-arrival`);
      fetchCommunications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka");
    } finally {
      setBulkApproving(false);
    }
  };

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
          className="p-4 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">✉️</div>
          <div className="font-semibold">Nov Pre-Arrival Email</div>
          <div className="text-sm text-white/80">Navodila pred prihodom</div>
        </Link>

        <Link
          href="/dashboard/tourism/generate?prompt=post-stay-review"
          className="p-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">⭐</div>
          <div className="font-semibold">Prošnja za Oceno</div>
          <div className="text-sm text-white/80">Po odhodu gosta</div>
        </Link>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="p-4 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-opacity text-left"
        >
          <div className="text-2xl mb-2">📱</div>
          <div className="font-semibold">Pošlji sporočilo</div>
          <div className="text-sm text-white/80">Email ali WhatsApp</div>
        </button>

        <Link
          href="#faq-section"
          className="p-4 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">💬</div>
          <div className="font-semibold">FAQ Chatbot</div>
          <div className="text-sm text-white/80">Avtomatski odgovori</div>
        </Link>
      </div>

      {createModalOpen && (
        <CreateMessageModal
          propertyId={activePropertyId}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchCommunications();
          }}
        />
      )}

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
              onClick={() => setActiveTab(tab.id as "all" | "pre-arrival" | "post-stay")}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Email Kampanje</h2>
          {activeTab === "pre-arrival" && pendingPreArrivalCount > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={bulkApproving || !activePropertyId}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {bulkApproving ? "Odobravanje…" : `Odobri vse (${pendingPreArrivalCount})`}
            </button>
          )}
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
                        className={`text-xs px-2 py-0.5 rounded-full ${comm.channel === "whatsapp"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {comm.channel === "whatsapp" ? "WhatsApp" : "Email"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${comm.type === "pre-arrival"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          }`}
                      >
                        {comm.type === "pre-arrival" ? "Pre-Arrival" : "Post-Stay"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${comm.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : comm.status === "scheduled"
                            ? "bg-yellow-100 text-yellow-700"
                            : comm.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {comm.status === "sent"
                          ? "Poslano"
                          : comm.status === "scheduled"
                            ? "Načrtovano"
                            : comm.status === "pending"
                              ? "V čakanju"
                              : "Osnutek"}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {comm.guest?.name || "Neznani gost"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {comm.channel === "whatsapp" ? comm.guest?.phone : comm.guest?.email}
                    </p>
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
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

// Create Message Modal with channel selection (email / whatsapp)
function CreateMessageModal({
  propertyId,
  onClose,
  onSuccess,
}: {
  propertyId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [type, setType] = useState<"pre-arrival" | "post-stay">("pre-arrival");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!propertyId) {
      toast.error("Izberite nastanitev");
      return;
    }
    if (!guestName.trim()) {
      toast.error("Vnesite ime gosta");
      return;
    }
    if (channel === "email" && !guestEmail.trim()) {
      toast.error("Vnesite e-pošto gosta za email");
      return;
    }
    if (channel === "whatsapp" && !guestPhone.trim()) {
      toast.error("Vnesite telefonsko številko gosta za WhatsApp");
      return;
    }
    if (!content.trim()) {
      toast.error("Vnesite vsebino sporočila");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tourism/guest-communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          guest: {
            name: guestName.trim(),
            email: channel === "email" ? guestEmail.trim() : undefined,
            phone: channel === "whatsapp" ? guestPhone.trim() : undefined,
          },
          type,
          channel,
          subject: channel === "email" ? (subject.trim() || "Sporočilo od nastanitve") : undefined,
          content: content.trim(),
          status: "draft",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Sporočilo ustvarjeno");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Novo sporočilo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kanal</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${channel === "email"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                ✉️ Email
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${channel === "whatsapp"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                📱 WhatsApp
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ime gosta</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Janez Novak"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
          {channel === "email" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-pošta</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="gost@example.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+386 40 123 456"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
          )}
          <div>
            <label htmlFor="create-message-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tip</label>
            <select
              id="create-message-type"
              value={type}
              onChange={(e) => setType(e.target.value as "pre-arrival" | "post-stay")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            >
              <option value="pre-arrival">Pre-Arrival</option>
              <option value="post-stay">Post-Stay</option>
            </select>
          </div>
          {channel === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zadeva</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Pre-arrival – Nastanitev"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vsebina</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Dobrodošli! Pred prihodom..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Prekliči
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !propertyId}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Ustvarjam..." : "Ustvari"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CONFIDENCE_THRESHOLD = 0.9;

// FAQ Chatbot Demo Component
function FaqChatbotDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setConfidence(null);
    try {
      const res = await fetch("/api/tourism/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "Žal nimam odgovora.");
      setConfidence(typeof data.confidence === "number" ? data.confidence : null);
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
              setConfidence(null);
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
        <div className="space-y-2">
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <p className="text-gray-800 dark:text-gray-200">{answer}</p>
          </div>
          {confidence !== null && confidence < CONFIDENCE_THRESHOLD && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Za bolj natančen odgovor vas bo kmalu kontaktiral človek.
            </p>
          )}
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
