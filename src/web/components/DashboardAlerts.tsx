"use client";

import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState } from "react";

export interface DashboardAlert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
}

interface DashboardAlertsProps {
  alerts: DashboardAlert[];
  onDismiss?: (id: string) => void;
}

export function DashboardAlerts({ alerts, onDismiss }: DashboardAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
    if (onDismiss) onDismiss(id);
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  const typeConfig = {
    error: {
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-800 dark:text-red-200",
      icon: "🚨",
    },
    warning: {
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      textColor: "text-amber-800 dark:text-amber-200",
      icon: "⚠️",
    },
    info: {
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-800 dark:text-blue-200",
      icon: "ℹ️",
    },
  };

  return (
    <div className="space-y-3 mb-8">
      {visibleAlerts.map((alert) => {
        const config = typeConfig[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-4 p-4 rounded-xl border ${config.bgColor} ${config.borderColor} ${config.textColor}`}
          >
            <span className="text-xl mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(alert.timestamp).toLocaleString("sl-SI")}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
