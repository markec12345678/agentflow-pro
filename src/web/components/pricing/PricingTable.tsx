"use client";

import { PLANS, type PlanId } from "@/stripe/plans";

interface PricingTableProps {
  onSelectPlan?: (planId: PlanId) => void;
  isLoading?: boolean;
}

export function PricingTable({ onSelectPlan, isLoading }: PricingTableProps) {
  const plans = Object.values(PLANS);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md ${plan.id === "pro"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500"
              : "border-gray-200 bg-white"
            }`}
        >
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="mt-2 text-3xl font-bold">
            ${plan.priceMonthly}
            <span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {plan.agentRunsLimit} agent runs / month
          </p>
          <button
            onClick={() => onSelectPlan?.(plan.id)}
            disabled={isLoading}
            className={`mt-4 w-full rounded-lg px-4 py-2 font-medium transition-colors ${plan.id === "pro"
                ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:bg-gray-300"
              }`}
          >
            {isLoading ? "Loading..." : "Get Started"}
          </button>
        </div>
      ))}
    </div>
  );
}
