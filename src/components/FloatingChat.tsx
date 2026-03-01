"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Hitre akcije (predlogi) ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Opis sobe",       template: "booking-description",  icon: "📋" },
  { label: "Email za goste",  template: "guest-welcome-email",  icon: "📧" },
  { label: "Instagram post",  template: "instagram-travel",     icon: "📱" },
  { label: "Blog post",       template: "destination-guide",    icon: "📍" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
  link?: { label: string; href: string };
}

// ─── Preprost NLP parser ──────────────────────────────────────────────────────
function parseIntent(text: string): { template?: string; redirect?: string } | null {
  const t = text.toLowerCase();
  if (t.match(/opis|soba|nastanitev|booking|airbnb/))
    return { template: "booking-description" };
  if (t.match(/email|gost|dobrodošlic|welcome/))
    return { template: "guest-welcome-email" };
  if (t.match(/instagram|social|facebook|caption/))
    return { template: "instagram-travel" };
  if (t.match(/blog|vodič|destinacij|guide/))
    return { template: "destination-guide" };
  if (t.match(/landing|stran|rezervacij/))
    return { template: "landing-page" };
  if (t.match(/kampanj|sezon/))
    return { template: "seasonal-campaign" };
  if (t.match(/workflow|avtomat/))
    return { redirect: "/workflows" };
  if (t.match(/vsebina|content|moja/))
    return { redirect: "/content" };
  return null;
}

function getAssistantReply(userText: string): Message {
  const intent = parseIntent(userText);

  if (intent?.template) {
    const labels: Record<string, string> = {
      "booking-description":  "Opis nastanitve",
      "guest-welcome-email":  "Email za goste",
      "instagram-travel":     "Social media post",
      "destination-guide":    "Blog / vodič",
      "landing-page":         "Landing stran",
      "seasonal-campaign":    "Sezonska kampanja",
    };
    const label = labels[intent.template] ?? "Vsebina";
    return {
      role: "assistant",
      text: `Super! Ustvarimo "${label}" za vas. Kliknite spodaj:`,
      link: {
        label: `✍️ Ustvari: ${label}`,
        href: `/generate?template=${intent.template}`,
      },
    };
  }

  if (intent?.redirect) {
    return {
      role: "assistant",
      text: "Seveda! Tukaj najdete kar iščete:",
      link: { label: "Odpri →", href: intent.redirect },
    };
  }

  return {
    role: "assistant",
    text: "Razumem! Kaj točno bi radi naredili? Izberite eno od možnosti spodaj ali mi opišite:",
  };
}

// ─── Glavna komponenta ────────────────────────────────────────────────────────
export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Pozdravljeni! 👋 Sem vaš AI asistent. Kako vam lahko pomagam danes?\n\nRecite mi npr. \"Potrebujem opis sobe\" ali \"Napiši email za goste\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", text };
    const reply = getAssistantReply(text);

    setMessages(prev => [...prev, userMsg, reply]);
    setInput("");

    if (!open) setUnread(prev => prev + 1);
  };

  const handleQuickAction = (template: string, label: string) => {
    const userMsg: Message = { role: "user", text: `Ustvari: ${label}` };
    const reply: Message = {
      role: "assistant",
      text: `Odlično! Vodim vas na ${label}:`,
      link: {
        label: `✍️ ${label}`,
        href: `/generate?template=${template}`,
      },
    };
    setMessages(prev => [...prev, userMsg, reply]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-20 right-5 md:bottom-6 md:right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
        aria-label="AI asistent"
      >
        {open ? "✕" : "🤖"}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ maxHeight: "75vh" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-blue-600 text-white">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-bold text-sm">AI Asistent</p>
              <p className="text-xs text-blue-200">Vedno pripravljen pomagati</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto text-blue-200 hover:text-white text-xl leading-none"
              aria-label="Zapri"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.link && (
                    <Link
                      href={msg.link.href}
                      onClick={() => setOpen(false)}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      {msg.link.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.template}
                  type="button"
                  onClick={() => handleQuickAction(qa.template, qa.label)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <span>{qa.icon}</span>
                  {qa.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Kaj bi radi naredili?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-all"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
