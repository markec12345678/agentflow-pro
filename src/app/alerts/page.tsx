"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Bell, 
  Settings, 
  History, 
  CheckCircle, 
  XCircle,
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  Filter,
  Search,
  Download,
  RefreshCw,
  TestTube,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Building,
  TrendingUp,
  Activity
} from "lucide-react";
import { DashboardAlerts } from "@/web/components/DashboardAlerts";

// Types
interface Alert {
  id: string;
  type: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: string;
  status: "active" | "acknowledged" | "dismissed";
  source: string;
  propertyId?: string;
  userId?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dismissedBy?: string;
  dismissedAt?: string;
}

interface AlertRule {
  id: string;
  name: string;
  eventType: string;
  threshold: number | "any";
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  channels: ("email" | "sms" | "slack")[];
  cooldownMinutes: number;
  escalateAfterMinutes?: number;
  escalateTo?: string;
}

interface NotificationPreference {
  channel: "email" | "sms" | "slack";
  enabled: boolean;
  address?: string;
  severity: ("low" | "medium" | "high" | "critical")[];
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "rules" | "preferences">("dashboard");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showTestModal, setShowTestModal] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock alerts
      setAlerts([
        {
          id: "1",
          type: "critical",
          title: "Zasedenost kritična",
          message: "Objekt A ima 98% zasedenost - preveri kapacitete",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          status: "active",
          source: "occupancy_monitor",
          propertyId: "prop_1"
        },
        {
          id: "2",
          type: "high",
          title: "Neuspešno plačilo",
          message: "Rezervacija #1234 - plačilo zavrnjeno",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "acknowledged",
          source: "payment_system",
          acknowledgedBy: "user_1",
          acknowledgedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          type: "medium",
          title: "Sistemska napaka",
          message: "API rate limit prekoračen",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: "dismissed",
          source: "api_monitor",
          dismissedBy: "admin",
          dismissedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]);

      // Mock alert rules
      setAlertRules([
        {
          id: "1",
          name: "Zasedenost kritična",
          eventType: "occupancy",
          threshold: 95,
          severity: "critical",
          enabled: true,
          channels: ["sms", "email"],
          cooldownMinutes: 240,
          escalateAfterMinutes: 30,
          escalateTo: "director"
        },
        {
          id: "2",
          name: "Neuspešno plačilo",
          eventType: "payment_failed",
          threshold: 1,
          severity: "high",
          enabled: true,
          channels: ["email"],
          cooldownMinutes: 60
        }
      ]);

      // Mock preferences
      setPreferences([
        {
          channel: "email",
          enabled: true,
          address: "user@example.com",
          severity: ["medium", "high", "critical"]
        },
        {
          channel: "sms",
          enabled: true,
          address: "+38612345678",
          severity: ["high", "critical"]
        },
        {
          channel: "slack",
          enabled: false,
          severity: ["critical"]
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: "acknowledged", 
            acknowledgedBy: "current_user",
            acknowledgedAt: new Date().toISOString()
          }
        : alert
    ));
  };

  const handleDismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: "dismissed", 
            dismissedBy: "current_user",
            dismissedAt: new Date().toISOString()
          }
        : alert
    ));
  };

  const handleTestAlert = async (channel: "email" | "sms" | "slack") => {
    // Simulate test alert
    logger.info(`Sending test alert via ${channel}`);
    setShowTestModal(false);
  };

  const toggleAlertRule = async (ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updatePreference = async (channel: string, updates: Partial<NotificationPreference>) => {
    setPreferences(prev => prev.map(pref => 
      pref.channel === channel ? { ...pref, ...updates } : pref
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.type === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "high": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "medium": return <Info className="w-5 h-5 text-yellow-500" />;
      case "low": return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-50 border-red-200 text-red-800";
      case "high": return "bg-orange-50 border-orange-200 text-orange-800";
      case "medium": return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "low": return "bg-blue-50 border-blue-200 text-blue-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Activity className="w-4 h-4" />;
      case "acknowledged": return <CheckCircle className="w-4 h-4" />;
      case "dismissed": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje alertov...</p>
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
              <BellRing className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowTestModal(true)}
                aria-label="Test alert system"
                title="Test alert system"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <TestTube className="w-4 h-4" />
                <span>Test Alert</span>
              </button>
              <button 
                aria-label="Alert settings"
                title="Alert settings"
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "dashboard", label: "Aktivni Alerti", icon: Bell },
              { id: "history", label: "Zgodovina", icon: History },
              { id: "rules", label: "Pravila", icon: Settings },
              { id: "preferences", label: "Nastavitve", icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Aktivni", value: alerts.filter(a => a.status === "active").length, color: "bg-red-500" },
                { label: "Kritični", value: alerts.filter(a => a.type === "critical" && a.status === "active").length, color: "bg-orange-500" },
                { label: "Potrjeni", value: alerts.filter(a => a.status === "acknowledged").length, color: "bg-yellow-500" },
                { label: "Zavrnjeni", value: alerts.filter(a => a.status === "dismissed").length, color: "bg-green-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                      <div className="w-6 h-6 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Išči alerte..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    aria-label="Filter by severity"
                    title="Filter by severity"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Vsi severity</option>
                    <option value="critical">Kritični</option>
                    <option value="high">Visoki</option>
                    <option value="medium">Srednji</option>
                    <option value="low">Nizki</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                    title="Filter by status"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Vsi statusi</option>
                    <option value="active">Aktivni</option>
                    <option value="acknowledged">Potrjeni</option>
                    <option value="dismissed">Zavrnjeni</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    aria-label="Filter alerts"
                    title="Filter alerts"
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                  <button 
                    aria-label="Export alerts"
                    title="Export alerts"
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow border ${getSeverityColor(alert.type)}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getSeverityIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {alert.title}
                            </h3>
                            <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                              {getStatusIcon(alert.status)}
                              <span className="text-gray-600 dark:text-gray-400">
                                {alert.status === "active" ? "Aktivno" : 
                                 alert.status === "acknowledged" ? "Potrjeno" : "Zavrnjeno"}
                              </span>
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(alert.timestamp).toLocaleString("sl-SI")}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3" />
                              <span>{alert.source}</span>
                            </span>
                            {alert.acknowledgedBy && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Potrjeno: {alert.acknowledgedBy}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.status === "active" && (
                          <>
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Potrdi</span>
                            </button>
                            <button
                              onClick={() => handleDismissAlert(alert.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Zavrni</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {expandedAlert === alert.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {expandedAlert === alert.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">{alert.id}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Property ID:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">{alert.propertyId || "N/A"}</span>
                          </div>
                          {alert.acknowledgedAt && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Potrjeno:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(alert.acknowledgedAt).toLocaleString("sl-SI")}
                              </span>
                            </div>
                          )}
                          {alert.dismissedAt && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Zavrnjeno:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(alert.dismissedAt).toLocaleString("sl-SI")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Zgodovina Alertov</h2>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{alert.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString("sl-SI")}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.type)}`}>
                        {alert.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Alert Pravila</h2>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Dodaj Pravilo
                </button>
              </div>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleAlertRule(rule.id)}
                          aria-label={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
                          title={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            rule.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {rule.eventType} - Threshold: {rule.threshold} - Severity: {rule.severity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {rule.channels.map((channel) => (
                          <span key={channel} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Nastavitve</h2>
              <div className="space-y-6">
                {preferences.map((pref) => (
                  <div key={pref.channel} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {pref.channel === "email" && <Mail className="w-5 h-5 text-gray-500" />}
                        {pref.channel === "sms" && <Smartphone className="w-5 h-5 text-gray-500" />}
                        {pref.channel === "slack" && <MessageSquare className="w-5 h-5 text-gray-500" />}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">{pref.channel}</h3>
                          {pref.address && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pref.address}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => updatePreference(pref.channel, { enabled: !pref.enabled })}
                        aria-label={pref.enabled ? `Disable ${pref.channel} notifications` : `Enable ${pref.channel} notifications`}
                        title={pref.enabled ? `Disable ${pref.channel} notifications` : `Enable ${pref.channel} notifications`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          pref.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pref.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity levels:</p>
                      <div className="flex flex-wrap gap-2">
                        {["low", "medium", "high", "critical"].map((severity) => (
                          <label key={severity} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={pref.severity.includes(severity as any)}
                              onChange={(e) => {
                                const newSeverity = e.target.checked
                                  ? [...pref.severity, severity as any]
                                  : pref.severity.filter(s => s !== severity);
                                updatePreference(pref.channel, { severity: newSeverity });
                              }}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{severity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Alert Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Test Alert</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Pošlji test alert za preverjanje nastavitev obveščanja.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleTestAlert("email")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Test Email</span>
              </button>
              <button
                onClick={() => handleTestAlert("sms")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Test SMS</span>
              </button>
              <button
                onClick={() => handleTestAlert("slack")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Test Slack</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Prekliči
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
