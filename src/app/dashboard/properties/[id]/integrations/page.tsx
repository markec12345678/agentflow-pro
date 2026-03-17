"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Globe, 
  CreditCard, 
  Database, 
  Settings, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  Key, 
  Plug,
  RotateCcw,
  ExternalLink,
  Shield,
  Building
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  eturizemId?: string | null;
  eturizemSyncStatus?: string | null;
  eturizemSyncedAt?: string | null;
  eturizemLastError?: string | null;
  rnoId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationStatus {
  name: string;
  status: "connected" | "disconnected" | "error" | "pending";
  lastSync?: string;
  error?: string;
  actions?: string[];
}

export default function IntegrationsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  useEffect(() => {
    if (property) {
      updateIntegrationsStatus();
    }
  }, [property]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/v1/tourism/properties/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
      }
    } catch (error) {
      toast.error("Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const updateIntegrationsStatus = () => {
    if (!property) return;

    const status: IntegrationStatus[] = [
      {
        name: "eTurizem",
        status: property.eturizemSyncStatus === "success" ? "connected" : 
               property.eturizemSyncStatus === "error" ? "error" : 
               property.eturizemId ? "pending" : "disconnected",
        lastSync: property.eturizemSyncedAt,
        error: property.eturizemLastError,
        actions: ["sync", "configure"]
      },
      {
        name: "AJPES",
        status: property.rnoId ? "connected" : "disconnected",
        actions: ["configure"]
      },
      {
        name: "Stripe Payments",
        status: "disconnected", // Would check Stripe connection
        actions: ["connect", "configure"]
      },
      {
        name: "Channel Manager",
        status: "disconnected", // Would check channel manager connections
        actions: ["connect", "configure"]
      }
    ];

    setIntegrations(status);
  };

  const handleSync = async (integrationName: string) => {
    if (integrationName === "eTurizem") {
      setSyncing("eturizem");
      try {
        const response = await fetch(`/api/v1/integration/eturizem/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });

        if (response.ok) {
          toast.success("eTurizem sync started");
          fetchProperty();
        } else {
          const error = await response.json();
          toast.error(error.error || "Sync failed");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setSyncing(null);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Check className="w-5 h-5 text-green-600" />;
      case "disconnected":
        return <X className="w-5 h-5 text-gray-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <RefreshCw className="w-5 h-5 text-yellow-600" />;
      default:
        return <X className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "disconnected":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIntegrationIcon = (name: string) => {
    switch (name) {
      case "eTurizem":
        return <Globe className="w-6 h-6" />;
      case "AJPES":
        return <Building className="w-6 h-6" />;
      case "Stripe Payments":
        return <CreditCard className="w-6 h-6" />;
      case "Channel Manager":
        return <Database className="w-6 h-6" />;
      default:
        return <Plug className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">Manage your property integrations and connections</p>
        </div>

        {/* Integration Cards */}
        <div className="space-y-6">
          {integrations.map((integration) => (
            <div key={integration.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4 text-blue-600">
                    {getIntegrationIcon(integration.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(integration.status)}
                      <span className="ml-2 text-sm font-medium capitalize">{integration.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(integration.status)}`}>
                  {integration.status === "connected" ? "Active" : 
                   integration.status === "disconnected" ? "Not Connected" :
                   integration.status === "error" ? "Error" : "Pending"}
                </div>
              </div>

              {/* Integration Details */}
              <div className="space-y-4">
                {/* eTurizem Details */}
                {integration.name === "eTurizem" && (
                  <div className="border-l-4 border-blue-200 pl-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Property ID:</span>
                        <span className="ml-2 text-gray-600">{property?.eturizemId || "Not set"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Last Sync:</span>
                        <span className="ml-2 text-gray-600">
                          {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : "Never"}
                        </span>
                      </div>
                    </div>
                    {integration.error && (
                      <div className="mt-2 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {integration.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* AJPES Details */}
                {integration.name === "AJPES" && (
                  <div className="border-l-4 border-blue-200 pl-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">RNO ID:</span>
                      <span className="ml-2 text-gray-600">{property?.rnoId || "Not set"}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {integration.actions?.includes("sync") && (
                    <button
                      onClick={() => handleSync(integration.name)}
                      disabled={syncing === "eturizem"}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {syncing === "eturizem" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Now
                        </>
                      )}
                    </button>
                  )}
                  
                  {integration.actions?.includes("configure") && (
                    <button
                      onClick={() => toast.info(`Configure ${integration.name} - Feature coming soon`)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </button>
                  )}
                  
                  {integration.actions?.includes("connect") && (
                    <button
                      onClick={() => toast.info(`Connect to ${integration.name} - Feature coming soon`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plug className="w-4 h-4 mr-2" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            API Keys & Security
          </h3>
          
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-200 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">eTurizem API Key</h4>
                  <p className="text-sm text-gray-600">Required for automatic synchronization</p>
                </div>
                <button
                  onClick={() => toast.info("API key management - Feature coming soon")}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Manage
                </button>
              </div>
            </div>

            <div className="border-l-4 border-yellow-200 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Stripe API Keys</h4>
                  <p className="text-sm text-gray-600">Payment processing integration</p>
                </div>
                <button
                  onClick={() => toast.info("API key management - Feature coming soon")}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Logs */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Sync Logs
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm">Property data synced successfully</span>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            
            {property?.eturizemLastError && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{property.eturizemLastError}</span>
                </div>
                <span className="text-xs text-gray-500">Yesterday</span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm">Initial connection established</span>
              </div>
              <span className="text-xs text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" />
            Integration Help
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">eTurizem Integration</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Automatic property synchronization</li>
                <li>• Real-time availability updates</li>
                <li>• Booking management</li>
                <li>• Guest data synchronization</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Configure your eTurizem account</li>
                <li>• Generate API keys</li>
                <li>• Connect your property</li>
                <li>• Test synchronization</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <button
              onClick={() => window.open("https://eturizem.si/help", "_blank")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Visit eTurizem Help Center →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
