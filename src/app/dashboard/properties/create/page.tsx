"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useEturizemSync } from "@/hooks/use-eturizem-sync";

interface PropertyForm {
  name: string;
  location: string;
  type: string;
  capacity: string;
  description: string;
  basePrice: string;
  currency: string;
  eturizemId: string;
  rnoId: string;
  // Advanced pricing
  seasonRates: {
    high: { from: string; to: string; rate: string }[];
    mid: { from: string; to: string; rate: string }[];
    low: { from: string; to: string; rate: string }[];
  };
  pricingRules: {
    weekendFactor: string;
    minStay: string;
    earlyBird: { days: string; discount: string };
    lastMinute: { days: string; discount: string };
  };
  autoApproval: {
    enabled: boolean;
    channels: string[];
    maxAmount: string;
  };
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { triggerSync } = useEturizemSync();
  
  const [form, setForm] = useState<PropertyForm>({
    name: "",
    location: "",
    type: "hotel",
    capacity: "",
    description: "",
    basePrice: "",
    currency: "EUR",
    eturizemId: "",
    rnoId: "",
    seasonRates: {
      high: [],
      mid: [],
      low: []
    },
    pricingRules: {
      weekendFactor: "1.2",
      minStay: "1",
      earlyBird: { days: "30", discount: "0.1" },
      lastMinute: { days: "3", discount: "0.15" }
    },
    autoApproval: {
      enabled: true,
      channels: ["direct"],
      maxAmount: "500"
    }
  });

  const handleInputChange = (field: keyof PropertyForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: keyof PropertyForm, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || null,
        type: form.type.trim() || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        description: form.description.trim() || null,
        basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
        currency: form.currency.trim() || null,
        eturizemId: form.eturizemId.trim() || null,
        rnoId: form.rnoId ? parseInt(form.rnoId) : null,
        seasonRates: showAdvanced ? form.seasonRates : null,
        pricingRules: showAdvanced ? form.pricingRules : null,
        reservationAutoApprovalRules: showAdvanced ? form.autoApproval : null,
      };

      const response = await fetch("/api/tourism/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const property = await response.json();
        toast.success("Property created successfully!");
        
        // Trigger eTurizem sync if configured
        if (form.eturizemId.trim()) {
          try {
            await triggerSync([property.id]);
          } catch (syncError) {
            console.error("eTurizem sync failed:", syncError);
            toast.warning("Property created but eTurizem sync failed");
          }
        }
        
        router.push(`/dashboard/properties/${property.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create property");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addSeasonRate = (season: keyof typeof form.seasonRates) => {
    const newRate = { from: "", to: "", rate: "" };
    handleNestedChange("seasonRates", season, [...form.seasonRates[season], newRate]);
  };

  const removeSeasonRate = (season: keyof typeof form.seasonRates, index: number) => {
    const rates = [...form.seasonRates[season]];
    rates.splice(index, 1);
    handleNestedChange("seasonRates", season, rates);
  };

  const updateSeasonRate = (season: keyof typeof form.seasonRates, index: number, field: string, value: string) => {
    const rates = [...form.seasonRates[season]];
    rates[index] = { ...rates[index], [field]: value };
    handleNestedChange("seasonRates", season, rates);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Properties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
          <p className="text-gray-600 mt-2">Add your hotel, apartment, or accommodation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hotel Bled"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bled, Slovenia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hotel">Hotel</option>
                  <option value="apartment">Apartment</option>
                  <option value="resort">Resort</option>
                  <option value="guesthouse">Guest House</option>
                  <option value="villa">Villa</option>
                  <option value="hostel">Hostel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Capacity
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                  min="1"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your property, amenities, and unique features..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (per night)
                </label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => handleInputChange("basePrice", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF (Fr)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Integrations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  eTurizem ID
                </label>
                <input
                  type="text"
                  value={form.eturizemId}
                  onChange={(e) => handleInputChange("eturizemId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional eTurizem property ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AJPES RNO ID
                </label>
                <input
                  type="number"
                  value={form.rnoId}
                  onChange={(e) => handleInputChange("rnoId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional AJPES registration number"
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Advanced Settings</h2>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-6">
                {/* Seasonal Rates */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Seasonal Rates</h3>
                  {(["high", "mid", "low"] as const).map((season) => (
                    <div key={season} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="capitalize font-medium">{season} Season</h4>
                        <button
                          type="button"
                          onClick={() => addSeasonRate(season)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          + Add Rate
                        </button>
                      </div>
                      {form.seasonRates[season].map((rate, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="date"
                            value={rate.from}
                            onChange={(e) => updateSeasonRate(season, index, "from", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="date"
                            value={rate.to}
                            onChange={(e) => updateSeasonRate(season, index, "to", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            value={rate.rate}
                            onChange={(e) => updateSeasonRate(season, index, "rate", e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                            placeholder="Rate"
                          />
                          <button
                            type="button"
                            onClick={() => removeSeasonRate(season, index)}
                            className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Pricing Rules */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Pricing Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weekend Factor
                      </label>
                      <input
                        type="number"
                        value={form.pricingRules.weekendFactor}
                        onChange={(e) => handleNestedChange("pricingRules", "weekendFactor", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        step="0.1"
                        placeholder="1.2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Stay
                      </label>
                      <input
                        type="number"
                        value={form.pricingRules.minStay}
                        onChange={(e) => handleNestedChange("pricingRules", "minStay", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1"
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Approval */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Auto Approval Rules</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoApproval"
                        checked={form.autoApproval.enabled}
                        onChange={(e) => handleNestedChange("autoApproval", "enabled", e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="autoApproval" className="text-sm font-medium">
                        Enable automatic approval
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum amount for auto-approval
                      </label>
                      <input
                        type="number"
                        value={form.autoApproval.maxAmount}
                        onChange={(e) => handleNestedChange("autoApproval", "maxAmount", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/properties">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
