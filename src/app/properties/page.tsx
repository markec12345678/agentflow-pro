"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Euro, 
  RefreshCcw, 
  Edit, 
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";

interface PropertySummary {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  status: "active" | "inactive";
  occupancyRate: number;
  monthlyRevenue: number;
  eturizemStatus: "synced" | "pending" | "error";
  basePrice: number | null;
  currency: string;
}

export default function PropertiesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tourism/properties/summary");
      const data = await res.json();
      if (res.ok) {
        setProperties(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.error || "Napaka pri nalaganju nastanitev");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/properties");
    } else if (status === "authenticated") {
      fetchProperties();
    }
  }, [status, fetchProperties, router]);

  const handleQuickEdit = (property: PropertySummary) => {
    setQuickEditId(property.id);
    setEditPrice(property.basePrice?.toString() || "");
  };

  const saveQuickEdit = async () => {
    if (!quickEditId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tourism/properties/${quickEditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePrice: parseFloat(editPrice) }),
      });
      if (res.ok) {
        toast.success("Cena posodobljena");
        setQuickEditId(null);
        fetchProperties();
      } else {
        toast.error("Napaka pri shranjevanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Nastanitve</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Pregled in upravljanje vašega portfelja nepremičnin.</p>
          </div>
          <button 
            onClick={() => router.push("/dashboard/tourism/properties")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Dodaj nastanitev
          </button>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse"></div>
            ))
          ) : properties.length > 0 ? (
            properties.map((prop) => (
              <div key={prop.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                
                {/* Status Bar */}
                <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${prop.status === "active" ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{prop.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {prop.eturizemStatus === "synced" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="eTurizem Synced" />}
                    {prop.eturizemStatus === "pending" && <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="eTurizem Pending" />}
                    {prop.eturizemStatus === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" title="eTurizem Connection Error" />}
                    <span className="text-[10px] font-bold text-gray-400">eTurizem</span>
                  </div>
                </div>

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{prop.name}</h2>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{prop.location || "Lokacija ni vpisana"}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Zasedenost</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold">{prop.occupancyRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Prihodek (mesec)</p>
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold">€{prop.monthlyRevenue.toLocaleString("sl-SI")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for occupancy */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${prop.occupancyRate > 80 ? "bg-green-500" : prop.occupancyRate > 50 ? "bg-blue-500" : "bg-amber-500"}`} 
                      style={{ width: `${prop.occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Quick Edit / Footer */}
                <div className="p-4 bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  {quickEditId === prop.id ? (
                    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-1">
                      <div className="relative flex-1">
                        <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                          type="number"
                          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button onClick={saveQuickEdit} disabled={isSaving} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setQuickEditId(null)} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs">
                        <span className="text-gray-400">Osnovna cena: </span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">€{prop.basePrice || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleQuickEdit(prop)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Hitro uredi ceno"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/properties/${prop.id}/pricing`)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Cenik in Sezone"
                        >
                          <Euro className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/properties/${prop.id}/rooms`)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Sobni Inventar"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-lg">Ni najdenih nastanitev</h3>
              <p className="text-gray-500 mt-1">Začnite z dodajanjem vaše prve nepremičnine.</p>
              <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                Dodaj nastanitev
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
