"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { DollarSign, Calendar, TrendingUp, Settings, Plus, Edit, Save, X, Percent, Clock } from "lucide-react";

interface Property {
  id: string;
  name: string;
  basePrice?: number | null;
  currency?: string | null;
  seasonRates?: any;
  pricingRules?: any;
}

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    basePrice: "",
    currency: "EUR",
    seasonRates: {
      high: [] as Array<{ from: string; to: string; rate: string }>,
      mid: [] as Array<{ from: string; to: string; rate: string }>,
      low: [] as Array<{ from: string; to: string; rate: string }>
    },
    pricingRules: {
      weekendFactor: "1.2",
      minStay: "1",
      earlyBird: { days: "30", discount: "0.1" },
      lastMinute: { days: "3", discount: "0.15" }
    }
  });

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
        
        // Initialize form with existing data
        const prop = data.property;
        setPricingForm({
          basePrice: prop.basePrice?.toString() || "",
          currency: prop.currency || "EUR",
          seasonRates: prop.seasonRates || {
            high: [], mid: [], low: []
          },
          pricingRules: prop.pricingRules || {
            weekendFactor: "1.2",
            minStay: "1",
            earlyBird: { days: "30", discount: "0.1" },
            lastMinute: { days: "3", discount: "0.15" }
          }
        });
      }
    } catch (error) {
      toast.error("Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    try {
      const payload = {
        basePrice: pricingForm.basePrice ? parseFloat(pricingForm.basePrice) : null,
        currency: pricingForm.currency,
        seasonRates: pricingForm.seasonRates,
        pricingRules: pricingForm.pricingRules
      };

      const response = await fetch(`/api/tourism/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Pricing updated successfully");
        setEditing(false);
        fetchProperty();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update pricing");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const addSeasonRate = (season: keyof typeof pricingForm.seasonRates) => {
    const newRate = { from: "", to: "", rate: "" };
    setPricingForm(prev => ({
      ...prev,
      seasonRates: {
        ...prev.seasonRates,
        [season]: [...prev.seasonRates[season], newRate]
      }
    }));
  };

  const removeSeasonRate = (season: keyof typeof pricingForm.seasonRates, index: number) => {
    setPricingForm(prev => ({
      ...prev,
      seasonRates: {
        ...prev.seasonRates,
        [season]: prev.seasonRates[season].filter((_, i) => i !== index)
      }
    }));
  };

  const updateSeasonRate = (season: keyof typeof pricingForm.seasonRates, index: number, field: string, value: string) => {
    setPricingForm(prev => ({
      ...prev,
      seasonRates: {
        ...prev.seasonRates,
        [season]: prev.seasonRates[season].map((rate, i) => 
          i === index ? { ...rate, [field]: value } : rate
        )
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing</h1>
              <p className="text-gray-600 mt-2">Manage your property pricing and rates</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Pricing
              </button>
            )}
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Base Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {property?.basePrice ? `${property.basePrice} ${property?.currency || "EUR"}` : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Season Rates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {property?.seasonRates ? "Configured" : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pricing Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {property?.pricingRules ? "Active" : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pricing Configuration</h2>
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={savePricing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchProperty();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Base Pricing */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Base Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (per night)</label>
                  <input
                    type="number"
                    value={pricingForm.basePrice}
                    onChange={(e) => setPricingForm({ ...pricingForm, basePrice: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={pricingForm.currency}
                    onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (Fr)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seasonal Rates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Seasonal Rates
              </h3>
              <div className="space-y-4">
                {(["high", "mid", "low"] as const).map((season) => (
                  <div key={season} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium capitalize">{season} Season</h4>
                      {editing && (
                        <button
                          onClick={() => addSeasonRate(season)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Rate
                        </button>
                      )}
                    </div>
                    
                    {pricingForm.seasonRates[season].length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No {season} season rates configured</p>
                    ) : (
                      <div className="space-y-2">
                        {pricingForm.seasonRates[season].map((rate, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="date"
                              value={rate.from}
                              onChange={(e) => updateSeasonRate(season, index, "from", e.target.value)}
                              disabled={!editing}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-50"
                            />
                            <input
                              type="date"
                              value={rate.to}
                              onChange={(e) => updateSeasonRate(season, index, "to", e.target.value)}
                              disabled={!editing}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-50"
                            />
                            <input
                              type="number"
                              value={rate.rate}
                              onChange={(e) => updateSeasonRate(season, index, "rate", e.target.value)}
                              disabled={!editing}
                              className="w-24 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-50"
                              placeholder="Rate"
                              step="0.01"
                            />
                            {editing && (
                              <button
                                onClick={() => removeSeasonRate(season, index)}
                                className="px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Rules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Pricing Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Weekend Factor
                  </label>
                  <input
                    type="number"
                    value={pricingForm.pricingRules.weekendFactor}
                    onChange={(e) => setPricingForm({
                      ...pricingForm,
                      pricingRules: { ...pricingForm.pricingRules, weekendFactor: e.target.value }
                    })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    step="0.1"
                    placeholder="1.2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Multiplier for weekend rates</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Minimum Stay
                  </label>
                  <input
                    type="number"
                    value={pricingForm.pricingRules.minStay}
                    onChange={(e) => setPricingForm({
                      ...pricingForm,
                      pricingRules: { ...pricingForm.pricingRules, minStay: e.target.value }
                    })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    min="1"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum nights required</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Percent className="w-4 h-4 mr-1" />
                    Early Bird Discount
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pricingForm.pricingRules.earlyBird.days}
                      onChange={(e) => setPricingForm({
                        ...pricingForm,
                        pricingRules: {
                          ...pricingForm.pricingRules,
                          earlyBird: { ...pricingForm.pricingRules.earlyBird, days: e.target.value }
                        }
                      })}
                      disabled={!editing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Days"
                      min="1"
                    />
                    <input
                      type="number"
                      value={pricingForm.pricingRules.earlyBird.discount}
                      onChange={(e) => setPricingForm({
                        ...pricingForm,
                        pricingRules: {
                          ...pricingForm.pricingRules,
                          earlyBird: { ...pricingForm.pricingRules.earlyBird, discount: e.target.value }
                        }
                      })}
                      disabled={!editing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Discount"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Days before check-in / discount</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Last Minute Discount
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pricingForm.pricingRules.lastMinute.days}
                      onChange={(e) => setPricingForm({
                        ...pricingForm,
                        pricingRules: {
                          ...pricingForm.pricingRules,
                          lastMinute: { ...pricingForm.pricingRules.lastMinute, days: e.target.value }
                        }
                      })}
                      disabled={!editing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Days"
                      min="1"
                    />
                    <input
                      type="number"
                      value={pricingForm.pricingRules.lastMinute.discount}
                      onChange={(e) => setPricingForm({
                        ...pricingForm,
                        pricingRules: {
                          ...pricingForm.pricingRules,
                          lastMinute: { ...pricingForm.pricingRules.lastMinute, discount: e.target.value }
                        }
                      })}
                      disabled={!editing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Discount"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Days before check-in / discount</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
