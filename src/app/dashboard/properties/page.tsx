"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  location?: string;
  type?: string;
  capacity?: number;
  basePrice?: number;
  currency?: string;
  description?: string;
  eturizemSyncStatus?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms: number;
    reservations: number;
    guests: number;
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/tourism/properties");
      const data = await response.json();
      if (data.properties) {
        setProperties(data.properties);
      }
    } catch (error) {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600 mt-2">Manage your hotels and accommodations</p>
          </div>
          <Link href="/dashboard/properties/create">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Add Property
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No properties found" : "No properties yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Get started by adding your first property"
              }
            </p>
            {!searchTerm && (
              <Link href="/dashboard/properties/create">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  + Add Your First Property
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Property Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
                      <p className="text-sm text-gray-600">{property.location || "No location set"}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      property.eturizemSyncStatus === "success" 
                        ? "bg-green-100 text-green-800"
                        : property.eturizemSyncStatus === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {property.eturizemSyncStatus === "success" ? "eTurizem ✅" : 
                       property.eturizemSyncStatus === "error" ? "eTurizem ❌" : 
                       "eTurizem ⚠️"}
                    </span>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{property.type || "Not set"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{property.capacity || "N/A"} guests</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">
                        {property.basePrice ? `${property.basePrice} ${property.currency || "EUR"}` : "Not set"}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{property._count?.rooms || 0}</div>
                      <div className="text-xs text-gray-600">Rooms</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{property._count?.reservations || 0}</div>
                      <div className="text-xs text-gray-600">Bookings</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-600">{property._count?.guests || 0}</div>
                      <div className="text-xs text-gray-600">Guests</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/dashboard/properties/${property.id}`}>
                      <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                    </Link>
                    <Link href={`/dashboard/properties/${property.id}/edit`}>
                      <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Edit
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
