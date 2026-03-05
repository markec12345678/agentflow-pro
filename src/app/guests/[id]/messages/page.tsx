"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  Send, 
  Mail, 
  MessageSquare, 
  Clock, 
  Globe, 
  FileText, 
  History, 
  CheckCircle2, 
  Eye, 
  MousePointer2,
  Loader2,
  Bot
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface Communication {
  id: string;
  type: string;
  channel: string;
  subject: string | null;
  content: string;
  status: string;
  language: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
}

const TEMPLATES: Template[] = [
  { 
    id: "welcome", 
    name: "Dobrodošlica", 
    subject: "Dobrodošli v naši nastanitvi!", 
    content: "Pozdravljeni {{ime_gosta}},\n\nZelo se veselimo vašega obiska pri nas. Vaša rezervacija je potrjena za {{datum_prihoda}}.\n\nLep pozdrav,\nEkipa {{lokacija}}",
    type: "pre-arrival"
  },
  { 
    id: "checkin_info", 
    name: "Check-in Navodila", 
    subject: "Pomembna navodila za vaš prihod", 
    content: "Pozdravljeni {{ime_gosta}},\n\nCheck-in je možen od 14:00 naprej. Ključe boste našli v sefu na kodi {{koda_sefa}}.\n\nSe vidimo kmalu!",
    type: "pre-arrival"
  },
  { 
    id: "thank_you", 
    name: "Zahvala po odhodu", 
    subject: "Hvala za vaš obisk!", 
    content: "Pozdravljeni {{ime_gosta}},\n\nHvala, ker ste bivali pri nas. Upamo, da ste uživali. Bili bi veseli vaše ocene.\n\nSrečno pot!",
    type: "post-stay"
  }
];

const LANGUAGES = [
  { code: "sl", name: "Slovenščina" },
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "hr", name: "Hrvatski" },
  { code: "fr", name: "Français" }
];

export default function GuestMessagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id: guestId } = useParams() || {};
  
  const [guest, setGuest] = useState<any>(null);
  const [history, setHistory] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Message state
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("sl");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch guest info
      const guestRes = await fetch(`/api/tourism/guests/${guestId}`);
      const guestData = await guestRes.json();
      if (guestRes.ok) {
        setGuest(guestData);
      }

      // Fetch message history
      const commRes = await fetch(`/api/tourism/guest-communication?guestId=${guestId}`);
      const commData = await commRes.json();
      if (commRes.ok) {
        setHistory(commData.communications || []);
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  const handleApplyTemplate = (id: string) => {
    const tpl = TEMPLATES.find(t => t.id === id);
    if (tpl) {
      setSubject(tpl.subject);
      setContent(tpl.content);
      setSelectedTemplate(id);
    }
  };

  const handleSendMessage = async () => {
    if (!content.trim()) return;
    
    setIsSending(true);
    try {
      const res = await fetch("/api/tourism/guest-communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: guest.propertyId,
          guestId: guest.id,
          type: "inquiry",
          channel,
          subject: channel === "email" ? subject : undefined,
          content,
          language,
          scheduledAt: scheduledAt || undefined,
          templateId: selectedTemplate || undefined,
          variables: {
            ime_gosta: guest.name,
            lokacija: guest.property?.name || "naša nastanitev",
            datum_prihoda: guest.reservations[0]?.checkIn ? format(parseISO(guest.reservations[0].checkIn), "d. M. yyyy") : "kmalu"
          }
        }),
      });
      
      if (res.ok) {
        toast.success(scheduledAt ? "Sporočilo razporejeno" : "Sporočilo poslano");
        setSubject("");
        setContent("");
        setScheduledAt("");
        setSelectedTemplate("");
        fetchData();
      } else {
        toast.error("Napaka pri pošiljanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSending(false);
    }
  };

  if (loading || !guest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/guests/${guestId}`)}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
              title="Nazaj na gostovne sporočile"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Komunikacija z Gosti</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                Pošiljanje sporočil gostu: <span className="font-bold text-gray-700 dark:text-gray-200">{guest.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Composer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Channel & Template Selector */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button 
                    onClick={() => setChannel("email")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${channel === "email" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button 
                    onClick={() => setChannel("sms")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${channel === "sms" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                </div>

                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={selectedTemplate}
                      onChange={(e) => handleApplyTemplate(e.target.value)}
                      title="Izberite predlogo sporočila"
                    >
                      <option value="">Izberi predlogo...</option>
                      {TEMPLATES.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Composer */}
              <div className="space-y-4">
                {channel === "email" && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Zadeva</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Npr. Dobrodošli v naši nastanitvi..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Vsebina sporočila</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[250px] font-mono"
                    placeholder="Vpišite sporočilo..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-400 italic">
                    <span>Spremenljivke: {"{{ime_gosta}}"}, {"{{datum_prihoda}}"}, {"{{lokacija}}"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Jezik sporočila
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        language === lang.code 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Urnik pošiljanja
                </h2>
                <input 
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  title="Čas pošiljanja sporočila"
                  placeholder="Izberite čas pošiljanja"
                />
                <p className="text-[10px] text-gray-400 mt-2">Če pustite prazno, bo sporočilo poslano takoj.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSendMessage}
                disabled={isSending || !content.trim()}
                className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                title="Pošlji sporočilo"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {scheduledAt ? "Razporedi pošiljanje" : "Pošlji sporočilo zdaj"}
              </button>
            </div>
          </div>

          {/* Right Column - History & Tracking */}
          <div className="space-y-6">
            
            {/* 1. History */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Zgodovina
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((comm) => (
                  <div key={comm.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {comm.channel === "email" ? <Mail className="w-3.5 h-3.5 text-blue-500" /> : <MessageSquare className="w-3.5 h-3.5 text-green-500" />}
                        <span className="font-bold uppercase tracking-wider text-[10px]">{comm.channel}</span>
                      </div>
                      <span className="text-gray-400">{format(parseISO(comm.createdAt), "d. M. HH:mm")}</span>
                    </div>
                    
                    <div>
                      {comm.subject && <p className="font-bold mb-1">{comm.subject}</p>}
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{comm.content}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        {comm.openedAt && (
                          <div className="flex items-center gap-1 text-blue-600 font-bold" title={`Odprto: ${format(parseISO(comm.openedAt), "d. M. HH:mm")}`}>
                            <Eye className="w-3 h-3" />
                            <span>1</span>
                          </div>
                        )}
                        {comm.clickedAt && (
                          <div className="flex items-center gap-1 text-indigo-600 font-bold" title={`Kliknjeno: ${format(parseISO(comm.clickedAt), "d. M. HH:mm")}`}>
                            <MousePointer2 className="w-3 h-3" />
                            <span>1</span>
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        comm.status === "sent" ? "bg-green-100 text-green-700" : 
                        comm.status === "scheduled" ? "bg-amber-100 text-amber-700" : 
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {comm.status === "sent" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {comm.status}
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center py-12 text-gray-400 text-sm italic">Ni preteklih sporočil.</p>
                )}
              </div>
            </div>

            {/* 2. Automated AI Assistant */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
              <Bot className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold">AI Comm Assistant</h2>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed mb-4">
                  Gost je iz Nemčije. Predlagam, da sporočilo pošljete v nemščini. Ali želite, da vsebino samodejno prevedem?
                </p>
                <button className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all">
                  Prevedi v nemščino
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
