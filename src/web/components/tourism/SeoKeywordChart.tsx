"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartDataItem = { name: string; position: number; volume: number };

export function SeoKeywordChart({ data }: { data: ChartDataItem[] }) {
  if (data.length === 0) return null;
  return (
    <div className="h-64 min-h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tw-bg-opacity)",
              border: "1px solid var(--tw-border-color)",
              borderRadius: "0.5rem",
            }}
          />
          <Bar dataKey="volume" fill="#3b82f6" name="Volume" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
