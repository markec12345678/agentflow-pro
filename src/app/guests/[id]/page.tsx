"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Star, 
  ShieldAlert, 
  History, 
  MessageSquare, 
  Plus, 
  Save, 
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Heart
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";

interface GuestProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  riskScore: string | null;
  isVip: boolean;
  gdprConsent: boolean;
  preferences: string | null;
  notes: string | null;
  createdAt: string;
  reservations: Array<{
    id: string;
    checkIn: string;
    checkOut: string;
    status: string;
    totalPrice: number | null;
    property: { name: string };
  }>;
  communications: Array<{
    id: string;
    type: string;
    channel: string;
    content: string;
    createdAt: string;
  }>;
}

export default function GuestProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const { id: guestId } = useParams() || {};
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit states
  const [editData, setEditData] = useState({
    isVip: false,
    riskScore: "low",
    gdprConsent: false,
    preferences: "",
    notes: ""
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/guests/${guestId}`);
      const data = await res.json();
      if (res.ok) {
        setGuest(data);
        setEditData({
          isVip: data.isVip,
          riskScore: data.riskScore || "low",
          gdprConsent: data.gdprConsent,
          preferences: data.preferences || "",
          notes: data.notes || ""
        });
      } else {
        toast.error(data.error || "Napaka pri nalaganju profila");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tourism/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        toast.success("Profil posodobljen");
        fetchProfile();
      } else {
        toast.error("Napaka pri shranjevanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-700 dark:bg-green-900/30";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800";
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
              onClick={() => router.push("/guests")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
              title="Nazaj na seznam gostov"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{guest.name}</h1>
                {guest.isVip && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Gost od {format(parseISO(guest.createdAt), "MMMM yyyy", { locale: sl })}</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Shrani spremembe
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile & Preferences */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basic Info Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Osnovni podatki
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                      <p className="font-medium">{guest.email || "Ni vpisan"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Telefon</p>
                      <p className="font-medium">{guest.phone || "Ni vpisan"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Država</p>
                      <p className="font-medium">{guest.countryCode || "Neznano"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Zadnji obisk</p>
                      <p className="font-medium">
                        {guest.reservations[0] ? format(parseISO(guest.reservations[0].checkIn), "d. MMMM yyyy", { locale: sl }) : "Nikoli"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Preferences & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Želje in preference
                </h2>
                <textarea 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  placeholder="Npr. Veganska hrana, visoko nadstropje..."
                  value={editData.preferences}
                  onChange={(e) => setEditData({...editData, preferences: e.target.value})}
                />
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Interne opombe
                </h2>
                <textarea 
                  className="w-full px-4 py-2 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 min-h-[120px]"
                  placeholder="Zasebne opombe osebja..."
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                />
              </div>
            </div>

            {/* 3. Booking History */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Zgodovina bivanja
              </h2>
              <div className="space-y-4">
                {guest.reservations.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => router.push(`/reservations/${res.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{res.property.name}</p>
                        <p className="text-xs text-gray-400">
                          {format(parseISO(res.checkIn), "d. MMM")} - {format(parseISO(res.checkOut), "d. MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold">€{res.totalPrice?.toLocaleString("sl-SI")}</p>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getStatusColor(res.status)}`}>
                          {res.status}
                        </span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-blue-500 rotate-180 transition-colors" />
                    </div>
                  </div>
                ))}
                {guest.reservations.length === 0 && (
                  <p className="text-center py-8 text-gray-400 text-sm italic">Ta gost še nima zabeleženih bivanj.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Comm History */}
          <div className="space-y-6">
            
            {/* 1. Status Controls */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-6">Status in Varnost</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${editData.isVip ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                    <span className="text-sm font-medium">VIP Gost</span>
                  </div>
                  <button 
                    onClick={() => setEditData({...editData, isVip: !editData.isVip})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${editData.isVip ? "bg-blue-600" : "bg-gray-200"}`}
                    title="Preklopi VIP status gostu"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editData.isVip ? "left-6" : "left-1"}`}></div>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" />
                    Risk Score
                  </label>
                  <div className="flex gap-2">
                    {["low", "medium", "high"].map(score => (
                      <button
                        key={score}
                        onClick={() => setEditData({...editData, riskScore: score})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                          editData.riskScore === score 
                            ? (score === "low" ? "bg-green-600 text-white" : score === "medium" ? "bg-amber-500 text-white" : "bg-red-600 text-white")
                            : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <div className={editData.gdprConsent ? "text-green-500" : "text-red-500"}>
                      {editData.gdprConsent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">GDPR Privolitev</p>
                      <p className="text-[10px] text-gray-400">Gost se strinja s hrambo podatkov za namene marketinga.</p>
                      <button 
                        onClick={() => setEditData({...editData, gdprConsent: !editData.gdprConsent})}
                        className="text-[10px] font-bold text-blue-600 mt-2 hover:underline"
                      >
                        Spremeni status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Communication History */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Zgodovina sporočil
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {guest.communications.map((comm) => (
                  <div key={comm.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                    <div className="flex justify-between mb-1 text-gray-400">
                      <span className="capitalize font-bold">{comm.channel}</span>
                      <span>{format(parseISO(comm.createdAt), "d. M. yyyy")}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{comm.content}</p>
                  </div>
                ))}
                {guest.communications.length === 0 && (
                  <p className="text-center py-8 text-gray-400 text-sm italic">Še ni bilo komunikacije.</p>
                )}
              </div>
              <button 
                onClick={() => router.push(`/guests/${guestId}/messages`)}
                className="w-full mt-6 py-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo sporočilo
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
