"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  User, 
  Plus, 
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Loader2,
  Search
} from "lucide-react";
import { format, addDays } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
}

interface Availability {
  available: boolean;
  overlappingCount: number;
  capacity: number;
  nights: number;
  totalPrice: number;
  basePrice: number;
  autoApprove: boolean;
}

export default function NewReservationPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Form state
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const [roomId, setRoomId] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  
  // Guest state
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [isNewGuest, setIsNewGuest] = useState(true);
  const [guestData, setGuestData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "SI"
  });

  // Availability state
  const [availability, setAvailability] = useState<Availability | null>(null);

  // Guest search
  useEffect(() => {
    if (guestSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/tourism/guests?q=${guestSearch}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        logger.error("Guest search error:", err);
      }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [guestSearch]);

  // Availability check
  const checkAvailability = useCallback(async () => {
    if (!activePropertyId || !checkIn || !checkOut) return;
    
    setCheckingAvailability(true);
    try {
      const res = await fetch(`/api/tourism/reservations/availability?propertyId=${activePropertyId}&checkIn=${checkIn}&checkOut=${checkOut}`);
      const data = await res.json();
      if (res.ok) {
        setAvailability(data);
      } else {
        toast.error(data.error || "Napaka pri preverjanju razpoložljivosti");
      }
    } catch (err) {
      toast.error("Sistemska napaka");
    } finally {
      setCheckingAvailability(false);
    }
  }, [activePropertyId, checkIn, checkOut]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const selectGuest = (guest: Guest) => {
    setGuestId(guest.id);
    setGuestData({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      countryCode: guest.countryCode || "SI"
    });
    setIsNewGuest(false);
    setSearchResults([]);
    setGuestSearch("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePropertyId) {
      toast.error("Prosimo, izberite nastanitev");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tourism/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationData: {
            propertyId: activePropertyId,
            guestId: isNewGuest ? null : guestId,
            guestData: isNewGuest ? guestData : null,
            checkIn,
            checkOut,
            roomId,
            totalPrice: availability?.totalPrice,
            notes,
            sendEmail
          }
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Rezervacija uspešno ustvarjena");
        router.push("/reservations");
      } else {
        toast.error(data.error || "Napaka pri ustvarjanju rezervacije");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Nazaj na pregled
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Rezervacija</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ročni vnos rezervacije za gosta.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Property & Dates */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                Nastanitev in termini
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Izberite nastanitev</label>
                  <PropertySelector 
                    value={activePropertyId} 
                    onChange={setActivePropertyId} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Prihod (Check-in)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                      title="Datum prihoda"
                      placeholder="Izberite datum prihoda"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Odhod (Check-out)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                      title="Datum odhoda"
                      placeholder="Izberite datum odhoda"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Soba / Enota (opcijsko)</label>
                  <input 
                    type="text"
                    placeholder="Npr. Apartma 1, Soba 102..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    title="Številka sobe ali enota"
                  />
                </div>
              </div>
            </div>

            {/* 2. Guest Information */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Podatki o gostu
                </h2>
                {!isNewGuest && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsNewGuest(true);
                      setGuestId(null);
                      setGuestData({ name: "", email: "", phone: "", countryCode: "SI" });
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Nov gost
                  </button>
                )}
              </div>
              
              {isNewGuest && (
                <div className="mb-6 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Poišči obstoječega gosta (ime, email)..."
                      className="w-full pl-10 pr-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      {searchResults.map(guest => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => selectGuest(guest)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-bold">{guest.name}</p>
                            <p className="text-xs text-gray-500">{guest.email || "Ni emaila"}</p>
                          </div>
                          <Plus className="w-4 h-4 text-blue-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ime in Priimek</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={guestData.name}
                    onChange={(e) => setGuestData({...guestData, name: e.target.value})}
                    required
                    disabled={!isNewGuest}
                    title="Ime in priimek gosta"
                    placeholder="Vnesite ime in priimek"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={guestData.email}
                    onChange={(e) => setGuestData({...guestData, email: e.target.value})}
                    disabled={!isNewGuest}
                    title="Email naslov gosta"
                    placeholder="Vnesite email naslov"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Telefon</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={guestData.phone}
                    onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                    disabled={!isNewGuest}
                    title="Telefonska številka gosta"
                    placeholder="Vnesite telefonsko številko"
                  />
                </div>
              </div>
            </div>

            {/* 3. Notes */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Posebne želje in opombe
              </h2>
              <textarea 
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Vpišite opombe, diete, uro prihoda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Sidebar Summary Column */}
          <div className="space-y-6">
            
            {/* Price & Availability Summary */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm sticky top-24">
              <h2 className="font-bold mb-6">Povzetek izračuna</h2>
              
              {checkingAvailability ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-xs text-gray-500">Preverjanje razpoložljivosti...</p>
                </div>
              ) : availability ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Št. nočitev</span>
                    <span className="font-bold">{availability.nights}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cena na noč (avg)</span>
                    <span className="font-bold">€{(availability.totalPrice / availability.nights).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end">
                    <span className="text-sm font-bold">SKUPAJ</span>
                    <span className="text-2xl font-black text-blue-600">€{availability.totalPrice.toLocaleString("sl-SI")}</span>
                  </div>

                  <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
                    availability.available ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    {availability.available ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase">Na voljo</p>
                          <p className="text-[10px] opacity-80">Nastanitev ima prosto kapaciteto za te datume.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase">Ni razpoložljivo</p>
                          <p className="text-[10px] opacity-80">Pozor! Nastanitev je že polno zasedena ({availability.capacity}/{availability.capacity}).</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl flex items-start gap-3">
                    <Bot className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase">AI Preview</p>
                      <p className="text-[10px] opacity-80">Ta rezervacija bo avtomatsko potrjena in vključena v analitiko.</p>
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pošlji potrditveni email</span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading || !availability.available}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Potrdi rezervacijo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                  Vnesite nastanitev in datume za izračun cene.
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
