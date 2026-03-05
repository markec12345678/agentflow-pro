"use client";

import { useState } from "react";
import "../../../styles/progress-bars.css";
import { 
  Activity, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Monitor, 
  HardDrive, 
  MemoryStick, 
  Cpu, 
  TrendingUp, 
  BarChart3, 
  LineChart, 
  Play, 
  AlertCircle,
  Info,
  Bell,
  Eye
} from "lucide-react";

interface HealthCheck {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  lastCheck: string;
  responseTime: number;
  uptime: number;
  errorRate: number;
  details: {
    [key: string]: string | number | boolean;
  };
  history: {
    timestamp: string;
    status: string;
    responseTime: number;
  }[];
}

interface _SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  cache: {
    hitRate: number;
    memory: number;
    keys: number;
  };
}

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  component: string;
}

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [refreshInterval] = useState(30);

  function generateHistoryData(status: string, seed: number) {
    const history = [];
    const now = new Date();
    // Use seed for deterministic random values
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp: timestamp.toISOString(),
        status: random() > 0.1 ? status : "warning",
        responseTime: Math.floor(random() * 500) + 50
      });
    }
    return history.reverse();
  }

  // Mock health checks
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: "database",
      name: "Database",
      status: "healthy",
      lastCheck: new Date().toISOString(),
      responseTime: 45,
      uptime: 99.9,
      errorRate: 0.1,
      details: {
        connections: 12,
        maxConnections: 100,
        queryTime: 23,
        slowQueries: 0,
        replication: "healthy",
        backup: "completed"
      },
      history: generateHistoryData("healthy", 1)
    },
    {
      id: "api",
      name: "API Server",
      status: "healthy",
      lastCheck: new Date().toISOString(),
      responseTime: 120,
      uptime: 99.8,
      errorRate: 0.2,
      details: {
        endpoints: 45,
        activeConnections: 234,
        requestsPerMinute: 1250,
        averageResponseTime: 120,
        rateLimit: "active"
      },
      history: generateHistoryData("healthy", 2)
    },
    {
      id: "agents",
      name: "AI Agents",
      status: "warning",
      lastCheck: new Date().toISOString(),
      responseTime: 850,
      uptime: 98.5,
      errorRate: 1.5,
      details: {
        activeAgents: 4,
        totalAgents: 4,
        queueSize: 15,
        averageProcessingTime: 850,
        failedJobs: 3,
        lastFailure: "2 minutes ago"
      },
      history: generateHistoryData("warning", 3)
    },
    {
      id: "cache",
      name: "Redis Cache",
      status: "healthy",
      lastCheck: new Date().toISOString(),
      responseTime: 2,
      uptime: 99.99,
      errorRate: 0.01,
      details: {
        memory: "2.1GB / 4GB",
        hitRate: 94.5,
        connections: 8,
        keys: 125000,
        evictions: 12
      },
      history: generateHistoryData("healthy", 4)
    },
    {
      id: "storage",
      name: "File Storage",
      status: "critical",
      lastCheck: new Date('2026-03-01T11:55:00Z').toISOString(),
      responseTime: 2500,
      uptime: 95.2,
      errorRate: 4.8,
      details: {
        usedSpace: "850GB / 1TB",
        availableSpace: "150GB",
        uploadSpeed: "2.5MB/s",
        downloadSpeed: "15.2MB/s",
        errors: 12
      },
      history: generateHistoryData("critical", 5)
    }
  ]);

  const _systemMetrics = {
    cpu: {
      usage: 45,
      temperature: 65
    },
    memory: {
      used: 8.2,
      total: 16,
      percentage: 51.3
    },
    disk: {
      used: 850,
      total: 1000,
      percentage: 85.0
    },
    network: {
      bytesIn: 1024000,
      bytesOut: 512000,
      connections: 45
    },
    database: {
      connections: 12,
      queryTime: 23,
      cacheHitRate: 94.5
    },
    cache: {
      hitRate: 94.5,
      memory: 2.1,
      keys: 125000
    }
  };

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const baseTime = new Date('2026-03-01T12:00:00Z').getTime();
    return [
    {
      id: "alert_1",
      type: "error",
      title: "Storage Space Critical",
      message: "File storage is at 85% capacity. Immediate attention required.",
      timestamp: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      acknowledged: false,
      component: "storage"
    },
    {
      id: "alert_2",
      type: "warning",
      title: "AI Agent Performance",
      message: "AI agents showing increased response times.",
      timestamp: new Date(baseTime - 25 * 60 * 1000).toISOString(),
      acknowledged: false,
      component: "agents"
    },
    {
      id: "alert_3",
      type: "info",
      title: "Database Backup Completed",
      message: "Daily database backup completed successfully.",
      timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      acknowledged: true,
      component: "database"
    }
  ];
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "critical": return <XCircle className="w-5 h-5 text-red-500" />;
      case "unknown": return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800 border-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "unknown": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info": return <Info className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleRunHealthCheck = async (componentId?: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update health checks (in real implementation, this would call the API)
    setHealthChecks(prev => prev.map(check => {
      if (!componentId || check.id === componentId) {
        // Use deterministic pseudo-random based on current time
        const seed = Date.now();
        const random = () => {
          const x = Math.sin(seed + check.id.charCodeAt(0)) * 10000;
          return x - Math.floor(x);
        };
        const randomStatus = random() > 0.8 ? "warning" : random() > 0.95 ? "critical" : "healthy";
        const statusType = randomStatus as "healthy" | "warning" | "critical" | "unknown";
        return {
          ...check,
          status: statusType,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(random() * 1000) + 50,
          history: [...check.history.slice(1), {
            timestamp: new Date().toISOString(),
            status: randomStatus,
            responseTime: Math.floor(random() * 1000) + 50
          }]
        };
      }
      return check;
    }));
    
    setLoading(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const overallStatus = healthChecks.some(check => check.status === "critical") 
    ? "critical" 
    : healthChecks.some(check => check.status === "warning") 
    ? "warning" 
    : "healthy";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">System Health</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(overallStatus)}`}>
                {getStatusIcon(overallStatus)}
                <span className="ml-1 capitalize">{overallStatus}</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  aria-label={autoRefresh ? "Disable auto refresh" : "Enable auto refresh"}
                  title={autoRefresh ? "Disable auto refresh" : "Enable auto refresh"}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoRefresh ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-refresh: {refreshInterval}s
                </span>
              </div>
              <button
                onClick={() => handleRunHealthCheck()}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Health Check</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">CPU</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">4 cores</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="text-sm font-medium">{_systemMetrics.cpu.usage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-bar-fill blue progress-width-${Math.round(_systemMetrics.cpu.usage / 5) * 5}`}
                      role="progressbar"
                      aria-valuenow="50"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`CPU usage: ${_systemMetrics.cpu.usage}%`}
                    />
                  </div>
                  {_systemMetrics.cpu.temperature && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                      <span className="text-sm font-medium">{_systemMetrics.cpu.temperature}°C</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MemoryStick className="w-5 h-5 text-green-500" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Memory</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{_systemMetrics.memory.total}GB</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                    <span className="text-sm font-medium">{_systemMetrics.memory.used}GB ({_systemMetrics.memory.percentage}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-bar-fill green progress-width-${Math.round(_systemMetrics.memory.percentage / 5) * 5}`}
                      role="progressbar"
                      aria-valuenow="60"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Memory usage: ${_systemMetrics.memory.percentage}%`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Disk</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{_systemMetrics.disk.total}GB</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                    <span className="text-sm font-medium">{_systemMetrics.disk.used}GB ({_systemMetrics.disk.percentage}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-bar-fill ${
                        _systemMetrics.disk.percentage > 80 ? 'red' : 
                        _systemMetrics.disk.percentage > 60 ? 'yellow' : 'green'
                      } progress-width-${Math.round(_systemMetrics.disk.percentage / 5) * 5}`}
                      role="progressbar"
                      aria-valuenow="70"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Disk usage: ${_systemMetrics.disk.percentage}%`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-purple-500" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Database</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{_systemMetrics.database.connections} connections</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Query Time</span>
                    <span className="text-sm font-medium">{_systemMetrics.database.queryTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
                    <span className="text-sm font-medium">{_systemMetrics.database.cacheHitRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Checks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Component Health</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {healthChecks.map((check) => (
                  <div key={check.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(check.status)}
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">{check.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last check: {new Date(check.lastCheck).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
                          <p className="text-md font-medium">{check.responseTime}ms</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                          <p className="text-md font-medium">{check.uptime}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                          <p className="text-md font-medium">{check.errorRate}%</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowDetails(showDetails === check.id ? null : check.id)}
                            aria-label={`Show details for ${check.name}`}
                            title={`Show details for ${check.name}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRunHealthCheck(check.id)}
                            disabled={loading}
                            aria-label={`Run health check for ${check.name}`}
                            title={`Run health check for ${check.name}`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {showDetails === check.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {Object.entries(check.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-500 dark:text-gray-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="ml-2 text-gray-900 dark:text-white">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Alerts</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {alerts.filter(a => !a.acknowledged).length} unacknowledged
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
                  alert.type === 'error' ? 'border-red-500' :
                  alert.type === 'warning' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h3 className="text-md font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Component: {alert.component}</span>
                          <span>•</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Performance Metrics</h2>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                aria-label="Select time range for performance metrics"
                title="Select time range for performance metrics"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Response Time Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <LineChart className="w-8 h-8 mr-2" />
                  <span>Response time chart would be displayed here</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Error Rate Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-8 h-8 mr-2" />
                  <span>Error rate chart would be displayed here</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "overview", name: "Overview", icon: Monitor },
                { id: "alerts", name: "Alerts", icon: Bell },
                { id: "performance", name: "Performance", icon: TrendingUp }
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
        </div>
      </div>
    </div>
  );
}
