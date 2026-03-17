"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  ChevronLeft, 
  Star, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw, 
  Send, 
  Loader2, 
  Filter,
  ShieldCheck,
  ThumbsUp,
  BarChart3,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";

interface Review {
  id: string;
  propertyId: string;
  property: { name: string };
  guest: { name: string; email: string | null };
  rating: number;
  title: string | null;
  content: string;
  platform: string;
  status: string;
  sentiment: string | null;
  sentimentScore: number | null;
  response: string | null;
  createdAt: string;
}

export default function ReviewAgentPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setActionId] = useState<string | null>(null);
  const [responseMode, setResponseId] = useState<string | null>(null);
  const [responseContent, setResponseContent] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/agents/reviews/analyze");
      const data = await res.json();
      if (res.ok) {
        setReviews(data);
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReviews();
    }
  }, [status, fetchReviews]);

  const handleAnalyze = async (review: Review) => {
    setActionId(review.id);
    try {
      const res = await fetch("/api/v1/agents/reviews/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", content: review.content }),
      });
      const data = await res.json();
      if (res.ok) {
        setResponseId(review.id);
        setResponseContent(data.suggestedResponse);
        toast.success("AI Analiza končana!");
      }
    } catch (error) {
      toast.error("Napaka pri analizi");
    } finally {
      setActionId(null);
    }
  };

  const handleSendResponse = async (reviewId: string) => {
    setActionId(reviewId);
    try {
      const res = await fetch("/api/v1/agents/reviews/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", reviewId, responseContent }),
      });
      if (res.ok) {
        toast.success("Odgovor objavljen!");
        setResponseId(null);
        fetchReviews();
      }
    } catch (error) {
      toast.error("Napaka pri objavi");
    } finally {
      setActionId(null);
    }
  };

  if (status === "loading") return null;

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push("/agents")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-all"
              title="Back to agents"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <Bot className="w-8 h-8 text-amber-500" />
                Review Agent UI
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Upravljanje ugleda in AI analitika mnenj gostov.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-black">{averageRating} / 5.0</span>
              <span className="text-xs text-gray-400 font-bold uppercase">Povprečje</span>
            </div>
            <button 
              onClick={fetchReviews}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-all"
              title="Refresh reviews"
            >
              <RefreshCcw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Stats & Analytics Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analitika ugleda
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold">Sentiment Score</span>
                    <span className="text-xl font-black text-green-600">88%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[88%]"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Čistoča</p>
                    <p className="text-lg font-black text-blue-600">4.9</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Osebje</p>
                    <p className="text-lg font-black text-blue-600">4.8</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lokacija</p>
                    <p className="text-lg font-black text-blue-600">5.0</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vrednost</p>
                    <p className="text-lg font-black text-blue-600">4.5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl shadow-xl shadow-amber-500/20 text-white relative overflow-hidden">
              <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
              <div className="relative">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Reputation Guard
                </h3>
                <p className="text-xs text-amber-50 text-pretty leading-relaxed mb-4">
                  Zaznali smo 2 negativni mnenji na Google Maps v zadnjih 24 urah. Priporočamo takojšen odziv za ohranitev ocene 4.9.
                </p>
                <button className="w-full py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">
                  Poglej kritična mnenja
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Zadnja mnenja ({reviews.length})
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-medium text-gray-500">
                  <Filter className="w-3.5 h-3.5" />
                  Vse platforme
                </button>
              </div>
            </div>

            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 animate-pulse"></div>
              ))
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xl">
                        {review.guest.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{review.guest.name}</h3>
                          <span className="text-[10px] font-bold uppercase text-gray-400">• {review.platform}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                          ))}
                          <span className="text-xs font-black ml-2">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: sl })}
                    </span>
                  </div>

                  <div className="p-6">
                    {review.title && <h4 className="font-bold text-sm mb-2">{review.title}</h4>}
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">&quot;{review.content}&quot;</p>
                    
                    {/* Response Area */}
                    {review.response ? (
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-bold uppercase text-green-600">Vaš odgovor</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">&quot;{review.response}&quot;</p>
                      </div>
                    ) : responseMode === review.id ? (
                      <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <textarea 
                          className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                          value={responseContent}
                          onChange={(e) => setResponseContent(e.target.value)}
                          placeholder="Enter your response..."
                          title="Response to review"
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setResponseId(null)}
                            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                          >
                            Prekliči
                          </button>
                          <button 
                            onClick={() => handleSendResponse(review.id)}
                            disabled={analyzingId === review.id}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                          >
                            {analyzingId === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Objavi odgovor
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg text-[10px] font-bold uppercase">
                            <ThumbsUp className="w-3 h-3" /> 92% Positive
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAnalyze(review)}
                          disabled={analyzingId === review.id}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all"
                        >
                          {analyzingId === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                          AI Odgovor
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 py-20 text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-lg">Ni najdenih mnenj</h3>
                <p className="text-gray-500 mt-1">Ko boste prejeli mnenja, se bodo prikazala tukaj.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
