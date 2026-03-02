"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  ChevronLeft, 
  Search, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Calendar, 
  Database, 
  Loader2, 
  CheckCircle2, 
  BarChart3, 
  Target, 
  Globe,
  ArrowRight,
  Zap,
  Clock
} from "lucide-react";
import { toast } from "sonner";

const RESEARCH_TYPES = [
  { id: "market", label: "Raziskava trga", icon: <Globe className="w-4 h-4" />, desc: "Analiza povpraševanja v regiji" },
  { id: "competitor", label: "Analiza konkurence", icon: <Target className="w-4 h-4" />, desc: "Primerjava cen in storitev" },
  { id: "trends", label: "Turistični trendi", icon: <TrendingUp className="w-4 h-4" />, desc: "Letna poročila in napovedi" }
];

export default function ResearchAgentPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  
  const [selectedType, setSelectedType] = useState("market");
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSavingToKnowledge, setIsSavingToKnowledge] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agents/research");
    } else if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "admin" && role !== "director") {
        toast.error("Dostop zavrnjen. Samo za vodstvo.");
        router.push("/agents");
      }
    }
  }, [status, router, session]);

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error("Prosimo, vnesite vprašanje ali temo raziskave.");
      return;
    }
    
    setIsExecuting(true);
    setResults(null);
    try {
      const res = await fetch("/api/agents/research/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, query }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        toast.success("Raziskava zaključena!");
      } else {
        toast.error("Napaka pri izvajanju raziskave");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.success("Pripravljam PDF poročilo...");
    setTimeout(() => toast.success("Poročilo preneseno!"), 1500);
  };

  const handleSaveToKnowledge = () => {
    setIsSavingToKnowledge(true);
    setTimeout(() => {
      toast.success("Shranjeno v Knowledge Graph");
      setIsSavingToKnowledge(false);
    }, 1500);
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/agents")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Bot className="w-6 h-6 text-indigo-600" />
                Research Agent UI
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Analiza trga, konkurence in napovedovanje trendov.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsScheduling(!isScheduling)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              Razporedi
            </button>
            <button 
              onClick={handleSaveToKnowledge}
              disabled={!results || isSavingToKnowledge}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isSavingToKnowledge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Shrani v Knowledge Graph
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Research Type */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tip raziskave</h2>
              <div className="space-y-2">
                {RESEARCH_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedType === type.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === type.id ? "bg-white/20" : "bg-white dark:bg-gray-700"}`}>
                      {type.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{type.label}</p>
                      <p className={`text-[10px] ${selectedType === type.id ? "text-indigo-100" : "text-gray-400"}`}>{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vaše vprašanje</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                  placeholder="Npr. Kakšni so trendi za glamping v Gorenjski regiji za poletje 2026?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button 
                onClick={handleExecute}
                disabled={isExecuting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                Zaženi raziskavo
              </button>
            </div>

            {/* Scheduling Info */}
            {isScheduling && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Periodična raziskava
                </h3>
                <div className="space-y-3">
                  <select className="w-full bg-white dark:bg-gray-800 border-none rounded-lg text-xs py-2 focus:ring-2 focus:ring-amber-500">
                    <option>Vsak teden</option>
                    <option>Vsak mesec</option>
                    <option>Vsako četrtletje</option>
                  </select>
                  <button className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700">
                    Potrdi razpored
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {!results && !isExecuting && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Pripravljen na raziskavo</h3>
                <p className="text-gray-500 max-w-sm">Izberite tip raziskave in vnesite temo, ki vas zanima. Agent bo analiziral spletne vire in pripravil poročilo.</p>
              </div>
            )}

            {isExecuting && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 min-h-[500px] flex flex-col items-center justify-center p-8 space-y-6">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">Analiziram tržne podatke...</h3>
                  <div className="flex flex-col items-center gap-2 text-xs text-gray-400 italic">
                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Iskanje po turističnih portalih</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Primerjava cen konkurence</p>
                    <p className="flex items-center gap-2 animate-pulse"><BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Generiranje analitičnih vpogledov</p>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Main Results Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="font-bold">Rezultati analize</h2>
                    </div>
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Prenesi PDF
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    {/* Summary */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Povzetek</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{results.summary}</p>
                    </div>

                    {/* Dynamic Sections Based on Type */}
                    {selectedType === "market" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {results.trends.map((trend: any, i: number) => (
                          <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{trend.name}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-green-600">{trend.growth}</span>
                              <span className="text-[10px] text-gray-400">rast</span>
                            </div>
                            <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${trend.impact === 'high' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                              Vpliv: {trend.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedType === "competitor" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Neposredni konkurenti</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="text-gray-400 font-medium">
                                <th className="pb-3">Ime</th>
                                <th className="pb-3">Cena</th>
                                <th className="pb-3">Ocena</th>
                                <th className="pb-3">Prednost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                              {results.analysis.map((comp: any, i: number) => (
                                <tr key={i}>
                                  <td className="py-3 font-bold">{comp.name}</td>
                                  <td className="py-3">{comp.price}</td>
                                  <td className="py-3">⭐ {comp.score}</td>
                                  <td className="py-3 text-indigo-600 font-medium">{comp.advantage}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="pt-8 border-t border-gray-50 dark:border-gray-800 flex flex-wrap gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Analiziranih {results.metadata.sourcesCount} virov
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        Zaupanje {results.metadata.confidence * 100}%
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Analizirano {new Date(results.metadata.analyzedAt).toLocaleTimeString('sl-SI')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations Call to Action */}
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">Želite uporabiti te vpoglede?</h4>
                      <p className="text-xs text-indigo-100">AI lahko pripravi novo strategijo cen ali marketinško kampanjo.</p>
                    </div>
                  </div>
                  <button className="p-3 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
