"use client";

import { useState } from "react";
import { PricingTable } from "@/web/components/pricing/PricingTable";
import type { PlanId } from "@/stripe/plans";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: PlanId) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "Checkout failed");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-2 text-3xl font-bold">Pricing</h1>
      <p className="mb-8 text-gray-600">
        Choose the plan that fits your team. All plans include full access to
        AgentFlow Pro.
      </p>
      <PricingTable onSelectPlan={handleSelectPlan} isLoading={isLoading} />
    </main>
  );
}
