"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  Euro, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Clock, 
  Percent, 
  Save, 
  RefreshCcw,
  Plus,
  Trash2,
  Bot,
  Loader2,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface SeasonRate {
  from: string; // MM-DD
  to: string;   // MM-DD
  rate: number;
  label: string;
}

interface PricingRules {
  weekendFactor: number;
  minStay: number;
  earlyBird?: { days: number; discount: number };
  lastMinute?: { days: number; discount: number };
}

export default function PropertyPricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id: propertyId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [basePrice, setBasePrice] = useState<number>(0);
  const [currency, setCurrency] = useState("EUR");
  const [seasonRates, setSeasonRates] = useState<SeasonRate[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRules>({
    weekendFactor: 1,
    minStay: 1,
  });

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/properties/${propertyId}/pricing`);
      const data = await res.json();
      if (res.ok) {
        setBasePrice(data.basePrice || 0);
        setCurrency(data.currency || "EUR");
        setSeasonRates(data.seasonRates?.high || []);
        setPricingRules(data.pricingRules || { weekendFactor: 1, minStay: 1 });
      } else {
        toast.error(data.error || "Napaka pri nalaganju cenika");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPricing();
    }
  }, [status, fetchPricing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tourism/properties/${propertyId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice,
          seasonRates: { high: seasonRates },
          pricingRules,
        }),
      });
      if (res.ok) {
        toast.success("Cenik uspešno posodobljen");
      } else {
        toast.error("Napaka pri shranjevanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncEturizem = async () => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      toast.success("Sinhronizacija z eTurizmom uspešna");
      setIsSyncing(false);
    }, 1500);
  };

  const addSeason = () => {
    setSeasonRates([...seasonRates, { from: "06-01", to: "08-31", rate: basePrice * 1.5, label: "Nova sezona" }]);
  };

  const removeSeason = (index: number) => {
    setSeasonRates(seasonRates.filter((_, i) => i !== index));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/properties")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ceniki in Sezone</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Nastavitve cenovne politike in sezonskih nihanj.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSyncEturizem}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              Sync eTurizem
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Shrani vse
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Pricing Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Base Price Setting */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Euro className="w-5 h-5 text-blue-500" />
                Osnovna cena
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                  <input 
                    type="number"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xl font-black focus:ring-2 focus:ring-blue-500"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value))}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  na noč / {currency}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">
                * To je privzeta cena, ki velja, ko ni aktivnih posebnih pravil ali sezon.
              </p>
            </div>

            {/* 2. Seasonal Pricing */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Sezonske cene
                </h2>
                <button 
                  onClick={addSeason}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Dodaj sezono
                </button>
              </div>
              
              <div className="space-y-4">
                {seasonRates.map((season, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl animate-in fade-in slide-in-from-left-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Oznaka</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border-none rounded-lg text-xs"
                          value={season.label}
                          onChange={(e) => {
                            const newRates = [...seasonRates];
                            newRates[index].label = e.target.value;
                            setSeasonRates(newRates);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Od (MM-DD)</label>
                          <input 
                            type="text"
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border-none rounded-lg text-xs"
                            value={season.from}
                            onChange={(e) => {
                              const newRates = [...seasonRates];
                              newRates[index].from = e.target.value;
                              setSeasonRates(newRates);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Do (MM-DD)</label>
                          <input 
                            type="text"
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border-none rounded-lg text-xs"
                            value={season.to}
                            onChange={(e) => {
                              const newRates = [...seasonRates];
                              newRates[index].to = e.target.value;
                              setSeasonRates(newRates);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cena (€)</label>
                        <input 
                          type="number"
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border-none rounded-lg text-xs font-bold text-blue-600"
                          value={season.rate}
                          onChange={(e) => {
                            const newRates = [...seasonRates];
                            newRates[index].rate = parseFloat(e.target.value);
                            setSeasonRates(newRates);
                          }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSeason(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {seasonRates.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm italic">
                    Niste še nastavili sezonskih cen.
                  </div>
                )}
              </div>
            </div>

            {/* 3. Pricing Rules */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Napredna pravila
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        Vikend faktor
                      </span>
                      <span className="text-xs font-black text-blue-600">{((pricingRules.weekendFactor - 1) * 100).toFixed(0)}% pribitek</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="2" 
                      step="0.05"
                      className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                      value={pricingRules.weekendFactor}
                      onChange={(e) => setPricingRules({...pricingRules, weekendFactor: parseFloat(e.target.value)})}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-bold uppercase">
                      <span>Brez (1.0)</span>
                      <span>Dvojno (2.0)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Minimalno bivanje (noči)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 5, 7].map(n => (
                        <button
                          key={n}
                          onClick={() => setPricingRules({...pricingRules, minStay: n})}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            pricingRules.minStay === n 
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                              : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                      <Percent className="w-3 h-3" />
                      Pravila za popuste
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold">Early Bird</span>
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded">Aktivno</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-white dark:bg-gray-900 border-none rounded-lg text-xs"
                            placeholder="Dni"
                            value={pricingRules.earlyBird?.days || 30}
                            onChange={(e) => setPricingRules({...pricingRules, earlyBird: { ...pricingRules.earlyBird!, days: parseInt(e.target.value) }})}
                          />
                          <span className="text-[10px] text-gray-400">dni vnaprej za</span>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-white dark:bg-gray-900 border-none rounded-lg text-xs text-green-600 font-bold"
                            placeholder="%"
                            value={(pricingRules.earlyBird?.discount || 0.1) * 100}
                            onChange={(e) => setPricingRules({...pricingRules, earlyBird: { ...pricingRules.earlyBird!, discount: parseInt(e.target.value) / 100 }})}
                          />
                          <span className="text-[10px] text-gray-400">% popusta</span>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold">Last Minute</span>
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 px-1.5 py-0.5 rounded">Aktivno</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-white dark:bg-gray-900 border-none rounded-lg text-xs"
                            placeholder="Dni"
                            value={pricingRules.lastMinute?.days || 3}
                            onChange={(e) => setPricingRules({...pricingRules, lastMinute: { ...pricingRules.lastMinute!, days: parseInt(e.target.value) }})}
                          />
                          <span className="text-[10px] text-gray-400">dni pred za</span>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-white dark:bg-gray-900 border-none rounded-lg text-xs text-green-600 font-bold"
                            placeholder="%"
                            value={(pricingRules.lastMinute?.discount || 0.15) * 100}
                            onChange={(e) => setPricingRules({...pricingRules, lastMinute: { ...pricingRules.lastMinute!, discount: parseInt(e.target.value) / 100 }})}
                          />
                          <span className="text-[10px] text-gray-400">% popusta</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - AI Suggestions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
              <Bot className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold">AI Pricing Assistant</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase text-blue-200 mb-1">Optimizacija za vikend</p>
                    <p className="text-sm font-medium">Predlagam zvišanje vikend faktorja na 1.35. Povpraševanje v vaši regiji se je povečalo za 12%.</p>
                  </div>

                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase text-blue-200 mb-1">Sezonski predogled</p>
                    <p className="text-sm font-medium">Naslednja visoka sezona se začne čez 45 dni. Razmislite o predčasni Early Bird akciji.</p>
                  </div>

                  <div className="pt-4">
                    <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                      Uporabi predloge
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Status distribucije
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Booking.com</span>
                  <span className="font-bold text-green-600">Povezano</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Airbnb</span>
                  <span className="font-bold text-green-600">Povezano</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">eTurizem (AJPES)</span>
                  <span className="font-bold text-amber-600">Potrebna sinh.</span>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] text-gray-400 italic">
                    * Vsaka sprememba cen se avtomatsko posodobi na vseh povezanih kanalih v roku 5 minut.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
