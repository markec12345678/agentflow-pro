"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface PricingSettings {
  dynamicPricingEnabled: boolean;
  competitorBasedPricing: boolean;
  competitorAdjustment: number;
  minPrice: number | null;
  maxPrice: number | null;
  weekendMultiplier: number;
  lastMinuteDiscount: number;
  earlyBirdDiscount: number;
  seasonRates: {
    high?: number;
    mid?: number;
    low?: number;
  } | null;
  basePrice: number | null;
}

export default function DynamicPricingPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PricingSettings | null>(null);

  // Fetch settings when property changes
  useEffect(() => {
    if (activePropertyId) {
      fetchSettings();
    } else {
      setSettings(null);
    }
  }, [activePropertyId]);

  const fetchSettings = async () => {
    if (!activePropertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/dynamic-pricing/settings?propertyId=${activePropertyId}`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      toast.error("Napaka pri nalaganju nastavitev");
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activePropertyId || !settings) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tourism/dynamic-pricing/settings?propertyId=${activePropertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Nastavitve shranjene");
    } catch (error) {
      toast.error("Napaka pri shranjevanju");
      logger.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof PricingSettings>(key: K, value: PricingSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const updateSeasonRate = (type: "high" | "mid" | "low", value: number | null) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            seasonRates: {
              ...prev.seasonRates,
              [type]: value ?? undefined,
            },
          }
        : null
    );
  };

  if (!activePropertyId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dinamično določanje cen</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Samodejno prilagajanje cen glede na povpraševanje in konkurenco
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
        <div className="p-8 text-center text-gray-500">
          Izberite nastanitev za urejanje cen
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dinamično določanje cen</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Samodejno prilagajanje cen glede na povpraševanje in konkurenco
            </p>
          </div>
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
        <div className="p-8 text-center text-gray-500">Nalaganje...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dinamično določanje cen</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Samodejno prilagajanje cen glede na povpraševanje in konkurenco
            </p>
          </div>
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
        <div className="p-8 text-center text-gray-500">Ni podatkov</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dinamično določanje cen</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Samodejno prilagajanje cen glede na povpraševanje in konkurenco
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      {/* Enable Toggle */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Omogoči dinamično določanje cen
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Samodejno prilagajaj cene glede na sezono, vikende in konkurenco
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dynamicPricingEnabled}
              onChange={(e) => updateSetting("dynamicPricingEnabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Base Price */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Osnovna cena</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Osnovna cena na noč (€)
            </label>
            <input
              type="number"
              value={settings.basePrice ?? ""}
              onChange={(e) => updateSetting("basePrice", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {/* Seasonal Pricing */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Sezonske cene</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visoka sezona (€)
            </label>
            <input
              type="number"
              value={settings.seasonRates?.high ?? ""}
              onChange={(e) => updateSeasonRate("high", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="150"
            />
            <p className="text-xs text-gray-500 mt-1">Julij, avgust, prazniki</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Srednja sezona (€)
            </label>
            <input
              type="number"
              value={settings.seasonRates?.mid ?? ""}
              onChange={(e) => updateSeasonRate("mid", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="120"
            />
            <p className="text-xs text-gray-500 mt-1">Maj, junij, september</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nizka sezona (€)
            </label>
            <input
              type="number"
              value={settings.seasonRates?.low ?? ""}
              onChange={(e) => updateSeasonRate("low", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="80"
            />
            <p className="text-xs text-gray-500 mt-1">November - marec</p>
          </div>
        </div>
      </div>

      {/* Competitor-Based Pricing */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Cene glede na konkurenco</h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.competitorBasedPricing}
              onChange={(e) => updateSetting("competitorBasedPricing", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {settings.competitorBasedPricing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prilagoditev glede na konkurenco (%)
              </label>
              <input
                type="number"
                value={settings.competitorAdjustment}
                onChange={(e) => updateSetting("competitorAdjustment", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pozitivno = dražje od konkurence, negativno = ceneje
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Price Limits */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Omejitve cen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Najnižja cena (€)
            </label>
            <input
              type="number"
              value={settings.minPrice ?? ""}
              onChange={(e) => updateSetting("minPrice", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Najvišja cena (€)
            </label>
            <input
              type="number"
              value={settings.maxPrice ?? ""}
              onChange={(e) => updateSetting("maxPrice", parseFloat(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* Multipliers & Discounts */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Multiplikatorji in popusti</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vikend multiplikator
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.weekendMultiplier}
              onChange={(e) => updateSetting("weekendMultiplier", parseFloat(e.target.value) || 1)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="1.2"
            />
            <p className="text-xs text-gray-500 mt-1">1.2 = 20% dražje ob vikendih</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last-minute popust (%)
            </label>
            <input
              type="number"
              value={settings.lastMinuteDiscount}
              onChange={(e) => updateSetting("lastMinuteDiscount", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">Za rezervacije &lt; 7 dni prej</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Early-bird popust (%)
            </label>
            <input
              type="number"
              value={settings.earlyBirdDiscount}
              onChange={(e) => updateSetting("earlyBirdDiscount", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              placeholder="15"
            />
            <p className="text-xs text-gray-500 mt-1">Za rezervacije &gt; 60 dni prej</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={fetchSettings}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Prekliči
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Shranjevanje..." : "Shrani nastavitve"}
        </button>
      </div>
    </div>
  );
}
