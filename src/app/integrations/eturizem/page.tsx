"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { 
  RefreshCw, 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Key, 
  TestTube, 
  History, 
  Map, 
  Server, 
  Activity,
  Download,
  Upload,
  AlertCircle,
  Info,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  Trash2
} from "lucide-react";

// Types
interface SyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  status: "success" | "error" | "pending" | "disabled";
  errorMessage?: string;
  totalProperties: number;
  syncedProperties: number;
  failedProperties: number;
}

interface SyncLog {
  id: string;
  timestamp: string;
  type: "full" | "incremental" | "manual" | "error";
  status: "success" | "error" | "partial";
  propertiesProcessed: number;
  propertiesUpdated: number;
  propertiesCreated: number;
  propertiesFailed: number;
  duration: number; // in seconds
  errorMessage?: string;
  details?: string;
}

interface PropertyMapping {
  id: string;
  localPropertyId: string;
  localPropertyName: string;
  eturizemId: string | null;
  eturizemName: string | null;
  lastSyncTime: string | null;
  syncStatus: "synced" | "pending" | "error" | "not_mapped";
  errorMessage?: string;
}

interface EturizemConfig {
  apiKey: string;
  baseUrl: string;
  autoSyncEnabled: boolean;
  syncInterval: number; // in hours
  retryAttempts: number;
  timeout: number; // in seconds
}

export default function EturizemIntegrationPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    nextSyncTime: null,
    status: "disabled",
    totalProperties: 0,
    syncedProperties: 0,
    failedProperties: 0
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [propertyMappings, setPropertyMappings] = useState<PropertyMapping[]>([]);
  const [config, setConfig] = useState<EturizemConfig>({
    apiKey: "",
    baseUrl: "https://api.eturizem.si",
    autoSyncEnabled: true,
    syncInterval: 4,
    retryAttempts: 3,
    timeout: 30
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"status" | "logs" | "mapping" | "config">("status");

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock sync status
      setSyncStatus({
        lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextSyncTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "success",
        totalProperties: 12,
        syncedProperties: 10,
        failedProperties: 2
      });

      // Mock sync logs
      setSyncLogs([
        {
          id: "1",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: "incremental",
          status: "success",
          propertiesProcessed: 12,
          propertiesUpdated: 8,
          propertiesCreated: 2,
          propertiesFailed: 2,
          duration: 45,
          details: "Updated 8 properties, created 2 new properties"
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: "manual",
          status: "partial",
          propertiesProcessed: 12,
          propertiesUpdated: 5,
          propertiesCreated: 0,
          propertiesFailed: 7,
          duration: 120,
          errorMessage: "API rate limit exceeded",
          details: "Failed to sync 7 properties due to rate limiting"
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          type: "full",
          status: "success",
          propertiesProcessed: 12,
          propertiesUpdated: 3,
          propertiesCreated: 9,
          propertiesFailed: 0,
          duration: 180,
          details: "Initial full sync completed successfully"
        }
      ]);

      // Mock property mappings
      setPropertyMappings([
        {
          id: "1",
          localPropertyId: "prop_1",
          localPropertyName: "Hotel Alpina",
          eturizemId: "ET12345",
          eturizemName: "Hotel Alpina",
          lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          syncStatus: "synced"
        },
        {
          id: "2",
          localPropertyId: "prop_2",
          localPropertyName: "Vila Marija",
          eturizemId: "ET67890",
          eturizemName: "Vila Marija",
          lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          syncStatus: "synced"
        },
        {
          id: "3",
          localPropertyId: "prop_3",
          localPropertyName: "Apartmaji Jezero",
          eturizemId: null,
          eturizemName: null,
          lastSyncTime: null,
          syncStatus: "not_mapped"
        },
        {
          id: "4",
          localPropertyId: "prop_4",
          localPropertyName: "Kamp Sončni Gaj",
          eturizemId: "ET11111",
          eturizemName: "Kamp Sončni Gaj",
          lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          syncStatus: "error",
          errorMessage: "Property not found in eTurizem"
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setSyncStatus(prev => ({
      ...prev,
      lastSyncTime: new Date().toISOString(),
      nextSyncTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: "success"
    }));

    // Add new log entry
    const newLog: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: "manual",
      status: "success",
      propertiesProcessed: 12,
      propertiesUpdated: 6,
      propertiesCreated: 1,
      propertiesFailed: 0,
      duration: 35,
      details: "Manual sync completed successfully"
    };

    setSyncLogs(prev => [newLog, ...prev]);
    setSyncing(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting(false);
    logger.info("Connection test completed");
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    logger.info("Configuration saved:", config);
  };

  const handleToggleAutoSync = () => {
    setConfig(prev => ({ ...prev, autoSyncEnabled: !prev.autoSyncEnabled }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "synced":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "disabled":
      case "not_mapped":
        return <WifiOff className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "synced":
        return "bg-green-50 text-green-800 border-green-200";
      case "error":
      case "failed":
        return "bg-red-50 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "disabled":
      case "not_mapped":
        return "bg-gray-50 text-gray-800 border-gray-200";
      default:
        return "bg-orange-50 text-orange-800 border-orange-200";
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje eTurizem integracije...</p>
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
              <Wifi className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">eTurizem Integration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                aria-label="Manual sync with eTurizem"
                title="Manual sync with eTurizem"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sinhronizacija...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Manual Sync</span>
                  </>
                )}
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
              { id: "status", label: "Status", icon: Activity },
              { id: "logs", label: "Sync History", icon: History },
              { id: "mapping", label: "Property Mapping", icon: Map },
              { id: "config", label: "Configuration", icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
                aria-label={`Select ${tab.label} tab`}
                title={`View ${tab.label} settings`}
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
        {/* Status Tab */}
        {selectedTab === "status" && (
          <div className="space-y-6">
            {/* Sync Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(syncStatus.status)}
                      <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {syncStatus.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Sync</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {syncStatus.lastSyncTime 
                        ? new Date(syncStatus.lastSyncTime).toLocaleString("sl-SI")
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Next Sync</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {syncStatus.nextSyncTime 
                        ? new Date(syncStatus.nextSyncTime).toLocaleString("sl-SI")
                        : "Not scheduled"
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {syncStatus.syncedProperties}/{syncStatus.totalProperties}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Connection Status</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(syncStatus.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {syncStatus.status === "success" ? "Connected" : "Disconnected"}
                    </p>
                    {syncStatus.errorMessage && (
                      <p className="text-sm text-red-600 dark:text-red-400">{syncStatus.errorMessage}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  aria-label="Test eTurizem connection"
                  title="Test eTurizem connection"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-sync Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Auto-sync Schedule</h2>
                <button
                  onClick={handleToggleAutoSync}
                  aria-label={config.autoSyncEnabled ? "Disable auto-sync" : "Enable auto-sync"}
                  title={config.autoSyncEnabled ? "Disable auto-sync" : "Enable auto-sync"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoSyncEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoSyncEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sync Interval</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Every {config.syncInterval} hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Next Scheduled</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {syncStatus.nextSyncTime 
                        ? new Date(syncStatus.nextSyncTime).toLocaleString("sl-SI")
                        : "Not scheduled"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {selectedTab === "logs" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Sync History</h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getStatusIcon(log.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                              {log.type} Sync
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(log.timestamp).toLocaleString("sl-SI")}
                          </p>
                          
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Processed:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{log.propertiesProcessed}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Updated:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{log.propertiesUpdated}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{log.propertiesCreated}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Failed:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{log.propertiesFailed}</span>
                            </div>
                          </div>
                          
                          {log.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{log.details}</p>
                          )}
                          
                          {log.errorMessage && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{log.errorMessage}</p>
                          )}
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Duration: {formatDuration(log.duration)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mapping Tab */}
        {selectedTab === "mapping" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Property Mapping</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Map local properties to eTurizem IDs
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Local Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        eTurizem ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Sync
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {propertyMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {mapping.localPropertyName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {mapping.localPropertyId}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {mapping.eturizemId ? (
                              <>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {mapping.eturizemName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {mapping.eturizemId}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Not mapped</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(mapping.syncStatus)}
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(mapping.syncStatus)}`}>
                              {mapping.syncStatus}
                            </span>
                          </div>
                          {mapping.errorMessage && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {mapping.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mapping.lastSyncTime 
                            ? new Date(mapping.lastSyncTime).toLocaleString("sl-SI")
                            : "Never"
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button 
                              aria-label="View sync details"
                              title="View sync details"
                              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              aria-label="Refresh sync"
                              title="Refresh sync"
                              className="p-1 text-blue-500 hover:text-blue-700"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                              aria-label="Delete sync record"
                              title="Delete sync record"
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {selectedTab === "config" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">API Configuration</h2>
              
              <div className="space-y-6">
                {/* API Key */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Key className="w-4 h-4" />
                    <span>API Key</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter eTurizem API key"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      title={showApiKey ? "Hide API key" : "Show API key"}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from eTurizem dashboard
                  </p>
                </div>

                {/* Base URL */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Server className="w-4 h-4" />
                    <span>Base URL</span>
                  </label>
                  <input
                    type="url"
                    value={config.baseUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.eturizem.si"
                    aria-label="eTurizem API base URL"
                    title="Enter eTurizem API base URL"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Sync Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sync Interval (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={config.syncInterval}
                      onChange={(e) => setConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 4 }))}
                      placeholder="4"
                      aria-label="Sync interval in hours"
                      title="Enter sync interval (1-24 hours)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.retryAttempts}
                      onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
                      placeholder="3"
                      aria-label="Retry attempts"
                      title="Enter number of retry attempts (1-10)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={config.timeout}
                      onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                      aria-label="Request timeout in seconds"
                      title="Enter request timeout (5-300 seconds)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Auto-sync Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Auto-sync</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically sync properties every {config.syncInterval} hours
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoSync}
                    aria-label={config.autoSyncEnabled ? "Disable auto-sync" : "Enable auto-sync"}
                    title={config.autoSyncEnabled ? "Disable automatic property synchronization" : "Enable automatic property synchronization"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoSyncEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoSyncEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    aria-label="Save configuration"
                    title="Save eTurizem integration configuration"
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Shranjevanje...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Shrani</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
