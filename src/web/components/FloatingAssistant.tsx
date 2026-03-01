"use client";

import { useState, useRef, useEffect } from "react";

// ─── Hitre akcije ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "📋 Opis sobe", href: "/generate?template=booking-description" },
  { label: "📧 Email za goste", href: "/generate?template=guest-welcome-email" },
  { label: "📱 Instagram post", href: "/generate?template=instagram-travel" },
  { label: "🌐 Landing stran", href: "/generate?template=landing-page" },
  { label: "📍 Vodič destinacije", href: "/generate?template=destination-guide" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Živjo! 👋 Sem vaš AI pomočnik. Povejte mi kaj potrebujete, ali izberite hitro akcijo spodaj:",
};

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scrolla na dno ob novih sporočilih
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus na input ob odprtju
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Contextual intent detection – lokalno, brez API klica
      const lower = text.toLowerCase();
      let assistantText = "";

      if (lower.includes("opis") || lower.includes("soba") || lower.includes("booking") || lower.includes("apartma")) {
        assistantText = "Odlično! Ustvarimo opis nastanitve za Booking.com ali Airbnb. Kliknite spodaj:";
      } else if (lower.includes("email") || lower.includes("gost") || lower.includes("dobrodošl")) {
        assistantText = "Super! Email za goste je odlična ideja. Tukaj je hiter dostop:";
      } else if (lower.includes("instagram") || lower.includes("social") || lower.includes("objava") || lower.includes("facebook")) {
        assistantText = "Perfektno! Ustvarimo social media objavo z hashtagi:";
      } else if (lower.includes("landing") || lower.includes("spletna stran") || lower.includes("rezervacij")) {
        assistantText = "Odličen izbor! Landing stran poveča direktne rezervacije. Začnimo:";
      } else if (lower.includes("blog") || lower.includes("vodič") || lower.includes("destinacij")) {
        assistantText = "Blog post in vodiči so odlični za SEO! Nadaljujemo:";
      } else if (lower.includes("pomoč") || lower.includes("help") || lower.includes("kaj") || lower.includes("kako")) {
        assistantText = "Z veseljem pomagam! AgentFlow Pro ustvarja vsebino za turistične nastanitve. Kaj bi radi naredili? Izberite eno od možnosti spodaj ali mi opišite kaj potrebujete.";
      } else {
        // Pošlji na API
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.text })),
            system: "Ti si AI pomočnik za AgentFlow Pro - platformo za ustvarjanje turistične vsebine. Odgovarjaj kratko in prijazno v slovenščini. Predlagaj konkretne akcije. Max 2 stavka.",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          assistantText = data.message ?? data.content ?? "Kako vam lahko pomagam?";
        } else {
          assistantText = "Razumem! Izberite eno od hitrih akcij spodaj ali obiščite /generate za vse možnosti.";
        }
      }

      setMessages(prev => [...prev, { role: "assistant", text: assistantText }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Izberite eno od hitrih akcij spodaj. 👇"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <>
      {/* ─── Floating Button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Zapri pomočnika" : "Odpri AI pomočnika"}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${open
            ? "bg-gray-700 hover:bg-gray-600 rotate-45"
            : "bg-linear-to-br from-blue-600 to-cyan-500 hover:scale-110 animate-pulse-slow"
          }`}
        style={{ animationDuration: "3s" }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* ─── Chat Window ─────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-blue-600 to-cyan-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-sm font-bold text-white">AI Pomočnik</p>
                <p className="text-xs text-blue-100">AgentFlow Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-blue-100 hover:text-white transition-colors px-2 py-1 rounded-sm"
                title="Začni znova"
              >
                ↺
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-400 mb-2 font-medium">⚡ Hitro:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(action => (
                <a
                  key={action.href}
                  href={action.href}
                  className="text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors font-medium border border-blue-200 dark:border-blue-700"
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Vprašajte me karkoli..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:border-blue-500 disabled:opacity-60 transition-colors"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
