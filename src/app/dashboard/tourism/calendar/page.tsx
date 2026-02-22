"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
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
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);

  useEffect(() => {
    if (activePropertyId) {
      fetchCalendar();
    }
  }, [activePropertyId, currentDate]);

  const fetchCalendar = async () => {
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
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "booked":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "check-in":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400";
      case "check-out":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-2 border-orange-400";
      case "blocked":
        return "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
      default:
        return "bg-white dark:bg-gray-800";
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
            onClick={() => setShowNewReservation(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            + Nova rezervacija
          </button>
          <a
            href={`/api/tourism/ical/export?propertyId=${activePropertyId}&token=demo`}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            📥 iCal Export
          </a>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
          <span>Prosto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
          <span>Zasedeno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400" />
          <span>Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400" />
          <span>Check-out</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 border border-gray-400" />
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
                    className={`min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      day.day > 0 ? getStatusColor(day.status) : "bg-gray-50 dark:bg-gray-800/50"
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
                    <div className="capitalize">{selectedDate.reservation.channel}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Znesek</div>
                    <div>€{selectedDate.reservation.totalAmount}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Zapri
                  </button>
                  <button
                    onClick={() => {
                      // Edit reservation logic
                      toast.success("Funkcionalnost v pripravi");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Uredi
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

      {/* iCal Sync Info */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2">🔗 iCal Sinhronizacija</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Povežite koledar z Airbnb, Booking.com in drugimi platformami.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toast.success("iCal URL kopiran v odložišče")}
            className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50"
          >
            Kopiraj iCal URL
          </button>
          <button
            onClick={() => toast.success("Navodila poslana na email")}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Nastavi sinhronizacijo
          </button>
        </div>
      </div>
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
