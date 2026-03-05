"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  Bot,
  Zap,
  MoreVertical,
  History,
  ShieldAlert,
  Save,
  X,
  Send,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";

interface ReservationDetails {
  id: string;
  propertyId: string;
  property: { 
    name: string;
    reservationAutoApprovalRules: any;
    policies: Array<{ id: string; policyType: string; content: string }>;
  };
  guestId: string | null;
  guest: { 
    name: string; 
    email: string | null; 
    phone: string | null;
    countryCode: string | null;
    reservations: Array<{ id: string; checkIn: string; status: string }>;
    communications: Array<{ id: string; type: string; channel: string; content: string; createdAt: string; status: string }>;
  } | null;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  channel: string | null;
  totalPrice: number | null;
  notes: string | null;
  payments: Array<{ id: string; amount: number; type: string; paidAt: string }>;
  createdAt: string;
}

export default function ReservationDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = useParams() || {};
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/reservations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setReservation(data);
        setEditData({
          status: data.status,
          checkIn: format(parseISO(data.checkIn), "yyyy-MM-dd"),
          checkOut: format(parseISO(data.checkOut), "yyyy-MM-dd"),
          totalPrice: data.totalPrice,
          notes: data.notes || "",
          roomId: data.roomId || ""
        });
        setInternalNote(data.notes || "");
      } else {
        toast.error(data.error || "Napaka pri nalaganju detajlov");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDetails();
    }
  }, [status, fetchDetails]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tourism/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        toast.success("Rezervacija posodobljena");
        setIsEditing(false);
        fetchDetails();
      } else {
        const data = await res.json();
        toast.error(data.error || "Napaka pri shranjevanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    const policy = reservation.property.policies.find(p => p.policyType === "cancellation");
    const confirmMsg = policy 
      ? `Pozor! Pravila preklica:\n\n${policy.content}\n\nAli ste prepričani, da želite preklicati to rezervacijo?`
      : "Ali ste prepričani, da želite preklicati to rezervacijo?";

    if (!window.confirm(confirmMsg)) return;
    
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/tourism/reservations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Rezervacija preklicana");
        fetchDetails();
      } else {
        toast.error("Napaka pri preklicu");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !reservation.guestId) return;
    
    try {
      const res = await fetch("/api/tourism/guest-communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: reservation.propertyId,
          guestId: reservation.guestId,
          type: "inquiry",
          channel: "email",
          content: newMessage,
          subject: `Glede vaše rezervacije #${reservation.id.slice(-6).toUpperCase()}`
        }),
      });
      
      if (res.ok) {
        toast.success("Sporočilo poslano gostu");
        setNewMessage("");
        fetchDetails();
      } else {
        toast.error("Napaka pri pošiljanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    }
  };

  const handleUpdateNotes = async () => {
    try {
      const res = await fetch(`/api/tourism/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: internalNote }),
      });
      if (res.ok) {
        toast.success("Opomba shranjena");
        fetchDetails();
      }
    } catch (error) {
      toast.error("Napaka pri shranjevanju opombe");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "checked-in": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "checked-out": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const isAutoApproved = reservation.channel !== "direct";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/reservations")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
              title="Nazaj na seznam rezervacij"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Rezervacija #{reservation.id.slice(-6).toUpperCase()}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{reservation.property.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Uredi
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isCancelling || reservation.status === "cancelled"}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Prekliči
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Prekliči urejanje
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Shrani spremembe
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Reservation Details Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Podrobnosti bivanja
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prihod (Check-in)</label>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        value={editData.checkIn}
                        onChange={(e) => setEditData({...editData, checkIn: e.target.value})}
                        title="Datum prihoda"
                        placeholder="Izberite datum prihoda"
                      />
                    ) : (
                      <p className="text-sm font-medium">{format(parseISO(reservation.checkIn), "EEEE, d. MMMM yyyy", { locale: sl })}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Odhod (Check-out)</label>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        value={editData.checkOut}
                        onChange={(e) => setEditData({...editData, checkOut: e.target.value})}
                        title="Datum odhoda"
                        placeholder="Izberite datum odhoda"
                      />
                    ) : (
                      <p className="text-sm font-medium">{format(parseISO(reservation.checkOut), "EEEE, d. MMMM yyyy", { locale: sl })}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Soba / Enota</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        value={editData.roomId}
                        onChange={(e) => setEditData({...editData, roomId: e.target.value})}
                        title="Številka sobe ali enota"
                        placeholder="Vnesite številko sobe"
                      />
                    ) : (
                      <p className="text-sm font-medium">{reservation.roomId || "Ni dodeljeno"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kanal rezervacije</label>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {isAutoApproved ? (
                        <>
                          <Bot className="w-4 h-4 text-blue-500" />
                          <span className="capitalize">{reservation.channel}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Direktno / Ročni vnos</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Auto-Approval Log & Intelligence */}
            {isAutoApproved && (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Zap className="w-5 h-5 text-blue-500" />
                  AI Intelligence Log
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Samodejna potrditev:</strong> Rezervacija je bila avtomatsko potrjena na podlagi pravilnika za kanal {reservation.channel}.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Razpoložljivost:</strong> Preverjeno stanje zasedenosti za obdobje {format(parseISO(reservation.checkIn), "d. M.")} - {format(parseISO(reservation.checkOut), "d. M.")}.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800 flex justify-between items-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium italic">Vsi pogoji za &quot;Zero-Touch&quot; so bili izpolnjeni.</p>
                    <button className="text-xs bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-gray-800 text-blue-600 font-bold hover:bg-blue-50 transition-all flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Ročni Override
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Communication & Internal Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Sporočilo gostu
                </h2>
                <textarea 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Napišite sporočilo gostu..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  onClick={handleSendMessage}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Pošlji sporočilo
                </button>

                {/* Communication History */}
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                    <History className="w-3 h-3" />
                    Zgodovina sporočil
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {reservation.guest?.communications.map(comm => (
                      <div key={comm.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                        <div className="flex justify-between mb-1 text-gray-400">
                          <span className="capitalize">{comm.channel}</span>
                          <span>{format(parseISO(comm.createdAt), "d. M. yyyy HH:mm")}</span>
                        </div>
                        <p className="line-clamp-2">{comm.content}</p>
                      </div>
                    ))}
                    {(!reservation.guest?.communications || reservation.guest.communications.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-4">Še ni bilo komunikacije.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  Interne opombe
                </h2>
                <textarea 
                  className="w-full px-4 py-2 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                  placeholder="Dodajte opombo za osebje..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                />
                <button 
                  onClick={handleUpdateNotes}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Shrani opombo
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* 1. Guest Profile Info */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Profil gosta
              </h2>
              {reservation.guest ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-lg font-bold">
                      {reservation.guest.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{reservation.guest.name}</p>
                      <p className="text-xs text-gray-500">Gost od {format(parseISO(reservation.createdAt), "yyyy")}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{reservation.guest.email || "Ni emaila"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{reservation.guest.phone || "Ni telefona"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      <History className="w-3 h-3" />
                      Zgodovina bivanja
                    </p>
                    <div className="space-y-2">
                      {reservation.guest.reservations.map(prev => (
                        <div key={prev.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{format(parseISO(prev.checkIn), "MMM yyyy", { locale: sl })}</span>
                          <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[8px] ${getStatusColor(prev.status)}`}>
                            {prev.status}
                          </span>
                        </div>
                      ))}
                      {reservation.guest.reservations.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Prvi obisk pri vas.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Podatki o gostu niso na voljo.</p>
              )}
            </div>

            {/* 2. Payment Status */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Plačila in finance
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Skupni znesek</p>
                    <p className="text-2xl font-black">€{reservation.totalPrice?.toLocaleString("sl-SI")}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${reservation.payments.length > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {reservation.payments.length > 0 ? "Plačano" : "Čaka na plačilo"}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  {reservation.payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span>{payment.type} ({format(parseISO(payment.paidAt), "d. M.")})</span>
                      <span className="font-bold">€{payment.amount.toLocaleString("sl-SI")}</span>
                    </div>
                  ))}
                  {reservation.payments.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2 italic">Trenutno ni zabeleženih plačil.</p>
                  )}
                </div>

                <button className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj plačilo
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
