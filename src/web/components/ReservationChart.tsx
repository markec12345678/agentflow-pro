"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface ReservationChartProps {
  data: {
    direct: number;
    bookingcom: number;
    airbnb: number;
    expedia: number;
    other: number;
  } | null;
  loading?: boolean;
}

export function ReservationChart({ data, loading }: ReservationChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse">
        <span className="text-gray-400">Nalaganje grafa...</span>
      </div>
    );
  }

  // Empty state - no data
  const total = data.direct + data.bookingcom + data.airbnb + data.expedia + data.other;
  if (!data || total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center p-6">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Še ni rezervacij
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ko boste dodali rezervacije, boste tukaj videli vir bookings.
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Direktne", value: data.direct, color: "#3b82f6" },
    { name: "Booking.com", value: data.bookingcom, color: "#1e3a8a" },
    { name: "Airbnb", value: data.airbnb, color: "#ff5a5f" },
    { name: "Expedia", value: data.expedia, color: "#ffc400" },
    { name: "Drugo", value: data.other, color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  // Group into Auto (OTA) vs Manual (Direct)
  const groupData = [
    { name: "Avtomatske (OTA)", value: data.bookingcom + data.airbnb + data.expedia + data.other, color: "#10b981" },
    { name: "Ročne / Direktne", value: data.direct, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={groupData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {groupData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
