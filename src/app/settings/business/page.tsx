"use client";

import { useState, useEffect } from "react";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Globe, 
  Languages, 
  Save, 
  X, 
  Check, 
  AlertTriangle,
  Info,
  Settings as SettingsIcon,
  User,
  FileText,
  Percent,
  DollarSign,
  Euro,
  PoundSterling,
  Banknote
} from "lucide-react";

// Types
interface BusinessSettings {
  propertyInfo: {
    name: string;
    legalName: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    contact: {
      phone: string;
      email: string;
      website: string;
    };
    taxId: string;
    registrationNumber: string;
  };
  businessHours: {
    checkIn: {
      start: string;
      end: string;
    };
    checkOut: {
      start: string;
      end: string;
    };
    reception: {
      monday: { open: string; close: string; enabled: boolean };
      tuesday: { open: string; close: string; enabled: boolean };
      wednesday: { open: string; close: string; enabled: boolean };
      thursday: { open: string; close: string; enabled: boolean };
      friday: { open: string; close: string; enabled: boolean };
      saturday: { open: string; close: string; enabled: boolean };
      sunday: { open: string; close: string; enabled: boolean };
    };
  };
  policies: {
    cancellation: {
      freeCancellationDays: number;
      cancellationFee: number;
      noShowFee: number;
      description: string;
    };
    payment: {
      depositRequired: boolean;
      depositPercentage: number;
      paymentMethods: string[];
      paymentDueDays: number;
      currency: string;
    };
  };
  taxSettings: {
    vatEnabled: boolean;
    vatRate: number;
    taxId: string;
    taxName: string;
    includeTaxInPrices: boolean;
  };
  localization: {
    defaultCurrency: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
}

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    propertyInfo: {
      name: "Hotel Alpina",
      legalName: "Alpina d.o.o.",
      address: {
        street: "Cankarjeva ulica 5",
        city: "Ljubljana",
        postalCode: "1000",
        country: "Slovenija"
      },
      contact: {
        phone: "+386 1 234 5678",
        email: "info@hotel-alpina.si",
        website: "https://www.hotel-alpina.si"
      },
      taxId: "SI12345678",
      registrationNumber: "6045789000"
    },
    businessHours: {
      checkIn: { start: "14:00", end: "22:00" },
      checkOut: { start: "07:00", end: "11:00" },
      reception: {
        monday: { open: "06:00", close: "23:00", enabled: true },
        tuesday: { open: "06:00", close: "23:00", enabled: true },
        wednesday: { open: "06:00", close: "23:00", enabled: true },
        thursday: { open: "06:00", close: "23:00", enabled: true },
        friday: { open: "06:00", close: "23:00", enabled: true },
        saturday: { open: "06:00", close: "23:00", enabled: true },
        sunday: { open: "06:00", close: "23:00", enabled: true }
      }
    },
    policies: {
      cancellation: {
        freeCancellationDays: 2,
        cancellationFee: 25,
        noShowFee: 100,
        description: "Free cancellation up to 2 days before check-in. After that, 25% of the total price. No-show fee is 100% of the total price."
      },
      payment: {
        depositRequired: true,
        depositPercentage: 30,
        paymentMethods: ["credit_card", "bank_transfer", "cash"],
        paymentDueDays: 14,
        currency: "EUR"
      }
    },
    taxSettings: {
      vatEnabled: true,
      vatRate: 22,
      taxId: "SI12345678",
      taxName: "DDV",
      includeTaxInPrices: true
    },
    localization: {
      defaultCurrency: "EUR",
      defaultLanguage: "sl",
      timezone: "Europe/Ljubljana",
      dateFormat: "DD.MM.YYYY",
      numberFormat: "1.234,56"
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("property");
  const [showSuccess, setShowSuccess] = useState(false);

  const currencies = [
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" }
  ];

  const languages = [
    { code: "sl", name: "Slovenščina" },
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "hr", name: "Hrvatski" }
  ];

  const timezones = [
    "Europe/Ljubljana",
    "Europe/Berlin",
    "Europe/Paris",
    "Europe/London",
    "Europe/Rome",
    "Europe/Zagreb"
  ];

  const paymentMethods = [
    { id: "credit_card", name: "Credit Card", icon: CreditCard },
    { id: "bank_transfer", name: "Bank Transfer", icon: DollarSign },
    { id: "cash", name: "Cash", icon: Banknote },
    { id: "paypal", name: "PayPal", icon: Globe }
  ];

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BusinessSettings],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BusinessSettings],
        [subsection]: {
          ...(prev[section as keyof BusinessSettings] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "EUR": return <Euro className="w-4 h-4" />;
      case "USD": return <DollarSign className="w-4 h-4" />;
      case "GBP": return <PoundSterling className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Business Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "property", name: "Property Info", icon: Building },
                { id: "hours", name: "Business Hours", icon: Clock },
                { id: "policies", name: "Policies", icon: FileText },
                { id: "tax", name: "Tax Settings", icon: Receipt },
                { id: "localization", name: "Localization", icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Property Info Tab */}
            {activeTab === "property" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Property Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Name
                    </label>
                    <input
                      type="text"
                      value={settings.propertyInfo.name}
                      onChange={(e) => handleInputChange("propertyInfo", "name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter property name"
                      aria-label="Property name"
                      title="Enter your property name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={settings.propertyInfo.legalName}
                      onChange={(e) => handleInputChange("propertyInfo", "legalName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter legal business name"
                      aria-label="Legal name"
                      title="Enter your legal business name"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Street
                      </label>
                      <input
                        type="text"
                        value={settings.propertyInfo.address.street}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "address", "street", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter street address"
                        aria-label="Street address"
                        title="Enter your street address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={settings.propertyInfo.address.city}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "address", "city", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter city"
                        aria-label="City"
                        title="Enter your city"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={settings.propertyInfo.address.postalCode}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "address", "postalCode", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter postal code"
                        aria-label="Postal code"
                        title="Enter your postal code"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={settings.propertyInfo.address.country}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "address", "country", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter country"
                        aria-label="Country"
                        title="Enter your country"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={settings.propertyInfo.contact.phone}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "contact", "phone", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter phone number"
                        aria-label="Phone number"
                        title="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.propertyInfo.contact.email}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "contact", "email", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter email address"
                        aria-label="Email address"
                        title="Enter your email address"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={settings.propertyInfo.contact.website}
                        onChange={(e) => handleNestedInputChange("propertyInfo", "contact", "website", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter website URL"
                        aria-label="Website URL"
                        title="Enter your website URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={settings.propertyInfo.taxId}
                      onChange={(e) => handleInputChange("propertyInfo", "taxId", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter tax ID"
                      aria-label="Tax ID"
                      title="Enter your tax identification number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={settings.propertyInfo.registrationNumber}
                      onChange={(e) => handleInputChange("propertyInfo", "registrationNumber", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter registration number"
                      aria-label="Registration number"
                      title="Enter your business registration number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Hours Tab */}
            {activeTab === "hours" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Business Hours</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Check-in / Check-out Times</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Check-in Time
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={settings.businessHours.checkIn.start}
                            onChange={(e) => handleNestedInputChange("businessHours", "checkIn", "start", e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Select check-in start time"
                            aria-label="Check-in start time"
                            title="Select check-in start time"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={settings.businessHours.checkIn.end}
                            onChange={(e) => handleNestedInputChange("businessHours", "checkIn", "end", e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Select check-in end time"
                            aria-label="Check-in end time"
                            title="Select check-in end time"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Check-out Time
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={settings.businessHours.checkOut.start}
                            onChange={(e) => handleNestedInputChange("businessHours", "checkOut", "start", e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Select check-out start time"
                            aria-label="Check-out start time"
                            title="Select check-out start time"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={settings.businessHours.checkOut.end}
                            onChange={(e) => handleNestedInputChange("businessHours", "checkOut", "end", e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Select check-out end time"
                            aria-label="Check-out end time"
                            title="Select check-out end time"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Reception Hours</h3>
                    <div className="space-y-3">
                      {Object.entries(settings.businessHours.reception).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-4">
                          <div className="w-24">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {day}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => {
                              const newReception = { ...settings.businessHours.reception };
                              newReception[day as keyof typeof newReception].enabled = !hours.enabled;
                              handleInputChange("businessHours", "reception", newReception);
                            }}
                            aria-label={hours.enabled ? `Disable ${day} reception` : `Enable ${day} reception`}
                            title={hours.enabled ? `Disable ${day} reception hours` : `Enable ${day} reception hours`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              hours.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                hours.enabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                          
                          {hours.enabled && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => {
                                  const newReception = { ...settings.businessHours.reception };
                                  newReception[day as keyof typeof newReception].open = e.target.value;
                                  handleInputChange("businessHours", "reception", newReception);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                placeholder="Select opening time"
                                aria-label={`${day} opening time`}
                                title={`Select ${day} opening time`}
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => {
                                  const newReception = { ...settings.businessHours.reception };
                                  newReception[day as keyof typeof newReception].close = e.target.value;
                                  handleInputChange("businessHours", "reception", newReception);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                placeholder="Select closing time"
                                aria-label={`${day} closing time`}
                                title={`Select ${day} closing time`}
                              />
                            </div>
                          )}
                          
                          {!hours.enabled && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Closed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === "policies" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Policies</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Cancellation Policy</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Free Cancellation (days before check-in)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.policies.cancellation.freeCancellationDays}
                            onChange={(e) => handleNestedInputChange("policies", "cancellation", "freeCancellationDays", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter free cancellation days"
                            aria-label="Free cancellation days"
                            title="Enter number of days for free cancellation"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cancellation Fee (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.policies.cancellation.cancellationFee}
                            onChange={(e) => handleNestedInputChange("policies", "cancellation", "cancellationFee", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter cancellation fee percentage"
                            aria-label="Cancellation fee"
                            title="Enter cancellation fee as percentage (0-100)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            No-show Fee (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.policies.cancellation.noShowFee}
                            onChange={(e) => handleNestedInputChange("policies", "cancellation", "noShowFee", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter no-show fee percentage"
                            aria-label="No-show fee"
                            title="Enter no-show fee as percentage (0-100)"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cancellation Description
                        </label>
                        <textarea
                          rows={3}
                          value={settings.policies.cancellation.description}
                          onChange={(e) => handleNestedInputChange("policies", "cancellation", "description", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter cancellation policy description"
                          aria-label="Cancellation description"
                          title="Enter detailed cancellation policy description"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Payment Terms</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="depositRequired"
                          checked={settings.policies.payment.depositRequired}
                          onChange={(e) => handleNestedInputChange("policies", "payment", "depositRequired", e.target.checked)}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <label htmlFor="depositRequired" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Require Deposit
                        </label>
                      </div>
                      
                      {settings.policies.payment.depositRequired && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Deposit Percentage (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={settings.policies.payment.depositPercentage}
                              onChange={(e) => handleNestedInputChange("policies", "payment", "depositPercentage", parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Enter deposit percentage"
                              aria-label="Deposit percentage"
                              title="Enter deposit percentage (0-100)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Payment Due (days after booking)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settings.policies.payment.paymentDueDays}
                              onChange={(e) => handleNestedInputChange("policies", "payment", "paymentDueDays", parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Enter payment due days"
                              aria-label="Payment due days"
                              title="Enter number of days after booking when payment is due"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Accepted Payment Methods
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {paymentMethods.map((method) => (
                            <label key={method.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={settings.policies.payment.paymentMethods.includes(method.id)}
                                onChange={(e) => {
                                  const currentMethods = settings.policies.payment.paymentMethods;
                                  if (e.target.checked) {
                                    handleNestedInputChange("policies", "payment", "paymentMethods", [...currentMethods, method.id]);
                                  } else {
                                    handleNestedInputChange("policies", "payment", "paymentMethods", currentMethods.filter(m => m !== method.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{method.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tax Settings Tab */}
            {activeTab === "tax" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tax Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="vatEnabled"
                      checked={settings.taxSettings.vatEnabled}
                      onChange={(e) => handleInputChange("taxSettings", "vatEnabled", e.target.checked)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="vatEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable VAT/Tax
                    </label>
                  </div>
                  
                  {settings.taxSettings.vatEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={settings.taxSettings.vatRate}
                          onChange={(e) => handleInputChange("taxSettings", "vatRate", parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter tax rate"
                          aria-label="Tax rate"
                          title="Enter tax rate as percentage (0-100)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax Name
                        </label>
                        <input
                          type="text"
                          value={settings.taxSettings.taxName}
                          onChange={(e) => handleInputChange("taxSettings", "taxName", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter tax name"
                          aria-label="Tax name"
                          title="Enter tax name (e.g., VAT, GST, Sales Tax)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          value={settings.taxSettings.taxId}
                          onChange={(e) => handleInputChange("taxSettings", "taxId", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter tax ID"
                          aria-label="Tax ID"
                          title="Enter your tax identification number"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="includeTaxInPrices"
                          checked={settings.taxSettings.includeTaxInPrices}
                          onChange={(e) => handleInputChange("taxSettings", "includeTaxInPrices", e.target.checked)}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <label htmlFor="includeTaxInPrices" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Include Tax in Prices
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Localization Tab */}
            {activeTab === "localization" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Currency & Language Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Currency
                    </label>
                    <select
                      value={settings.localization.defaultCurrency}
                      onChange={(e) => handleInputChange("localization", "defaultCurrency", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      aria-label="Default currency"
                      title="Select default currency"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Language
                    </label>
                    <select
                      value={settings.localization.defaultLanguage}
                      onChange={(e) => handleInputChange("localization", "defaultLanguage", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      aria-label="Default language"
                      title="Select default language"
                    >
                      {languages.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.localization.timezone}
                      onChange={(e) => handleInputChange("localization", "timezone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      aria-label="Timezone"
                      title="Select timezone"
                    >
                      {timezones.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.localization.dateFormat}
                      onChange={(e) => handleInputChange("localization", "dateFormat", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      aria-label="Date format"
                      title="Select date format"
                    >
                      <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number Format
                    </label>
                    <select
                      value={settings.localization.numberFormat}
                      onChange={(e) => handleInputChange("localization", "numberFormat", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      aria-label="Number format"
                      title="Select number format"
                    >
                      <option value="1.234,56">1.234,56 (European)</option>
                      <option value="1,234.56">1,234.56 (US)</option>
                      <option value="1 234,56">1 234,56 (Space)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
