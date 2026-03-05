"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  FileText, 
  Download, 
  Trash2, 
  Cookie, 
  Eye, 
  Clock, 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Users,
  Database,
  Mail,
  Calendar,
  Activity,
  RefreshCw,
  Save,
  Plus,
  Edit,
  Copy,
  ExternalLink
} from "lucide-react";

interface GDPRConsent {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  consentType: "marketing" | "analytics" | "cookies" | "data_processing";
  consentGiven: boolean;
  consentDate: string;
  ipAddress: string;
  userAgent: string;
}

interface DataRequest {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  requestType: "export" | "deletion";
  status: "pending" | "processing" | "completed" | "failed";
  requestDate: string;
  completedDate?: string;
  processedBy?: string;
  notes?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState("gdpr");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // GDPR Consent Data
  const [gdprConsents, setGdprConsents] = useState<GDPRConsent[]>([
    {
      id: "1",
      guestId: "guest_1",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      consentType: "marketing",
      consentGiven: true,
      consentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: "2",
      guestId: "guest_2",
      guestName: "Maja Horvat",
      guestEmail: "maja.horvat@email.com",
      consentType: "analytics",
      consentGiven: false,
      consentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0..."
    }
  ]);

  // Data Requests
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([
    {
      id: "1",
      guestId: "guest_1",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      requestType: "export",
      status: "completed",
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      processedBy: "Admin User",
      notes: "Data exported successfully"
    },
    {
      id: "2",
      guestId: "guest_2",
      guestName: "Maja Horvat",
      guestEmail: "maja.horvat@email.com",
      requestType: "deletion",
      status: "pending",
      requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      userId: "admin_1",
      userName: "Admin User",
      action: "Data Export",
      resource: "Guest Data",
      details: "Exported data for guest: Janez Novak",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: "2",
      userId: "admin_1",
      userName: "Admin User",
      action: "Settings Updated",
      resource: "Privacy Policy",
      details: "Updated privacy policy version",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0..."
    }
  ]);

  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "1",
      name: "Production API Key",
      key: "sk_live_1234567890abcdef",
      permissions: ["read", "write"],
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    },
    {
      id: "2",
      name: "Test API Key",
      key: "sk_test_abcdef1234567890",
      permissions: ["read"],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    }
  ]);

  // Settings
  const [privacyPolicy, setPrivacyPolicy] = useState(
    "# Privacy Policy\n\nWe are committed to protecting your privacy and personal data..."
  );
  
  const [cookieSettings, setCookieSettings] = useState({
    required: true,
    analytics: false,
    marketing: false,
    functional: true
  });

  const [sessionSettings, setSessionSettings] = useState({
    timeoutMinutes: 30,
    requireReauth: true,
    maxConcurrentSessions: 3
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleProcessDataRequest = async (requestId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDataRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: "completed" as const, completedDate: new Date().toISOString(), processedBy: "Admin User" }
        : req
    ));
    
    setLoading(false);
  };

  const handleRevokeConsent = async (consentId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setGdprConsents(prev => prev.map(consent => 
      consent.id === consentId 
        ? { ...consent, consentGiven: false }
        : consent
    ));
    
    setLoading(false);
  };

  const handleGenerateAPIKey = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newKey: APIKey = {
      id: `key_${Date.now()}`,
      name: "New API Key",
      key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      permissions: ["read"],
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    setApiKeys(prev => [...prev, newKey]);
    setLoading(false);
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, isActive: false }
        : key
    ));
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "processing": return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Security & GDPR</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                aria-label="Save settings"
                title="Save security settings"
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
                { id: "gdpr", name: "GDPR Consent", icon: Users },
                { id: "requests", name: "Data Requests", icon: FileText },
                { id: "policy", name: "Privacy Policy", icon: FileText },
                { id: "cookies", name: "Cookie Settings", icon: Cookie },
                { id: "audit", name: "Audit Log", icon: Eye },
                { id: "session", name: "Session Settings", icon: Clock },
                { id: "api", name: "API Keys", icon: Key }
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
            {/* GDPR Consent Tab */}
            {activeTab === "gdpr" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">GDPR Consent Tracking</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Consent Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {gdprConsents.map((consent) => (
                        <tr key={consent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {consent.guestName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {consent.guestEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                              {consent.consentType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              consent.consentGiven 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {consent.consentGiven ? 'Given' : 'Revoked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(consent.consentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {consent.consentGiven && (
                              <button
                                onClick={() => handleRevokeConsent(consent.id)}
                                disabled={loading}
                                aria-label="Revoke consent"
                                title="Revoke user consent"
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Data Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Data Requests</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Request Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dataRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {request.guestName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {request.guestEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.requestType === 'export' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {request.requestType === 'export' ? 'Export' : 'Deletion'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(request.status)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                                {request.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleProcessDataRequest(request.id)}
                                disabled={loading}
                                aria-label="Process data request"
                                title="Process user data request"
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {request.status === 'completed' && request.requestType === 'export' && (
                              <button 
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                aria-label="Download data export"
                                title="Download user data export"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Privacy Policy Tab */}
            {activeTab === "policy" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Privacy Policy Editor</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Privacy Policy Content
                  </label>
                  <textarea
                    rows={20}
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Enter your privacy policy content here..."
                    aria-label="Privacy policy content"
                    title="Enter privacy policy content"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cookie Settings Tab */}
            {activeTab === "cookies" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Cookie Consent Settings</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'required', label: 'Required Cookies', description: 'Essential for the website to function' },
                    { key: 'analytics', label: 'Analytics Cookies', description: 'Help us understand how visitors use our website' },
                    { key: 'marketing', label: 'Marketing Cookies', description: 'Used to track visitors across websites' },
                    { key: 'functional', label: 'Functional Cookies', description: 'Enable enhanced functionality and personalization' }
                  ].map((cookie) => (
                    <div key={cookie.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {cookie.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cookie.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setCookieSettings(prev => ({ ...prev, [cookie.key]: !prev[cookie.key as keyof typeof prev] }))}
                        aria-label={cookieSettings[cookie.key as keyof typeof cookieSettings] ? `Disable ${cookie.name}` : `Enable ${cookie.name}`}
                        title={cookieSettings[cookie.key as keyof typeof cookieSettings] ? `Disable ${cookie.name} cookie` : `Enable ${cookie.name} cookie`}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          cookieSettings[cookie.key as keyof typeof cookieSettings] ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            cookieSettings[cookie.key as keyof typeof cookieSettings] ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Audit Log</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.resource}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Session Settings Tab */}
            {activeTab === "session" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Session Timeout Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={sessionSettings.timeoutMinutes}
                      onChange={(e) => setSessionSettings(prev => ({ ...prev, timeoutMinutes: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter session timeout in minutes"
                      aria-label="Session timeout"
                      title="Enter session timeout duration (5-480 minutes)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Sessions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sessionSettings.maxConcurrentSessions}
                      onChange={(e) => setSessionSettings(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter maximum concurrent sessions"
                      aria-label="Max concurrent sessions"
                      title="Enter maximum number of concurrent sessions (1-10)"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireReauth"
                    checked={sessionSettings.requireReauth}
                    onChange={(e) => setSessionSettings(prev => ({ ...prev, requireReauth: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="requireReauth" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Require Re-authentication for Sensitive Actions
                  </label>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">API Key Management</h2>
                  <button
                    onClick={handleGenerateAPIKey}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Key</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Last Used
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {apiKeys.map((apiKey) => (
                        <tr key={apiKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {apiKey.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {apiKey.key.substring(0, 8)}...
                              </code>
                              <button 
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Copy API key"
                                title="Copy API key to clipboard"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {apiKey.permissions.map((permission) => (
                                <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              apiKey.isActive 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {apiKey.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                aria-label="Edit API key"
                                title="Edit API key details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {apiKey.isActive && (
                                <button
                                  onClick={() => handleRevokeAPIKey(apiKey.id)}
                                  disabled={loading}
                                  aria-label="Revoke API key"
                                  title="Revoke this API key"
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
