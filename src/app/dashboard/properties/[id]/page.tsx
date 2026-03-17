"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  location?: string;
  type?: string;
  capacity?: number;
  description?: string;
  basePrice?: number;
  currency?: string;
  seasonRates?: any;
  pricingRules?: any;
  reservationAutoApprovalRules?: any;
  eturizemId?: string;
  rnoId?: number;
  eturizemSyncStatus?: string;
  eturizemSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms: number;
    reservations: number;
    guests: number;
  };
  rooms?: Array<{
    id: string;
    name: string;
    type: string;
    capacity: number;
    basePrice?: number;
  }>;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/v1/tourism/properties/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
      } else {
        toast.error("Property not found");
        router.push("/dashboard/properties");
      }
    } catch (error) {
      toast.error("Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-800">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Properties
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-gray-600 mt-2">{property.location || "No location set"}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/properties/${property.id}/edit`}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Property
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{property._count?.rooms || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservations</p>
                <p className="text-2xl font-bold text-gray-900">{property._count?.reservations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Guests</p>
                <p className="text-2xl font-bold text-gray-900">{property._count?.guests || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                property.eturizemSyncStatus === "success" 
                  ? "bg-green-100"
                  : property.eturizemSyncStatus === "error"
                  ? "bg-red-100"
                  : "bg-yellow-100"
              }`}>
                <svg className={`w-6 h-6 ${
                  property.eturizemSyncStatus === "success" 
                    ? "text-green-600"
                    : property.eturizemSyncStatus === "error"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">eTurizem</p>
                <p className="text-lg font-bold text-gray-900">
                  {property.eturizemSyncStatus === "success" ? "✅ Synced" : 
                   property.eturizemSyncStatus === "error" ? "❌ Error" : 
                   "⚠️ Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {["overview", "rooms", "pricing", "amenities", "policies", "blocked-dates", "integrations"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-lg">{property.type || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Capacity</p>
                      <p className="text-lg">{property.capacity || "N/A"} guests</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Base Price</p>
                      <p className="text-lg">
                        {property.basePrice ? `${property.basePrice} ${property.currency || "EUR"}` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="text-lg">{new Date(property.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {property.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === "rooms" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Rooms</h3>
                  <Link href={`/dashboard/properties/${property.id}/rooms/create`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      + Add Room
                    </button>
                  </Link>
                </div>
                
                {property.rooms && property.rooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.rooms.map((room) => (
                      <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600">{room.type}</p>
                        <p className="text-sm text-gray-600">Capacity: {room.capacity} guests</p>
                        {room.basePrice && (
                          <p className="text-sm text-gray-600">
                            Price: {room.basePrice} {property.currency || "EUR"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No rooms added yet</p>
                    <Link href={`/dashboard/properties/${property.id}/rooms/create`}>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        + Add Your First Room
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === "pricing" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Base Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Base Price</p>
                      <p className="text-lg">
                        {property.basePrice ? `${property.basePrice} ${property.currency || "EUR"} per night` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Currency</p>
                      <p className="text-lg">{property.currency || "EUR"}</p>
                    </div>
                  </div>
                </div>

                {property.seasonRates && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Seasonal Rates</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(property.seasonRates, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {property.pricingRules && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Rules</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(property.pricingRules, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Amenities Tab */}
            {activeTab === "amenities" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Amenities</h3>
                  <Link href={`/dashboard/properties/${property.id}/amenities`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Manage Amenities
                    </button>
                  </Link>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Manage amenities in dedicated amenities page</p>
                  <Link href={`/dashboard/properties/${property.id}/amenities`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Go to Amenities
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === "policies" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Property Policies</h3>
                  <Link href={`/dashboard/properties/${property.id}/policies`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Manage Policies
                    </button>
                  </Link>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Manage policies in dedicated policies page</p>
                  <Link href={`/dashboard/properties/${property.id}/policies`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Go to Policies
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Blocked Dates Tab */}
            {activeTab === "blocked-dates" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Blocked Dates</h3>
                  <Link href={`/dashboard/properties/${property.id}/blocked-dates`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Manage Blocked Dates
                    </button>
                  </Link>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Manage blocked dates in dedicated blocked dates page</p>
                  <Link href={`/dashboard/properties/${property.id}/blocked-dates`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Go to Blocked Dates
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">eTurizem Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className="text-lg">
                        {property.eturizemSyncStatus === "success" ? "✅ Connected" : 
                         property.eturizemSyncStatus === "error" ? "❌ Error" : 
                         "⚠️ Not Connected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Property ID</p>
                      <p className="text-lg">{property.eturizemId || "Not set"}</p>
                    </div>
                    {property.eturizemSyncedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Sync</p>
                        <p className="text-lg">{new Date(property.eturizemSyncedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AJPES Registration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600">RNO ID</p>
                      <p className="text-lg">{property.rnoId || "Not set"}</p>
                    </div>
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
