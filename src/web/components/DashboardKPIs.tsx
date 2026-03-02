"use client";

interface DashboardKPIsProps {
  summary: {
    totalRevenue: number;
    occupancyRate: number;
    totalBookings: number;
    avgStayLength: number;
  } | null;
  loading?: boolean;
}

export function DashboardKPIs({ summary, loading }: DashboardKPIsProps) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Skupni prihodki",
      value: `${summary.totalRevenue.toLocaleString("sl-SI")} €`,
      emoji: "💰",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Zasedenost",
      value: `${summary.occupancyRate}%`,
      emoji: "📈",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Rezervacije",
      value: summary.totalBookings,
      emoji: "📅",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Povprečno bivanje",
      value: `${summary.avgStayLength} dni`,
      emoji: "👥",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${kpi.bgColor}`}>
              {kpi.emoji}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
