"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { format, addMonths, subMonths, addDays } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface CalendarDay {
  date: string;
  day: number;
  status: "available" | "booked" | "blocked" | "check-in" | "check-out";
  reservation: {
    id: string;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    channel: string;
    totalAmount: number;
  } | null;
}

interface CalendarStats {
  totalDays: number;
  bookedDays: number;
  availableDays: number;
  occupancyRate: number;
  revenue: number;
}

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [newReservationForm, setNewReservationForm] = useState({
    checkIn: "",
    checkOut: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    channel: "direct",
    totalAmount: "",
    deposit: "",
    touristTax: "",
    notes: "",
  });
  const [createReservationLoading, setCreateReservationLoading] = useState(false);
  const [createConflict, setCreateConflict] = useState<{ message: string; conflicts?: unknown[] } | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [calcCheckIn, setCalcCheckIn] = useState("");
  const [calcCheckOut, setCalcCheckOut] = useState("");
  const [calcResult, setCalcResult] = useState<{
    nights: number;
    baseTotal: number;
    adjustments: Array<{ label: string; amount: number }>;
    finalPrice: number;
    currency: string;
  } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [icalSyncOpen, setIcalSyncOpen] = useState(false);
  const [icalFeedUrl, setIcalFeedUrl] = useState<string | null>(null);
  const [icalInstructions, setIcalInstructions] = useState<Record<string, string> | null>(null);
  const [icalLoading, setIcalLoading] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkFormat, setBulkFormat] = useState<"csv" | "json">("csv");
  const [bulkData, setBulkData] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [paymentsData, setPaymentsData] = useState<{
    payments: { id: string; type: string; amount: number; method: string | null; paidAt: string }[];
    totalPaid: number;
    totalDue: number;
    outstanding: number;
    deposit: number | null;
    touristTax: number | null;
  } | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: "deposit" as "deposit" | "balance" | "tourist_tax" | "extra", amount: "", method: "cash" as "cash" | "card" | "transfer" });
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [simpleReservationMode, setSimpleReservationMode] = useState(true);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(
        `/api/tourism/calendar?propertyId=${activePropertyId}&year=${year}&month=${month}`
      );
      const data = await res.json();
      setCalendar(data.calendar || []);
      setStats(data.stats || null);
    } catch {
      toast.error("Napaka pri nalaganju koledarja");
    } finally {
      setLoading(false);
    }
  }, [activePropertyId, currentDate]);

  useEffect(() => {
    if (activePropertyId) {
      fetchCalendar();
    }
  }, [activePropertyId, currentDate, fetchCalendar]);

  useEffect(() => {
    if (searchParams.get("open") === "new") {
      setShowNewReservation(true);
    }
    const prop = searchParams.get("propertyId");
    if (prop) setActivePropertyId(prop);
  }, [searchParams]);

  useEffect(() => {
    const rid = selectedDate?.reservation?.id;
    if (!rid) {
      setPaymentsData(null);
      return;
    }
    setPaymentsLoading(true);
    fetch(`/api/tourism/reservations/${rid}/payments`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setPaymentsData({
          payments: d.payments ?? [],
          totalPaid: d.totalPaid ?? 0,
          totalDue: d.totalDue ?? 0,
          outstanding: d.outstanding ?? 0,
          deposit: d.deposit ?? null,
          touristTax: d.touristTax ?? null,
        });
      })
      .catch(() => setPaymentsData(null))
      .finally(() => setPaymentsLoading(false));
  }, [selectedDate?.reservation?.id]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const generateIcalSync = () => {
    if (!activePropertyId) {
      toast.error("Izberite nastanitev");
      return;
    }
    setIcalLoading(true);
    setIcalSyncOpen(true);
    fetch("/api/tourism/ical", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: activePropertyId, action: "generate-token" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setIcalFeedUrl(d.feedUrl ?? null);
        setIcalInstructions(d.instructions ?? null);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Napaka");
        setIcalFeedUrl(null);
        setIcalInstructions(null);
      })
      .finally(() => setIcalLoading(false));
  };

  const copyIcalUrl = () => {
    if (icalFeedUrl) {
      navigator.clipboard.writeText(icalFeedUrl);
      toast.success("iCal povezava kopirana");
    }
  };

  const runBulkImport = () => {
    if (!activePropertyId || !bulkData.trim()) {
      toast.error("Izberite nastanitev in vnesite podatke");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    fetch("/api/tourism/calendar/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: activePropertyId,
        format: bulkFormat,
        data: bulkData.trim(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setBulkResult(d);
        toast.success(`Uvoženo: ${d.imported}, preskočeno: ${d.skipped}`);
        if (d.imported > 0) fetchCalendar();
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Napaka pri uvozu");
      })
      .finally(() => setBulkLoading(false));
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkData(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkData(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const fetchCalculatedPrice = () => {
    if (!activePropertyId || !calcCheckIn || !calcCheckOut) {
      toast.error("Izberite nastanitev in vnesite prihod ter odhod");
      return;
    }
    setCalcLoading(true);
    setCalcResult(null);
    fetch(
      `/api/tourism/calculate-price?propertyId=${activePropertyId}&checkIn=${encodeURIComponent(calcCheckIn)}&checkOut=${encodeURIComponent(calcCheckOut)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCalcResult(d);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Napaka pri izračunu cene");
        setCalcResult(null);
      })
      .finally(() => setCalcLoading(false));
  };

  const doCreateReservation = async (allowOverbooking: boolean) => {
    if (!activePropertyId || !newReservationForm.checkIn || !newReservationForm.checkOut) {
      toast.error("Izberite nastanitev ter vnesite prihod in odhod");
      return;
    }
    setCreateReservationLoading(true);
    setCreateConflict(null);
    const body = {
      propertyId: activePropertyId,
      type: "reservation",
      checkIn: newReservationForm.checkIn,
      checkOut: newReservationForm.checkOut,
      guestName: newReservationForm.guestName.trim() || undefined,
      guestEmail: newReservationForm.guestEmail.trim() || undefined,
      guestPhone: newReservationForm.guestPhone.trim() || undefined,
      channel: newReservationForm.channel,
      totalAmount: newReservationForm.totalAmount ? parseFloat(newReservationForm.totalAmount) : undefined,
      deposit: newReservationForm.deposit ? parseFloat(newReservationForm.deposit) : undefined,
      touristTax: newReservationForm.touristTax ? parseFloat(newReservationForm.touristTax) : undefined,
      notes: newReservationForm.notes.trim() || undefined,
      allowOverbooking,
    };
    try {
      const res = await fetch("/api/tourism/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 409) {
        setCreateConflict({ message: "Prekrivanje z obstoječo rezervacijo.", conflicts: data.conflicts });
        setCreateReservationLoading(false);
        return;
      }
      if (data.error) throw new Error(data.error);
      toast.success("Rezervacija ustvarjena");
      if (data.warning) toast.warning(data.warning);
      setShowNewReservation(false);
      setNewReservationForm({ checkIn: "", checkOut: "", guestName: "", guestEmail: "", guestPhone: "", channel: "direct", totalAmount: "", deposit: "", touristTax: "", notes: "" });
      fetchCalendar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka pri ustvarjanju");
    } finally {
      setCreateReservationLoading(false);
    }
  };

  // Auto-fetch price when checkIn/checkOut change (debounced)
  useEffect(() => {
    if (!activePropertyId || !newReservationForm.checkIn || !newReservationForm.checkOut) return;
    const t = setTimeout(() => {
      fetch(
        `/api/tourism/calculate-price?propertyId=${activePropertyId}&checkIn=${encodeURIComponent(newReservationForm.checkIn)}&checkOut=${encodeURIComponent(newReservationForm.checkOut)}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (!d.error && d.finalPrice != null) {
            setNewReservationForm((f) => ({ ...f, totalAmount: String(d.finalPrice) }));
          }
        })
        .catch(() => { });
    }, 600);
    return () => clearTimeout(t);
  }, [activePropertyId, newReservationForm.checkIn, newReservationForm.checkOut]);

  const fetchPriceForNewReservation = async () => {
    if (!activePropertyId || !newReservationForm.checkIn || !newReservationForm.checkOut) {
      toast.error("Vnesite prihod in odhod");
      return;
    }
    try {
      const res = await fetch(
        `/api/tourism/calculate-price?propertyId=${activePropertyId}&checkIn=${encodeURIComponent(newReservationForm.checkIn)}&checkOut=${encodeURIComponent(newReservationForm.checkOut)}`
      );
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setNewReservationForm((f) => ({ ...f, totalAmount: String(d.finalPrice ?? "") }));
      toast.success("Cena izračunana");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka pri izračunu");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-linear-to-br from-emerald-400 to-teal-500 text-white";
      case "booked":
        return "bg-linear-to-br from-rose-500 to-red-600 text-white";
      case "check-in":
        return "bg-linear-to-br from-blue-500 to-indigo-600 text-white";
      case "check-out":
        return "bg-linear-to-br from-amber-500 to-orange-600 text-white";
      case "blocked":
        return "bg-gray-500/80 text-white dark:bg-gray-600/90";
      default:
        return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Prosto";
      case "booked":
        return "Zasedeno";
      case "check-in":
        return "Check-in";
      case "check-out":
        return "Check-out";
      case "blocked":
        return "Blokirano";
      default:
        return status;
    }
  };

  // Group days by week
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Add empty days at start
  const firstDay = calendar[0];
  if (firstDay) {
    const firstDate = new Date(firstDay.date);
    const startDayOfWeek = firstDate.getDay(); // 0 = Sunday
    for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
      currentWeek.push({ date: "", day: 0, status: "available", reservation: null });
    }
  }

  calendar.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === calendar.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Koledar & Zasedenost
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upravljanje rezervacij, iCal sinhronizacija, zasedenost
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Zasedenost"
            value={`${stats.occupancyRate}%`}
            icon="📊"
            color="blue"
          />
          <StatCard
            label="Rezervirani dnevi"
            value={stats.bookedDays}
            icon="📅"
            color="red"
          />
          <StatCard
            label="Prosti dnevi"
            value={stats.availableDays}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Prihodki (mesec)"
            value={`€${stats.revenue}`}
            icon="💰"
            color="purple"
          />
          <StatCard
            label="Skupaj dni"
            value={stats.totalDays}
            icon="📆"
            color="gray"
          />
        </div>
      )}

      {/* Price calculator */}
      {activePropertyId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold">Izračun cene</h2>
            <p className="text-sm text-gray-500 mt-1">Izračunajte ceno glede na datum prihoda in odhoda</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2 items-end">
            <div>
              <label htmlFor="calendar-calc-checkin" className="block text-xs text-gray-500 mb-1">Prihod</label>
              <input
                id="calendar-calc-checkin"
                type="date"
                value={calcCheckIn}
                onChange={(e) => setCalcCheckIn(e.target.value)}
                aria-label="Datum prihoda"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="calendar-calc-checkout" className="block text-xs text-gray-500 mb-1">Odhod</label>
              <input
                id="calendar-calc-checkout"
                type="date"
                value={calcCheckOut}
                onChange={(e) => setCalcCheckOut(e.target.value)}
                aria-label="Datum odhoda"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={fetchCalculatedPrice}
              disabled={calcLoading}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {calcLoading ? "Računam..." : "Izračunaj ceno"}
            </button>
          </div>
          {calcResult && (
            <div className="p-4 pt-0 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nastanitve:</span>
                <span className="font-bold">{calcResult.nights}</span>
              </div>
              {calcResult.adjustments?.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {calcResult.adjustments.map((a: { label: string; amount: number }) => (
                    <div key={a.label} className="flex justify-between">
                      <span>{a.label}</span>
                      <span>{a.amount >= 0 ? "+" : ""}{calcResult.currency === "EUR" ? "€" : ""}{a.amount}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-baseline justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium">Skupaj:</span>
                <span className="text-xl font-bold">{calcResult.currency === "EUR" ? "€" : ""}{calcResult.finalPrice}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: sl })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setNewReservationForm({ checkIn: "", checkOut: "", guestName: "", guestEmail: "", guestPhone: "", channel: "direct", totalAmount: "", deposit: "", touristTax: "", notes: "" });
              setCreateConflict(null);
              setShowNewReservation(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            + Nova rezervacija
          </button>
          <button
            onClick={() => { setBulkImportOpen(true); setBulkResult(null); setBulkData(""); }}
            disabled={!activePropertyId}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Bulk uvoz
          </button>
          <a
            href={`/api/tourism/ical/export?propertyId=${activePropertyId}&token=demo`}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            📥 iCal Export
          </a>
          <button
            onClick={generateIcalSync}
            disabled={!activePropertyId || icalLoading}
            className="px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            {icalLoading ? "Nalaganje..." : "🔗 iCal Sync"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-linear-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-700" />
          <span>Prosto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-linear-to-br from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-700" />
          <span>Zasedeno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700" />
          <span>Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-linear-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700" />
          <span>Check-out</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-gray-500/80" />
          <span>Blokirano</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Nalaganje...</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    onClick={() => day.day > 0 && setSelectedDate(day)}
                    className={`min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${day.day > 0 ? getStatusColor(day.status) : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                  >
                    {day.day > 0 && (
                      <>
                        <div className="font-medium text-sm">{day.day}</div>
                        {day.reservation && (
                          <div className="mt-1 text-xs">
                            <div className="font-medium truncate">{day.reservation.guestName}</div>
                            {day.status === "check-in" && (
                              <div className="text-blue-600 dark:text-blue-400">Prihod</div>
                            )}
                            {day.status === "check-out" && (
                              <div className="text-orange-600 dark:text-orange-400">Odhod</div>
                            )}
                            <div className="text-gray-500">€{day.reservation.totalAmount}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Date Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {format(new Date(selectedDate.date), "EEEE, d. MMMM yyyy", { locale: sl })}
            </h3>

            {selectedDate.reservation ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-medium">{selectedDate.reservation.guestName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDate.reservation.guestEmail}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Prihod</div>
                    <div>{new Date(selectedDate.reservation.checkIn).toLocaleDateString("sl-SI")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Odhod</div>
                    <div>{new Date(selectedDate.reservation.checkOut).toLocaleDateString("sl-SI")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Kanal</div>
                    <div className="capitalize">{selectedDate.reservation.channel || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Celotna cena</div>
                    <div>€{selectedDate.reservation.totalAmount}</div>
                  </div>
                </div>

                {paymentsLoading ? (
                  <div className="text-sm text-gray-500">Nalaganje plačil...</div>
                ) : paymentsData && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-2 text-sm">
                    {paymentsData.deposit != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Akontacija</span>
                        <span>€{paymentsData.deposit.toFixed(2)}</span>
                      </div>
                    )}
                    {paymentsData.touristTax != null && paymentsData.touristTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Turistična taksa</span>
                        <span>€{paymentsData.touristTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Plačano</span>
                      <span>€{paymentsData.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Stanje dolga</span>
                      <span className={paymentsData.outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                        €{paymentsData.outstanding.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                      >
                        Dodaj plačilo
                      </button>
                      <a
                        href={`/api/tourism/reservations/${selectedDate.reservation.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                      >
                        Izpiši račun
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div>
                    <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Znesek (€)</label>
                    <input
                      id="edit-amount"
                      type="number"
                      value={editAmount || selectedDate.reservation.totalAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0"
                      aria-label="Znesek v evrih"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opombe (opcijsko)</label>
                    <textarea
                      id="edit-notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Opombe za rezervacijo"
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setEditAmount("");
                      setEditNotes("");
                      setPaymentModalOpen(false);
                      setPaymentsData(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Zapri
                  </button>
                  <button
                    onClick={async () => {
                      const amount = editAmount.trim()
                        ? parseFloat(editAmount)
                        : selectedDate.reservation!.totalAmount;
                      if (isNaN(amount)) {
                        toast.error("Vnesite veljaven znesek");
                        return;
                      }
                      setEditLoading(true);
                      try {
                        const res = await fetch("/api/tourism/calendar", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: selectedDate.reservation!.id,
                            totalAmount: amount,
                            ...(editNotes.trim() ? { notes: editNotes } : {}),
                          }),
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        toast.success("Rezervacija posodobljena");
                        setSelectedDate(null);
                        setEditAmount("");
                        setEditNotes("");
                        setPaymentsData(null);
                        fetchCalendar();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Napaka");
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editLoading ? "Shranjevanje..." : "Shrani"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Ta datum je <strong>{getStatusLabel(selectedDate.status)}</strong>.
                </p>
                {selectedDate.status === "available" && (
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate.date);
                      setNewReservationForm((f) => ({
                        ...f,
                        checkIn: selectedDate.date,
                        checkOut: format(addDays(d, 1), "yyyy-MM-dd"),
                      }));
                      setShowNewReservation(true);
                      setSelectedDate(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Ustvari rezervacijo
                  </button>
                )}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Zapri
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal (add payment) */}
      {paymentModalOpen && selectedDate?.reservation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6">
            <h4 className="text-lg font-semibold mb-4">Dodaj plačilo</h4>
            <div className="space-y-3">
              <div>
                <label htmlFor="calendar-payment-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vrsta</label>
                <select
                  id="calendar-payment-type"
                  value={newPayment.type}
                  onChange={(e) => setNewPayment((p) => ({ ...p, type: e.target.value as typeof p.type }))}
                  aria-label="Vrsta plačila"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                >
                  <option value="deposit">Akontacija</option>
                  <option value="balance">Stanje</option>
                  <option value="tourist_tax">Turistična taksa</option>
                  <option value="extra">Dodatno</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-payment-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Znesek (€)</label>
                <input
                  id="new-payment-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  aria-label="Znesek plačila v evrih"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new-payment-method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Način</label>
                <select
                  id="new-payment-method"
                  aria-label="Način plačila"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment((p) => ({ ...p, method: e.target.value as typeof p.method }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                >
                  <option value="cash">Gotovina</option>
                  <option value="card">Kartica</option>
                  <option value="transfer">Nakazilo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setPaymentModalOpen(false); setNewPayment({ type: "deposit", amount: "", method: "cash" }); }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Prekliči
              </button>
              <button
                onClick={async () => {
                  const amount = parseFloat(newPayment.amount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error("Vnesite veljaven znesek");
                    return;
                  }
                  setAddPaymentLoading(true);
                  try {
                    const res = await fetch(`/api/tourism/reservations/${selectedDate.reservation!.id}/payments`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: newPayment.type,
                        amount,
                        method: newPayment.method,
                      }),
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    toast.success("Plačilo dodano");
                    setPaymentModalOpen(false);
                    setNewPayment({ type: "deposit", amount: "", method: "cash" });
                    const payRes = await fetch(`/api/tourism/reservations/${selectedDate.reservation!.id}/payments`);
                    const payData = await payRes.json();
                    if (!payData.error) {
                      setPaymentsData({
                        payments: payData.payments ?? [],
                        totalPaid: payData.totalPaid ?? 0,
                        totalDue: payData.totalDue ?? 0,
                        outstanding: payData.outstanding ?? 0,
                        deposit: payData.deposit ?? null,
                        touristTax: payData.touristTax ?? null,
                      });
                    }
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Napaka");
                  } finally {
                    setAddPaymentLoading(false);
                  }
                }}
                disabled={addPaymentLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {addPaymentLoading ? "Dodajam..." : "Dodaj"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {showNewReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova rezervacija</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimpleReservationMode((v) => !v)}
                  className="text-xs px-2 py-1 rounded-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-pressed={!simpleReservationMode}
                >
                  {simpleReservationMode ? "Enostavni" : "Napredni"} način
                </button>
                <button onClick={() => { setShowNewReservation(false); setCreateConflict(null); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="new-res-checkin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prihod</label>
                  <input
                    id="new-res-checkin"
                    type="date"
                    aria-label="Datum prihoda"
                    value={newReservationForm.checkIn}
                    onChange={(e) => setNewReservationForm((f) => ({ ...f, checkIn: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="new-res-checkout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odhod</label>
                  <input
                    id="new-res-checkout"
                    type="date"
                    aria-label="Datum odhoda"
                    value={newReservationForm.checkOut}
                    onChange={(e) => setNewReservationForm((f) => ({ ...f, checkOut: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ime gosta</label>
                <input
                  type="text"
                  aria-label="Ime gosta"
                  value={newReservationForm.guestName}
                  onChange={(e) => setNewReservationForm((f) => ({ ...f, guestName: e.target.value }))}
                  placeholder="Ime"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new-res-guest-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-pošta</label>
                <input
                  id="new-res-guest-email"
                  type="email"
                  value={newReservationForm.guestEmail}
                  onChange={(e) => setNewReservationForm((f) => ({ ...f, guestEmail: e.target.value }))}
                  placeholder="email@example.com"
                  aria-label="E-pošta gosta"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              {!simpleReservationMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={newReservationForm.guestPhone}
                    onChange={(e) => setNewReservationForm((f) => ({ ...f, guestPhone: e.target.value }))}
                    placeholder="+386 ..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                </div>
              )}
              {!simpleReservationMode && (
                <>
                  <div>
                    <label htmlFor="new-res-channel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kanal</label>
                    <select
                      id="new-res-channel"
                      value={newReservationForm.channel}
                      onChange={(e) => setNewReservationForm((f) => ({ ...f, channel: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                      aria-label="Kanal rezervacije"
                    >
                      <option value="direct">Direct</option>
                      <option value="booking.com">Booking.com</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="expedia">Expedia</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celotna cena (€)</label>
                      <input
                        type="number"
                        aria-label="Celotna cena (€)"
                        step="0.01"
                        value={newReservationForm.totalAmount}
                        onChange={(e) => setNewReservationForm((f) => ({ ...f, totalAmount: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-res-deposit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Akontacija (€)</label>
                      <input
                        id="new-res-deposit"
                        type="number"
                        step="0.01"
                        value={newReservationForm.deposit}
                        onChange={(e) => setNewReservationForm((f) => ({ ...f, deposit: e.target.value }))}
                        placeholder="0"
                        aria-label="Akontacija v evrih"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turistična taksa (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newReservationForm.touristTax}
                        onChange={(e) => setNewReservationForm((f) => ({ ...f, touristTax: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                      />
                    </div>
                  </div>
                </>
              )}
              {simpleReservationMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celotna cena (€) – avtomatsko</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newReservationForm.totalAmount}
                    onChange={(e) => setNewReservationForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="Izračunano ob vnosu datumov"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                </div>
              )}
              {!simpleReservationMode && (
                <div>
                  <label htmlFor="new-res-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opombe</label>
                  <textarea
                    id="new-res-notes"
                    value={newReservationForm.notes}
                    onChange={(e) => setNewReservationForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Opombe za rezervacijo"
                    aria-label="Opombe za rezervacijo"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                </div>
              )}
            </div>
            {createConflict && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{createConflict.message} Ustvari vseeno?</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setCreateConflict(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Prekliči
                  </button>
                  <button
                    onClick={() => doCreateReservation(true)}
                    disabled={createReservationLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    Ustvari vseeno
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={fetchPriceForNewReservation}
                disabled={!activePropertyId || !newReservationForm.checkIn || !newReservationForm.checkOut}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Izračunaj ceno
              </button>
              <button
                onClick={() => doCreateReservation(false)}
                disabled={createReservationLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createReservationLoading ? "Ustvarjam..." : "Ustvari rezervacijo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk uvoz rezervacij</h3>
              <button onClick={() => setBulkImportOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              CSV: checkIn, checkOut, guestName, guestEmail, guestPhone, channel, totalAmount, notes
            </p>
            <div className="flex gap-2 mb-3">
              <label className="flex items-center gap-2">
                <input type="radio" checked={bulkFormat === "csv"} onChange={() => setBulkFormat("csv")} />
                CSV
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={bulkFormat === "json"} onChange={() => setBulkFormat("json")} />
                JSON
              </label>
            </div>
            <div
              className={`mb-3 rounded-xl border-2 border-dashed p-6 transition-colors ${bulkDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"}`}
              onDragOver={(e) => { e.preventDefault(); setBulkDragOver(true); }}
              onDragLeave={() => setBulkDragOver(false)}
              onDrop={handleBulkDrop}
            >
              <label htmlFor="calendar-bulk-file" className="cursor-pointer block text-center text-sm text-gray-600 dark:text-gray-400">
                Povleci in spusti datoteko sem ali <span className="text-blue-600 dark:text-blue-400 font-medium">izberi datoteko</span>
              </label>
              <input id="calendar-bulk-file" type="file" accept=".csv,.json,.txt" onChange={handleBulkFileSelect} className="sr-only" aria-label="Izberi datoteko za uvoz" />
            </div>
            <label htmlFor="calendar-bulk-data" className="sr-only">Vnos podatkov za uvoz</label>
            <textarea
              id="calendar-bulk-data"
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder={bulkFormat === "csv" ? "2025-03-01, 2025-03-05, Janez Novak, janez@example.com, ..." : '{"reservations": [{"checkIn": "2025-03-01", "checkOut": "2025-03-05", "guestName": "Janez"}]}'}
              rows={8}
              aria-label="Vnos podatkov za uvoz"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm font-mono"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={runBulkImport}
                disabled={bulkLoading || !bulkData.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {bulkLoading ? "Uvozam..." : "Uvozi"}
              </button>
              <button onClick={() => setBulkImportOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                Zapri
              </button>
            </div>
            {bulkResult && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium">Rezultat: uvoženo {bulkResult.imported}, preskočeno {bulkResult.skipped}</p>
                {bulkResult.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                    {bulkResult.errors.map((e, i) => (
                      <li key={i}>Vrstica {e.row}: {e.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* iCal Sync */}
      {(icalSyncOpen || icalFeedUrl) && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">🔗 iCal Sinhronizacija</h3>
            <button onClick={() => { setIcalSyncOpen(false); setIcalFeedUrl(null); setIcalInstructions(null); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
          </div>
          {icalLoading && <p className="text-sm text-gray-500">Generiranje povezave...</p>}
          {icalFeedUrl && !icalLoading && (
            <>
              <div className="flex gap-2">
                <input readOnly value={icalFeedUrl} aria-label="iCal URL za sinhronizacijo" title="iCal URL za sinhronizacijo koledarja" placeholder="iCal URL" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
                <button onClick={copyIcalUrl} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Kopiraj</button>
              </div>
              {icalInstructions && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Navodila po platformah:</p>
                  <div className="grid gap-2">
                    <div className="p-2 rounded-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <span className="font-medium">Booking.com:</span> Rates &amp; Availability → Calendar Sync → Import by URL
                    </div>
                    <div className="p-2 rounded-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <span className="font-medium">Airbnb:</span> Calendar → Sync calendars → Import
                    </div>
                    <div className="p-2 rounded-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <span className="font-medium">Google Calendar:</span> Add calendar → From URL
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    gray: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
