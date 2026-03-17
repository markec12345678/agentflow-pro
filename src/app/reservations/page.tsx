"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  LogOut, 
  Bot,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CalendarDays,
  X,
  Plus,
  ShieldAlert
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay, endOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Reservation {
  id: string;
  propertyId: string;
  property: { name: string };
  guestId: string | null;
  guest: { name: string; email: string | null; phone: string | null } | null;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  channel: string | null;
  totalPrice: number | null;
  createdAt: string;
}

export default function ReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState<"table" | "calendar">("table");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/v1/tourism/reservations/pending")
        .then(r => r.json())
        .then(data => setPendingCount(Array.isArray(data) ? data.length : 0))
        .catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login?callbackUrl=/reservations");
    }
  }, [status]);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activePropertyId) params.set("propertyId", activePropertyId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);
      
      const res = await fetch(`/api/v1/tourism/reservations?${params.toString()}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Napaka pri nalaganju rezervacij");
    } finally {
      setLoading(false);
    }
  }, [activePropertyId, statusFilter, search, dateRange]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReservations();
    }
  }, [status, fetchReservations]);

  const handleBulkAction = async (action: "check-in" | "check-out") => {
    if (selectedIds.length === 0) return;
    
    try {
      const res = await fetch("/api/v1/tourism/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reservationIds: selectedIds }),
      });
      
      if (res.ok) {
        toast.success(`Uspešno posodobljeno ${selectedIds.length} rezervacij`);
        setSelectedIds([]);
        fetchReservations();
      } else {
        toast.error("Napaka pri izvajanju akcije");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Gost", "Nastanitev", "Prihod", "Odhod", "Status", "Kanal", "Cena"];
    const rows = reservations.map(r => [
      r.id,
      r.guest?.name ?? "Neznan",
      r.property.name,
      format(parseISO(r.checkIn), "yyyy-MM-dd"),
      format(parseISO(r.checkOut), "yyyy-MM-dd"),
      r.status,
      r.channel ?? "Direktno",
      `${r.totalPrice ?? 0} €`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `rezervacije_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportICal = () => {
    if (!activePropertyId) {
      toast.error("Izberite nastanitev za iCal izvoz");
      return;
    }
    window.open(`/api/v1/tourism/ical?propertyId=${activePropertyId}`, "_blank");
  };

  // Calendar logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

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

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rezervacije</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Pregled in upravljanje rezervacij vaših nastanitev.</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Link 
                href="/reservations/pending"
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all animate-pulse"
              >
                <ShieldAlert className="w-4 h-4" />
                {pendingCount} v čakanju
              </Link>
            )}
            <Link 
              href="/reservations/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Nova Rezervacija
            </Link>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 flex">
              <button 
                onClick={() => setView("table")}
                className={`p-2 rounded-lg transition-all ${view === "table" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "text-gray-400 hover:text-gray-600"}`}
                title="Prikaz v tabeli"
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView("calendar")}
                className={`p-2 rounded-lg transition-all ${view === "calendar" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "text-gray-400 hover:text-gray-600"}`}
                title="Prikaz v koledarju"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Izvoz
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={exportCSV} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 rounded-t-xl">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Prenesi CSV
                </button>
                <button onClick={exportICal} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 rounded-b-xl border-t border-gray-100 dark:border-gray-800">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  iCal Feed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Išči gosta ali ID rezervacije..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <PropertySelector 
                value={activePropertyId} 
                onChange={setActivePropertyId} 
              />
              
              <button 
                onClick={() => setShowAdvancedFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-all ${showFilters ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800" : "border-gray-200 dark:border-gray-800 text-gray-500"}`}
                title="Napredni filtri"
              >
                <Filter className="w-5 h-5" />
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 pl-4 border-l border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => handleBulkAction("check-in")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Check-in
                  </button>
                  <button 
                    onClick={() => handleBulkAction("check-out")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Check-out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  title="Filter rezervacij po statusu"
                >
                  <option value="all">Vsi statusi</option>
                  <option value="confirmed">Potrjeno</option>
                  <option value="checked-in">V objektu</option>
                  <option value="checked-out">Odjavljeno</option>
                  <option value="cancelled">Preklicano</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Datum od</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  title="Začetni datum filtra"
                  placeholder="Izberite začetni datum"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Datum do</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  title="Končni datum filtra"
                  placeholder="Izberite končni datum"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        {view === "table" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Izberi vse rezervacije"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(reservations.map(r => r.id));
                          else setSelectedIds([]);
                        }}
                        checked={selectedIds.length === reservations.length && reservations.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Gost</th>
                    <th className="px-6 py-4 font-medium">Datum</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Kanal</th>
                    <th className="px-6 py-4 font-medium text-right">Znesek</th>
                    <th className="px-6 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="px-6 py-8 h-16 bg-gray-50/50 dark:bg-gray-800/20"></td>
                      </tr>
                    ))
                  ) : reservations.length > 0 ? (
                    reservations.map((res) => (
                      <tr 
                        key={res.id} 
                        className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${selectedIds.includes(res.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                        onClick={() => router.push(`/reservations/${res.id}`)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            title={`Izberi rezervacijo ${res.id}`}
                            checked={selectedIds.includes(res.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, res.id]);
                              else setSelectedIds(selectedIds.filter(id => id !== res.id));
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">
                              {res.guest?.name.charAt(0) ?? "?"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{res.guest?.name ?? "Neznan gost"}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{res.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium">{format(parseISO(res.checkIn), "d. MMM", { locale: sl })} - {format(parseISO(res.checkOut), "d. MMM", { locale: sl })}</p>
                            <p className="text-xs text-gray-400">{Math.ceil((parseISO(res.checkOut).getTime() - parseISO(res.checkIn).getTime()) / (1000 * 60 * 60 * 24))} noči</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(res.status)}`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            {res.channel !== "direct" ? (
                              <>
                                <span title="Avtomatska rezervacija (OTA)"><Bot className="w-4 h-4 text-blue-500" /></span>
                                <span className="capitalize">{res.channel}</span>
                              </>
                            ) : (
                              <>
                                <span title="Ročna rezervacija"><User className="w-4 h-4 text-gray-400" /></span>
                                <span>Direktno</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold">€{res.totalPrice?.toLocaleString("sl-SI") ?? "0"}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Možnosti rezervacije">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Ni najdenih rezervacij za izbrane filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {view === "calendar" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-lg capitalize">{format(currentMonth, "MMMM yyyy", { locale: sl })}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Prejšnji mesec"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  title="Pojdi na današnji dan"
                >
                  Danes
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Naslednji mesec"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-gray-50 dark:border-gray-800">
              {["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-[120px]">
              {daysInMonth.map((day, i) => {
                const dayReservations = reservations.filter(r => 
                  isSameDay(day, parseISO(r.checkIn)) || 
                  isSameDay(day, parseISO(r.checkOut)) ||
                  (day > parseISO(r.checkIn) && day < parseISO(r.checkOut))
                );
                
                return (
                  <div 
                    key={i} 
                    className={`p-2 border-r border-b border-gray-50 dark:border-gray-800 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20 ${
                      day.getMonth() !== currentMonth.getMonth() ? "opacity-30" : ""
                    }`}
                  >
                    <span className="text-sm font-medium">{day.getDate()}</span>
                    <div className="mt-2 space-y-1">
                      {dayReservations.slice(0, 3).map(res => (
                        <div 
                          key={res.id}
                          className={`px-2 py-1 rounded text-[10px] font-bold truncate flex items-center gap-1 ${
                            isSameDay(day, parseISO(res.checkIn)) ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40" :
                            isSameDay(day, parseISO(res.checkOut)) ? "bg-gray-100 text-gray-600 dark:bg-gray-800" :
                            "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                          }`}
                        >
                          {res.channel !== "direct" && <Bot className="w-3 h-3 shrink-0" />}
                          {res.guest?.name ?? "Gost"}
                        </div>
                      ))}
                      {dayReservations.length > 3 && (
                        <div className="text-[10px] text-gray-400 text-center">+{dayReservations.length - 3} več</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
