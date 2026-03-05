"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Mail, 
  AlertTriangle, 
  Github, 
  Globe, 
  Network, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Settings, 
  TestTube, 
  RefreshCw,
  Activity,
  Zap,
  Shield,
  GitBranch,
  WorldWideWeb,
  Bug,
  Eye
} from "lucide-react";

// Types
interface IntegrationStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error" | "testing";
  lastTestTime: string | null;
  responseTime: number | null;
  errorMessage?: string;
  configured: boolean;
  description: string;
  features: string[];
  configuration?: {
    apiKey?: string;
    baseUrl?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
}

interface TestResult {
  integrationId: string;
  status: "success" | "error";
  responseTime: number;
  timestamp: string;
  details?: any;
  error?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      id: "stripe",
      name: "Stripe",
      icon: <CreditCard className="w-5 h-5" />,
      status: "connected",
      lastTestTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      responseTime: 245,
      configured: true,
      description: "Payment processing and billing",
      features: ["Payments", "Subscriptions", "Webhooks", "Billing"],
      configuration: {
        apiKey: "•••••••••••••••",
        webhookUrl: "https://agentflow.pro/api/webhooks/stripe"
      }
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      icon: <Mail className="w-5 h-5" />,
      status: "connected",
      lastTestTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      responseTime: 189,
      configured: true,
      description: "Email delivery and marketing",
      features: ["Email Sending", "Templates", "Analytics", "Marketing"],
      configuration: {
        apiKey: "•••••••••••••••"
      }
    },
    {
      id: "sentry",
      name: "Sentry",
      icon: <AlertTriangle className="w-5 h-5" />,
      status: "connected",
      lastTestTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      responseTime: 156,
      configured: true,
      description: "Error tracking and monitoring",
      features: ["Error Tracking", "Performance", "Release Tracking", "Alerts"],
      configuration: {
        dsn: "•••••••••••••••",
        environment: "production"
      }
    },
    {
      id: "github",
      name: "GitHub",
      icon: <Github className="w-5 h-5" />,
      status: "connected",
      lastTestTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      responseTime: 423,
      configured: true,
      description: "Code repository and deployments",
      features: ["Git Repository", "Actions", "Deployments", "Issues"],
      configuration: {
        token: "•••••••••••••••",
        repository: "agentflow-pro"
      }
    },
    {
      id: "vercel",
      name: "Vercel",
      icon: <Globe className="w-5 h-5" />,
      status: "connected",
      lastTestTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      responseTime: 134,
      configured: true,
      description: "Hosting and deployment platform",
      features: ["Hosting", "Deployments", "Analytics", "Edge Functions"],
      configuration: {
        projectId: "prj_agentflow",
        teamId: "team_abc123"
      }
    },
    {
      id: "firecrawl",
      name: "Firecrawl",
      icon: <Network className="w-5 h-5" />,
      status: "error",
      lastTestTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      responseTime: null,
      errorMessage: "API rate limit exceeded",
      configured: true,
      description: "Web scraping and data extraction",
      features: ["Web Scraping", "Data Extraction", "Crawling", "API"],
      configuration: {
        apiKey: "•••••••••••••••"
      }
    }
  ]);

  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const handleTestConnection = async (integrationId: string) => {
    setTesting(integrationId);
    
    // Update status to testing
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: "testing" }
        : integration
    ));

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    const success = Math.random() > 0.2; // 80% success rate
    const responseTime = Math.floor(100 + Math.random() * 500);
    
    const result: TestResult = {
      integrationId,
      status: success ? "success" : "error",
      responseTime,
      timestamp: new Date().toISOString(),
      details: success ? {
        statusCode: 200,
        message: "Connection successful",
        version: "v2.1.0"
      } : null,
      error: success ? null : "Connection timeout"
    };

    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

    // Update integration status
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? {
            ...integration,
            status: success ? "connected" : "error",
            lastTestTime: result.timestamp,
            responseTime,
            errorMessage: success ? undefined : result.error
          }
        : integration
    ));

    setTesting(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "testing":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-50 text-green-800 border-green-200";
      case "error":
        return "bg-red-50 text-red-800 border-red-200";
      case "testing":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Integrations</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  integrations.forEach(integration => {
                    if (integration.configured) {
                      handleTestConnection(integration.id);
                    }
                  });
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Activity className="w-4 h-4" />
                <span>Test All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Integrations List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Connected Services</h2>
              
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {integration.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {integration.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(integration.status)}`}>
                              {integration.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {integration.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {integration.features.map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {integration.lastTestTime 
                                  ? new Date(integration.lastTestTime).toLocaleString("sl-SI")
                                  : "Never tested"
                                }
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Activity className="w-3 h-3" />
                              <span>{formatResponseTime(integration.responseTime)}</span>
                            </span>
                          </div>

                          {integration.errorMessage && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              {integration.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleTestConnection(integration.id)}
                          disabled={testing === integration.id || !integration.configured}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                          {testing === integration.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Testing...</span>
                            </>
                          ) : (
                            <>
                              <TestTube className="w-4 h-4" />
                              <span>Test</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setSelectedIntegration(
                            selectedIntegration === integration.id ? null : integration.id
                          )}
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Config</span>
                        </button>
                      </div>
                    </div>

                    {/* Configuration Details */}
                    {selectedIntegration === integration.id && integration.configuration && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Configuration</h4>
                        <div className="space-y-2">
                          {Object.entries(integration.configuration).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                                {typeof value === 'string' && value.includes('•••') ? (
                                  <span className="flex items-center space-x-1">
                                    <span>{value}</span>
                                    <button 
                                      className="text-blue-500 hover:text-blue-700"
                                      aria-label="View secret value"
                                      title="View secret value"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </span>
                                ) : (
                                  String(value)
                                )}
                              </span>
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

          {/* Test Results */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Recent Test Results</h2>
              
              {testResults.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No test results yet. Test an integration to see results here.
                </p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => {
                    const integration = integrations.find(i => i.id === result.integrationId);
                    return (
                      <div
                        key={`${result.integrationId}-${index}`}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {integration?.icon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {integration?.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(result.timestamp).toLocaleString("sl-SI")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {result.status === "success" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${
                                result.status === "success" ? "text-green-600" : "text-red-600"
                              }`}>
                                {result.status === "success" ? "Success" : "Failed"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatResponseTime(result.responseTime)}
                            </p>
                          </div>
                        </div>
                        
                        {result.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            {result.error}
                          </p>
                        )}
                        
                        {result.details && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <pre className="bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Integration Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Integrations</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {integrations.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Connected</span>
                  <span className="font-medium text-green-600">
                    {integrations.filter(i => i.status === "connected").length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Errors</span>
                  <span className="font-medium text-red-600">
                    {integrations.filter(i => i.status === "error").length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Configured</span>
                  <span className="font-medium text-blue-600">
                    {integrations.filter(i => i.configured).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatResponseTime(
                      integrations
                        .filter(i => i.responseTime !== null)
                        .reduce((sum, i) => sum + (i.responseTime || 0), 0) / 
                      integrations.filter(i => i.responseTime !== null).length || null
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
