/**
 * Branding Settings Component
 * Manage custom branding: logo, colors, fonts, white-label
 */

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Save, RotateCcw, Image as ImageIcon } from "lucide-react";

interface Branding {
  id: string;
  userId: string;
  logoUrl: string | null;
  logoSmall: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  removeAgentFlowBranding: boolean;
  customDomain: string | null;
  customCSS: string | null;
}

export default function BrandingSettings() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [formData, setFormData] = useState({
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#60A5FA",
    fontFamily: "Inter",
    removeAgentFlowBranding: false,
    customDomain: "",
    customCSS: "",
  });

  // Load branding on mount
  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const res = await fetch("/api/branding");
      const data = await res.json();

      if (data.branding) {
        setBranding(data.branding);
        setFormData({
          primaryColor: data.branding.primaryColor || "#3B82F6",
          secondaryColor: data.branding.secondaryColor || "#1E40AF",
          accentColor: data.branding.accentColor || "#60A5FA",
          fontFamily: data.branding.fontFamily || "Inter",
          removeAgentFlowBranding: data.branding.removeAgentFlowBranding || false,
          customDomain: data.branding.customDomain || "",
          customCSS: data.branding.customCSS || "",
        });
      }
    } catch (error) {
      logger.error("Failed to load branding:", error);
      toast.error("Napaka pri nalaganju branding nastavitev");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "main" | "small"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Prosim naložite slikovno datoteko");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datoteka mora biti manjša od 5MB");
      return;
    }

    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);
      formData.append("type", type);

      const res = await fetch("/api/v1/infrastructure/logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        if (type === "main") {
          setFormData((prev) => ({ ...prev, logoUrl: data.logoUrl }));
        } else {
          setFormData((prev) => ({ ...prev, logoSmall: data.logoUrl }));
        }
        toast.success("Logo uspešno naložen");
      } else {
        toast.error(data.error || "Napaka pri nalaganju logotipa");
      }
    } catch (error) {
      logger.error("Logo upload error:", error);
      toast.error("Napaka pri nalaganju logotipa");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.branding) {
        setBranding(data.branding);
        toast.success("Branding nastavitve shranjene");
      } else {
        toast.error(data.error || "Napaka pri shranjevanju");
      }
    } catch (error) {
      logger.error("Save branding error:", error);
      toast.error("Napaka pri shranjevanju branding nastavitev");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      accentColor: "#60A5FA",
      fontFamily: "Inter",
      removeAgentFlowBranding: false,
      customDomain: "",
      customCSS: "",
    });
    toast.info("Nastavitve ponastavljene na privzete");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Nalaganje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🎨 Branding Nastavitve
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Prilagodite videz vaše aplikacije z lastnim logotipom, barvami in
          blagovno znamko.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📷 Logotipi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Glavni logotip
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              {formData.logoUrl ? (
                <div className="mb-4">
                  <img
                    src={formData.logoUrl}
                    alt="Main Logo"
                    className="max-h-32 mx-auto"
                  />
                </div>
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              )}
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700">
                  Naloži logotip
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, "main")}
                  className="hidden"
                  disabled={logoUploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG do 5MB (priporočeno 500x200px)
              </p>
            </div>
          </div>

          {/* Small Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mali logotip (za email)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              {formData.logoSmall ? (
                <div className="mb-4">
                  <img
                    src={formData.logoSmall}
                    alt="Small Logo"
                    className="max-h-16 mx-auto"
                  />
                </div>
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              )}
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700">
                  Naloži mali logotip
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, "small")}
                  className="hidden"
                  disabled={logoUploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG do 1MB (priporočeno 200x100px)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎨 Barve
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primarna barva
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="#3B82F6"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Glavna barva gumbov in linkov</p>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sekundarna barva
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="#1E40AF"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Barva headerjev in naslovov</p>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poudarna barva
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="#60A5FA"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Poudarki in obvestila</p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Predogled:
          </p>
          <div className="flex gap-4">
            <div
              className="w-24 h-12 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: formData.primaryColor }}
            >
              Primary
            </div>
            <div
              className="w-24 h-12 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: formData.secondaryColor }}
            >
              Secondary
            </div>
            <div
              className="w-24 h-12 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: formData.accentColor }}
            >
              Accent
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔤 Tipografija
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Family
          </label>
          <select
            value={formData.fontFamily}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fontFamily: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
            <option value="Montserrat">Montserrat</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Izbira glavnega fonta za vso aplikacijo
          </p>
        </div>
      </div>

      {/* White-label Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🏷️ White-label Opcije
        </h2>

        <div className="space-y-4">
          {/* Remove AgentFlow Branding */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Odstrani "Powered by AgentFlow Pro"
              </label>
              <p className="text-xs text-gray-500">
                Skrij AgentFlow branding iz emailov in footerja
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.removeAgentFlowBranding}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    removeAgentFlowBranding: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Domain
            </label>
            <input
              type="text"
              value={formData.customDomain}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customDomain: e.target.value }))
              }
              placeholder="app.yourcompany.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vaša lastna domena za aplikacijo (zahteva DNS konfiguracijo)
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💻 Custom CSS
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom CSS Code
          </label>
          <textarea
            value={formData.customCSS}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, customCSS: e.target.value }))
            }
            placeholder="/* Vaš custom CSS */&#10;.custom-class {&#10;  color: red;&#10;}"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Dodajte custom CSS za popolno prilagoditev (advanced users)
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? "Shranjevanje..." : "Shrani nastavitve"}
        </button>

        <button
          onClick={handleReset}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Ponastavi
        </button>
      </div>

      {/* Preview */}
      {branding && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            👁️ Predogled
          </h3>

          <div className="space-y-4">
            {/* Logo Preview */}
            {formData.logoUrl && (
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <img
                  src={formData.logoUrl}
                  alt="Logo Preview"
                  className="max-h-24 mx-auto"
                />
              </div>
            )}

            {/* Button Preview */}
            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded text-white font-medium"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="px-6 py-2 rounded text-white font-medium"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secondary Button
              </button>
            </div>

            {/* Email Preview */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Email Footer Preview:
              </p>
              {formData.logoSmall ? (
                <img
                  src={formData.logoSmall}
                  alt="Email Logo"
                  className="h-10 mb-2"
                />
              ) : (
                <p className="text-sm font-medium mb-2">Your Company Name</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.removeAgentFlowBranding
                  ? "© 2026 Your Company. All rights reserved."
                  : "© 2026 Your Company. Powered by AgentFlow Pro"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
