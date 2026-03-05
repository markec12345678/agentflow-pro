"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Bell, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  Server, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Moon, 
  Sun, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  Smartphone,
  Hotel,
  Calendar,
  Wifi,
  UserCheck,
  AlertCircle
} from "lucide-react";

// Types
interface AlertRule {
  id: string;
  name: string;
  eventType: string;
  threshold: number | "any";
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  channels: ("email" | "sms" | "slack")[];
  cooldownMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  escalateAfterMinutes?: number;
  escalateTo?: string;
  description?: string;
}

interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  emergencyOnly: boolean;
}

interface AlertConfiguration {
  occupancyThreshold: number;
  paymentFailedThreshold: number;
  systemErrorThreshold: number;
  autoApproveFailureAlert: boolean;
  eturizemSyncFailureAlert: boolean;
  quietHours: QuietHours;
  customRules: AlertRule[];
}

export default function AlertSettingsPage() {
  const [config, setConfig] = useState<AlertConfiguration>({
    occupancyThreshold: 95,
    paymentFailedThreshold: 1,
    systemErrorThreshold: 3,
    autoApproveFailureAlert: true,
    eturizemSyncFailureAlert: true,
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00",
      timezone: "Europe/Ljubljana",
      emergencyOnly: true
    },
    customRules: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock custom rules
      setConfig(prev => ({
        ...prev,
        customRules: [
          {
            id: "1",
            name: "Zasedenost kritična",
            eventType: "occupancy",
            threshold: 95,
            severity: "critical",
            enabled: true,
            channels: ["sms", "email"],
            cooldownMinutes: 240,
            quietHoursEnabled: true,
            quietHoursStart: "22:00",
            quietHoursEnd: "07:00",
            escalateAfterMinutes: 30,
            escalateTo: "director",
            description: "Opozorilo pri zasedenosti nad 95%"
          },
          {
            id: "2", 
            name: "Neuspešno plačilo",
            eventType: "payment_failed",
            threshold: 1,
            severity: "high",
            enabled: true,
            channels: ["email"],
            cooldownMinutes: 60,
            quietHoursEnabled: false,
            quietHoursStart: "22:00",
            quietHoursEnd: "07:00",
            description: "Obvestilo o neuspešnem plačilu"
          },
          {
            id: "3",
            name: "Sistemske napake",
            eventType: "system_error",
            threshold: 3,
            severity: "medium",
            enabled: true,
            channels: ["slack"],
            cooldownMinutes: 15,
            quietHoursEnabled: true,
            quietHoursStart: "22:00",
            quietHoursEnd: "07:00",
            escalateAfterMinutes: 60,
            escalateTo: "dev",
            description: "Več kot 3 sistemske napake v 5 minutah"
          }
        ]
      }));
      
      setLoading(false);
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    console.log("Configuration saved:", config);
  };

  const handleAddRule = () => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: "Novo pravilo",
      eventType: "custom",
      threshold: 1,
      severity: "medium",
      enabled: true,
      channels: ["email"],
      cooldownMinutes: 60,
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00"
    };
    
    setConfig(prev => ({
      ...prev,
      customRules: [...prev.customRules, newRule]
    }));
    
    setEditingRule(newRule.id);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<AlertRule>) => {
    setConfig(prev => ({
      ...prev,
      customRules: prev.customRules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  const handleDeleteRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      customRules: prev.customRules.filter(rule => rule.id !== ruleId)
    }));
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "occupancy": return <Hotel className="w-4 h-4" />;
      case "payment_failed": return <CreditCard className="w-4 h-4" />;
      case "system_error": return <Server className="w-4 h-4" />;
      case "auto_approve_failure": return <XCircle className="w-4 h-4" />;
      case "eturizem_sync_failure": return <Wifi className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="w-3 h-3" />;
      case "sms": return <Smartphone className="w-3 h-3" />;
      case "slack": return <MessageSquare className="w-3 h-3" />;
      default: return <Bell className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje nastavitev...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Nastavitve</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Shranjevanje..." : "Shrani"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Thresholds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Osnovni Pragovi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Occupancy Threshold */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Hotel className="w-4 h-4" />
                  <span>Zasedenost</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.occupancyThreshold}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      occupancyThreshold: parseInt(e.target.value) || 0 
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter occupancy threshold"
                    aria-label="Occupancy threshold"
                    title="Enter occupancy threshold percentage (0-100)"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500">Opozorilo pri zasedenosti nad pragom</p>
              </div>

              {/* Payment Failed Threshold */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <CreditCard className="w-4 h-4" />
                  <span>Neuspešna plačila</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={config.paymentFailedThreshold}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      paymentFailedThreshold: parseInt(e.target.value) || 1 
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter payment failed threshold"
                    aria-label="Payment failed threshold"
                    title="Enter number of failed payments before alert"
                  />
                  <span className="text-sm text-gray-500">število</span>
                </div>
                <p className="text-xs text-gray-500">Opozorilo po toliko neuspešnih plačilih</p>
              </div>

              {/* System Error Threshold */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Server className="w-4 h-4" />
                  <span>Sistemske napake</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={config.systemErrorThreshold}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      systemErrorThreshold: parseInt(e.target.value) || 1 
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter system error threshold"
                    aria-label="System error threshold"
                    title="Enter number of system errors per 5 minutes before alert"
                  />
                  <span className="text-sm text-gray-500">v 5min</span>
                </div>
                <p className="text-xs text-gray-500">Opozorilo pri toliko napakahah</p>
              </div>
            </div>
          </div>

          {/* Alert Types */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Tipi Alertov</h2>
            
            <div className="space-y-4">
              {/* Auto-approve Failure */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Auto-approve Failure</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Opozorilo ob neuspešni avtomatski odobritvi rezervacije</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    autoApproveFailureAlert: !prev.autoApproveFailureAlert 
                  }))}
                  aria-label={config.autoApproveFailureAlert ? "Disable auto-approve failure alerts" : "Enable auto-approve failure alerts"}
                  title={config.autoApproveFailureAlert ? "Disable auto-approve failure alerts" : "Enable auto-approve failure alerts"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoApproveFailureAlert ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoApproveFailureAlert ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* eTurizem Sync Failure */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wifi className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">eTurizem Sync Failure</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Opozorilo ob neuspešni sinhronizaciji z eTurizem</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    eturizemSyncFailureAlert: !prev.eturizemSyncFailureAlert 
                  }))}
                  aria-label={config.eturizemSyncFailureAlert ? "Disable eTurizem sync failure alerts" : "Enable eTurizem sync failure alerts"}
                  title={config.eturizemSyncFailureAlert ? "Disable eTurizem sync failure alerts" : "Enable eTurizem sync failure alerts"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.eturizemSyncFailureAlert ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.eturizemSyncFailureAlert ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tihe Ure</h2>
              <div className="flex items-center space-x-2">
                {config.quietHours.enabled ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {config.quietHours.enabled ? "Aktivno" : "Neaktivno"}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Omogoči tihe ure</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brez alertov med nočnim mirom</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                  }))}
                  aria-label={config.quietHours.enabled ? "Disable quiet hours" : "Enable quiet hours"}
                  title={config.quietHours.enabled ? "Disable quiet hours" : "Enable quiet hours"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.quietHours.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.quietHours.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {config.quietHours.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Začetek</label>
                    <input
                      type="time"
                      value={config.quietHours.startTime}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, startTime: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Select start time"
                      aria-label="Quiet hours start time"
                      title="Select quiet hours start time"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Konec</label>
                    <input
                      type="time"
                      value={config.quietHours.endTime}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, endTime: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Select end time"
                      aria-label="Quiet hours end time"
                      title="Select quiet hours end time"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Samo nujni</label>
                    <button
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, emergencyOnly: !prev.quietHours.emergencyOnly }
                      }))}
                      aria-label={config.quietHours.emergencyOnly ? "Allow all alerts during quiet hours" : "Allow only emergency alerts during quiet hours"}
                      title={config.quietHours.emergencyOnly ? "Allow all alerts during quiet hours" : "Allow only emergency alerts during quiet hours"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.quietHours.emergencyOnly ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.quietHours.emergencyOnly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
              )}
            </div>
          </div>

          {/* Custom Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Custom Alert Pravila</h2>
              <button
                onClick={handleAddRule}
                aria-label="Add custom alert rule"
                title="Add new custom alert rule"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj pravilo</span>
              </button>
            </div>

            <div className="space-y-4">
              {config.customRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {editingRule === rule.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ime pravila</label>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter rule name"
                            aria-label="Rule name"
                            title="Enter custom alert rule name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event tip</label>
                          <select
                            value={rule.eventType}
                            onChange={(e) => handleUpdateRule(rule.id, { eventType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            aria-label="Event type"
                            title="Select event type for alert rule"
                          >
                            <option value="occupancy">Zasedenost</option>
                            <option value="payment_failed">Neuspešno plačilo</option>
                            <option value="system_error">Sistemska napaka</option>
                            <option value="auto_approve_failure">Auto-approve failure</option>
                            <option value="eturizem_sync_failure">eTurizem sync failure</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</label>
                          <input
                            type="number"
                            value={rule.threshold}
                            onChange={(e) => handleUpdateRule(rule.id, { threshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter threshold value"
                            aria-label="Threshold value"
                            title="Enter threshold value for alert rule"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity</label>
                          <select
                            value={rule.severity}
                            onChange={(e) => handleUpdateRule(rule.id, { severity: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            aria-label="Severity level"
                            title="Select severity level for alert rule"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cooldown (min)</label>
                          <input
                            type="number"
                            value={rule.cooldownMinutes}
                            onChange={(e) => handleUpdateRule(rule.id, { cooldownMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter cooldown minutes"
                            aria-label="Cooldown minutes"
                            title="Enter cooldown period in minutes between alerts"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opis</label>
                        <textarea
                          value={rule.description || ""}
                          onChange={(e) => handleUpdateRule(rule.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter rule description"
                          aria-label="Rule description"
                          title="Enter description for custom alert rule"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => handleUpdateRule(rule.id, { enabled: e.target.checked })}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Omogočeno</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={rule.quietHoursEnabled}
                              onChange={(e) => handleUpdateRule(rule.id, { quietHoursEnabled: e.target.checked })}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Tihe ure</span>
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingRule(null)}
                            aria-label="Save rule"
                            title="Save custom alert rule"
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRule(null)}
                            aria-label="Cancel editing"
                            title="Cancel editing custom alert rule"
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex items-center space-x-2">
                            {getEventIcon(rule.eventType)}
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(rule.severity)}`}>
                            {rule.severity}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            {rule.channels.map((channel) => (
                              <span key={channel} className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
                                {getChannelIcon(channel)}
                              </span>
                            ))}
                          </div>

                          <button
                            onClick={() => handleUpdateRule(rule.id, { enabled: !rule.enabled })}
                            aria-label={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
                            title={rule.enabled ? `Disable ${rule.name} alert rule` : `Enable ${rule.name} alert rule`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              rule.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                rule.enabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingRule(rule.id)}
                              aria-label="Edit rule"
                              title="Edit custom alert rule"
                              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              aria-label="Delete rule"
                              title="Delete custom alert rule"
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Threshold: {rule.threshold}</span>
                        <span>Cooldown: {rule.cooldownMinutes}min</span>
                        {rule.quietHoursEnabled && <span>🌙 Tihe ure</span>}
                        {rule.escalateAfterMinutes && (
                          <span>Eskalacija: {rule.escalateAfterMinutes}min → {rule.escalateTo}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
