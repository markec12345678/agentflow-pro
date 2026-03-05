"use client";

import { useState, useEffect } from "react";
import "@/styles/progress-bars.css";
import { 
  Bot, 
  Settings, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  Zap, 
  Target, 
  Timer,
  Calendar,
  Flag,
  ToggleLeft,
  ToggleRight,
  Activity,
  TrendingUp,
  AlertCircle,
  Info
} from "lucide-react";

interface AutoApproveThreshold {
  id: string;
  name: string;
  type: "price" | "risk_score" | "occupancy" | "revenue";
  minValue: number;
  maxValue: number;
  unit: string;
  enabled: boolean;
  description: string;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: "idle" | "running" | "completed" | "failed";
  agent: string;
}

interface RetryPolicy {
  id: string;
  name: string;
  maxRetries: number;
  backoffType: "linear" | "exponential" | "fixed";
  backoffSeconds: number;
  enabled: boolean;
  description: string;
}

interface FallbackRule {
  id: string;
  name: string;
  triggerCondition: string;
  fallbackAction: string;
  priority: number;
  enabled: boolean;
  description: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: "development" | "staging" | "production";
  lastModified: string;
  modifiedBy: string;
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState("thresholds");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dryRunMode, setDryRunMode] = useState(false);
  const [agentTimeout, setAgentTimeout] = useState(300);

  // Auto-approve thresholds
  const [thresholds, setThresholds] = useState<AutoApproveThreshold[]>([
    {
      id: "1",
      name: "Price Threshold",
      type: "price",
      minValue: 50,
      maxValue: 5000,
      unit: "EUR",
      enabled: true,
      description: "Auto-approve bookings within this price range"
    },
    {
      id: "2",
      name: "Risk Score Threshold",
      type: "risk_score",
      minValue: 0,
      maxValue: 70,
      unit: "score",
      enabled: true,
      description: "Auto-approve bookings with risk score below this value"
    },
    {
      id: "3",
      name: "Occupancy Threshold",
      type: "occupancy",
      minValue: 0,
      maxValue: 90,
      unit: "%",
      enabled: true,
      description: "Auto-approve when occupancy is below this percentage"
    }
  ]);

  // Cron jobs
  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    {
      id: "1",
      name: "Daily Revenue Report",
      schedule: "0 8 * * *",
      description: "Generate daily revenue report at 8 AM",
      enabled: true,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      agent: "analytics"
    },
    {
      id: "2",
      name: "Guest Email Cleanup",
      schedule: "0 2 * * 0",
      description: "Clean up old guest emails on Sundays at 2 AM",
      enabled: true,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: "idle",
      agent: "cleanup"
    },
    {
      id: "3",
      name: "Property Sync",
      schedule: "*/30 * * * *",
      description: "Sync property data every 30 minutes",
      enabled: true,
      lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "running",
      agent: "sync"
    }
  ]);

  // Retry policies
  const [retryPolicies, setRetryPolicies] = useState<RetryPolicy[]>([
    {
      id: "1",
      name: "API Retry Policy",
      maxRetries: 3,
      backoffType: "exponential",
      backoffSeconds: 2,
      enabled: true,
      description: "Retry failed API calls with exponential backoff"
    },
    {
      id: "2",
      name: "Email Retry Policy",
      maxRetries: 5,
      backoffType: "linear",
      backoffSeconds: 60,
      enabled: true,
      description: "Retry failed email sends with linear backoff"
    }
  ]);

  // Fallback rules
  const [fallbackRules, setFallbackRules] = useState<FallbackRule[]>([
    {
      id: "1",
      name: "AI Agent Fallback",
      triggerCondition: "ai_agent_failure",
      fallbackAction: "use_manual_processing",
      priority: 1,
      enabled: true,
      description: "Switch to manual processing if AI agent fails"
    },
    {
      id: "2",
      name: "Payment Gateway Fallback",
      triggerCondition: "payment_gateway_failure",
      fallbackAction: "use_backup_gateway",
      priority: 2,
      enabled: true,
      description: "Use backup payment gateway if primary fails"
    }
  ]);

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      id: "1",
      name: "AI Content Generation",
      key: "ai_content_generation",
      description: "Enable AI-powered content generation",
      enabled: true,
      rolloutPercentage: 100,
      environment: "production",
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: "Admin User"
    },
    {
      id: "2",
      name: "Advanced Analytics",
      key: "advanced_analytics",
      description: "Enable advanced analytics dashboard",
      enabled: false,
      rolloutPercentage: 0,
      environment: "production",
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: "Admin User"
    },
    {
      id: "3",
      name: "Smart Pricing",
      key: "smart_pricing",
      description: "Enable AI-powered dynamic pricing",
      enabled: true,
      rolloutPercentage: 50,
      environment: "staging",
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      modifiedBy: "Director User"
    }
  ]);

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleToggleThreshold = async (thresholdId: string) => {
    setThresholds(prev => prev.map(threshold => 
      threshold.id === thresholdId 
        ? { ...threshold, enabled: !threshold.enabled }
        : threshold
    ));
  };

  const handleToggleCronJob = async (jobId: string) => {
    setCronJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, enabled: !job.enabled }
        : job
    ));
  };

  const handleRunCronJob = async (jobId: string) => {
    setCronJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: "running" as const }
        : job
    ));
    
    // Simulate job execution
    setTimeout(() => {
      setCronJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: "completed" as const,
              lastRun: new Date().toISOString()
            }
          : job
      ));
    }, 3000);
  };

  const handleUpdateThreshold = async (thresholdId: string, field: string, value: any) => {
    setThresholds(prev => prev.map(threshold => 
      threshold.id === thresholdId 
        ? { ...threshold, [field]: value }
        : threshold
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running": return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      case "idle": return <Clock className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBackoffTypeLabel = (type: string) => {
    switch (type) {
      case "linear": return "Linear";
      case "exponential": return "Exponential";
      case "fixed": return "Fixed";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Automation Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Dry Run: {dryRunMode ? "ON" : "OFF"}
                </span>
                <button
                  onClick={() => setDryRunMode(!dryRunMode)}
                  aria-label={dryRunMode ? "Disable dry run mode" : "Enable dry run mode"}
                  title={dryRunMode ? "Disable dry run mode" : "Enable dry run mode"}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    dryRunMode ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      dryRunMode ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                aria-label="Save automation settings"
                title="Save automation settings"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
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
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "thresholds", name: "Auto-approve", icon: Target },
                { id: "cron", name: "Cron Jobs", icon: Calendar },
                { id: "timeout", name: "Agent Timeout", icon: Timer },
                { id: "retry", name: "Retry Policies", icon: RotateCcw },
                { id: "fallback", name: "Fallback Rules", icon: Shield },
                { id: "features", name: "Feature Flags", icon: Flag }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={`Switch to ${tab.name} tab`}
                  title={`Switch to ${tab.name} tab`}
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
            {/* Auto-approve Thresholds Tab */}
            {activeTab === "thresholds" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Auto-approve Thresholds</h2>
                
                <div className="space-y-4">
                  {thresholds.map((threshold) => (
                    <div key={threshold.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {threshold.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {threshold.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleThreshold(threshold.id)}
                          aria-label={threshold.enabled ? `Disable ${threshold.name}` : `Enable ${threshold.name}`}
                          title={threshold.enabled ? `Disable ${threshold.name} threshold` : `Enable ${threshold.name} threshold`}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            threshold.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              threshold.enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      
                      {threshold.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Min Value
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={threshold.minValue}
                                onChange={(e) => handleUpdateThreshold(threshold.id, "minValue", parseInt(e.target.value))}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter minimum value"
                                aria-label="Minimum value"
                                title={`Enter minimum ${threshold.name} value`}
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {threshold.unit}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Max Value
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={threshold.maxValue}
                                onChange={(e) => handleUpdateThreshold(threshold.id, "maxValue", parseInt(e.target.value))}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter maximum value"
                                aria-label="Maximum value"
                                title={`Enter maximum ${threshold.name} value`}
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {threshold.unit}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Range
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                              {threshold.minValue} - {threshold.maxValue} {threshold.unit}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cron Jobs Tab */}
            {activeTab === "cron" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Cron Job Schedules</h2>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add Job</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {cronJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {job.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Schedule: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{job.schedule}</code></span>
                            <span>Agent: {job.agent}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <button
                            onClick={() => handleRunCronJob(job.id)}
                            disabled={job.status === "running"}
                            aria-label="Run cron job"
                            title="Run this cron job manually"
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleCronJob(job.id)}
                            aria-label={job.enabled ? "Disable cron job" : "Enable cron job"}
                            title={job.enabled ? "Disable this cron job" : "Enable this cron job"}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              job.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                job.enabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      
                      {job.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {job.lastRun ? new Date(job.lastRun).toLocaleString() : "Never"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {job.nextRun ? new Date(job.nextRun).toLocaleString() : "Not scheduled"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Timeout Tab */}
            {activeTab === "timeout" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Agent Timeout Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Agent Timeout (seconds)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="30"
                        max="3600"
                        value={agentTimeout}
                        onChange={(e) => setAgentTimeout(parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter timeout in seconds"
                        aria-label="Agent timeout"
                        title="Enter default agent timeout in seconds (30-3600)"
                      />
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {agentTimeout} seconds ({Math.floor(agentTimeout / 60)} min {agentTimeout % 60} sec)
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Timeout Information
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Agent timeout determines how long an AI agent can run before being automatically terminated. 
                          This prevents runaway processes and ensures system stability.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Retry Policies Tab */}
            {activeTab === "retry" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Retry Policies</h2>
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    aria-label="Add retry policy"
                    title="Add new retry policy"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Policy</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {retryPolicies.map((policy) => (
                    <div key={policy.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {policy.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {policy.description}
                          </p>
                        </div>
                        <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            policy.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          aria-label={policy.enabled ? `Disable ${policy.name}` : `Enable ${policy.name}`}
                          title={policy.enabled ? `Disable ${policy.name} retry policy` : `Enable ${policy.name} retry policy`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              policy.enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      
                      {policy.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Max Retries:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{policy.maxRetries}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Backoff Type:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{getBackoffTypeLabel(policy.backoffType)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Backoff Seconds:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{policy.backoffSeconds}s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback Rules Tab */}
            {activeTab === "fallback" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Fallback Rules</h2>
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    aria-label="Add fallback rule"
                    title="Add new fallback rule"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Rule</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {fallbackRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {rule.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {rule.description}
                          </p>
                        </div>
                        <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            rule.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          aria-label={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
                          title={rule.enabled ? `Disable ${rule.name} fallback rule` : `Enable ${rule.name} fallback rule`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      
                      {rule.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Trigger:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{rule.triggerCondition}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Action:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{rule.fallbackAction}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{rule.priority}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Flags Tab */}
            {activeTab === "features" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Feature Flags</h2>
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    aria-label="Add feature flag"
                    title="Add new feature flag"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Flag</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            {flag.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {flag.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Key: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{flag.key}</code></span>
                            <span>Environment: {flag.environment}</span>
                            <span>Modified by: {flag.modifiedBy}</span>
                          </div>
                        </div>
                        <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            flag.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          aria-label={flag.enabled ? `Disable ${flag.name}` : `Enable ${flag.name}`}
                          title={flag.enabled ? `Disable ${flag.name} feature flag` : `Enable ${flag.name} feature flag`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              flag.enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rollout:</span>
                          <div className="mt-1">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full progress-width-${Math.round(flag.rolloutPercentage / 5) * 5}"
                                />
                              </div>
                              <span className="text-gray-900 dark:text-white">{flag.rolloutPercentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Modified:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(flag.lastModified).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
