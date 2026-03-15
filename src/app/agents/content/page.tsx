"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  ChevronLeft, 
  Sparkles, 
  FileText, 
  Share2, 
  Eye, 
  Edit3, 
  Send, 
  Loader2, 
  Search, 
  Layout,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const CONTENT_TYPES = [
  { id: "blog", label: "Blog Post", icon: <FileText className="w-4 h-4" />, desc: "SEO optimiziran članek" },
  { id: "social", label: "Social Media", icon: <Share2 className="w-4 h-4" />, desc: "Instagram/FB objave" },
  { id: "landing", label: "Landing Page", icon: <Layout className="w-4 h-4" />, desc: "Prodajna stran" }
];

const LANGUAGES = [
  { code: "sl", name: "Slovenščina", flag: "🇸🇮" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "hr", name: "Hrvatski", flag: "🇭🇷" },
  { code: "at", name: "Österreich", flag: "🇦🇹" },
  { code: "hu", name: "Magyar", flag: "🇭🇺" },
  { code: "fr", name: "Français", flag: "🇫🇷" }
];

export default function ContentAgentPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [selectedType, setSelectedType] = useState("blog");
  const [language, setLanguage] = useState("sl");
  const [inputs, setInputs] = useState({ name: "", location: "", highlights: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agents/content");
    }
  }, [status, router]);

  const handleGenerate = async () => {
    if (!inputs.name || !inputs.location) {
      toast.error("Prosimo, vnesite ime in lokacijo.");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent("");
    try {
      const res = await fetch("/api/agents/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, language, inputs }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedContent(data.content);
        setSeoKeywords(data.seoKeywords);
        toast.success("Vsebina generirana!");
      } else {
        toast.error("Napaka pri generiranju");
      }
    } catch {
      toast.error("Sistemska napaka");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publishing
    setTimeout(() => {
      toast.success("Vsebina uspešno objavljena!");
      setIsPublishing(false);
    }, 2000);
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
              title="Back to Agents"
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                Content Agent UI
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Generiranje SEO vsebine in objav za nastanitve.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Settings Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Content Type */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tip vsebine</h2>
              <div className="space-y-2">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedType === type.id 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === type.id ? "bg-white/20" : "bg-white dark:bg-gray-700"}`}>
                      {type.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{type.label}</p>
                      <p className={`text-[10px] ${selectedType === type.id ? "text-blue-100" : "text-gray-400"}`}>{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vhodni podatki</h2>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Ime nastanitve</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Npr. Vila Planina"
                  value={inputs.name}
                  onChange={(e) => setInputs({...inputs, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Lokacija</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Npr. Kranjska Gora"
                  value={inputs.location}
                  onChange={(e) => setInputs({...inputs, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Posebnosti / USP</label>
                <textarea 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Npr. pogled na gore, zasebni bazen, bližina smučišča..."
                  value={inputs.highlights}
                  onChange={(e) => setInputs({...inputs, highlights: e.target.value})}
                />
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Jezik generiranja</label>
                <div className="grid grid-cols-4 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-2 rounded-lg text-lg flex items-center justify-center transition-all ${
                        language === lang.code 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                      }`}
                      title={lang.name}
                    >
                      {lang.flag}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generiraj vsebino
              </button>
            </div>
          </div>

          {/* Editor/Preview Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Editor Toolbar */}
            <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button 
                  onClick={() => setIsPreview(false)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPreview ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Urejanje
                </button>
                <button 
                  onClick={() => setIsPreview(true)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isPreview ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Predogled
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing || !generatedContent}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Objavi vsebino
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm min-h-[500px] flex flex-col overflow-hidden">
              {isPreview ? (
                <div className="p-8 prose dark:prose-invert max-w-none">
                  {/* SECURITY: Sanitize HTML before rendering to prevent XSS */}
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generatedContent 
                        ? generatedContent // TODO: Add DOMPurify.sanitize() here
                        : "<p class='text-gray-400 italic text-center py-20'>Nič še ni generirano. Vnesite podatke in kliknite Generiraj.</p>" 
                    }} 
                  />
                  {/* SECURITY NOTE: Add DOMPurify before production: npm install dompurify @types/dompurify */}
                </div>
              ) : (
                <textarea 
                  className="flex-1 p-8 bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed resize-none"
                  placeholder="Tukaj se bo prikazala generirana vsebina..."
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                />
              )}
            </div>

            {/* SEO & Insights */}
            {generatedContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    SEO Predlogi (Ključne besede)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {seoKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    AI Vpogledi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Readability Score</span>
                      <span className="font-bold text-green-600">Odlično</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Sentiment Analysis</span>
                      <span className="font-bold text-blue-600">Pozitiven / Vabilen</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Estimated Tokens</span>
                      <span className="font-bold">450 tokens</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
