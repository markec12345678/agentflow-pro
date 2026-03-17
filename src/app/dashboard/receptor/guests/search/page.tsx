"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth?: string;
  documentType?: string;
  documentId?: string;
  riskScore: string;
  isVip: boolean;
  gdprConsent: boolean;
  preferences?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reservations: {
    id: string;
    checkIn: string;
    checkOut: string;
    roomNumber: string;
    status: string;
    totalPrice: number;
    channel: string;
  }[];
}

export default function GuestSearchPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "email" | "phone" | "reservation">("name");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    if (selectedPropertyId && searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchGuests();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPropertyId, searchTerm, searchType]);

  const searchGuests = async () => {
    if (!selectedPropertyId || searchTerm.length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tourism/guests/search?propertyId=${selectedPropertyId}&type=${searchType}&query=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests || []);
      } else {
        toast.error("Failed to search guests");
      }
    } catch (error) {
      toast.error("Error searching guests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGuests();
  };

  const getRiskScoreColor = (riskScore: string) => {
    switch (riskScore) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Guest Search</h1>
          <p className="text-gray-600 mt-2">Find guest information and reservation history</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && (
          <>
            {/* Search Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-6">Search Guests</h2>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Term
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={
                        searchType === "name" ? "Enter guest name..." :
                        searchType === "email" ? "Enter email address..." :
                        searchType === "phone" ? "Enter phone number..." :
                        "Enter reservation ID..."
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Type
                    </label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Select search type"
                    >
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="reservation">Reservation ID</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading || searchTerm.length < 2}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Results */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results {guests.length > 0 && `(${guests.length})`}
                </h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Searching guests...</p>
                </div>
              ) : guests.length === 0 && searchTerm.length >= 2 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No guests found matching your search</p>
                </div>
              ) : guests.length === 0 && searchTerm.length < 2 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">Enter at least 2 characters to search</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {guests.map((guest) => (
                    <div key={guest.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900">{guest.name}</h3>
                                {guest.isVip && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    VIP
                                  </span>
                                )}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskScoreColor(guest.riskScore)}`}>
                                  {guest.riskScore.toUpperCase()} RISK
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500">{guest.email}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{guest.phone}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{guest.countryCode}</span>
                              </div>
                              {guest.documentId && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm text-gray-500">{guest.documentType}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{guest.documentId}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {guest.reservations.length} reservation{guest.reservations.length !== 1 ? 's' : ''}
                              </p>
                              <p className="text-sm text-gray-500">
                                Since {format(new Date(guest.createdAt), "MMM yyyy")}
                              </p>
                            </div>
                          </div>
                          
                          {guest.preferences && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">Preferences: {guest.preferences}</p>
                            </div>
                          )}
                          
                          {guest.notes && (
                            <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-gray-600">Notes: {guest.notes}</p>
                            </div>
                          )}
                          
                          {/* Recent Reservations */}
                          {guest.reservations.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Reservations</h4>
                              <div className="space-y-2">
                                {guest.reservations.slice(0, 3).map((reservation) => (
                                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {reservation.roomNumber} • {format(new Date(reservation.checkIn), "MMM d")} - {format(new Date(reservation.checkOut), "MMM d")}
                                      </p>
                                      <p className="text-sm text-gray-500">{reservation.channel}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                        {reservation.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedGuest(guest)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            View Details
                          </button>
                          <Link
                            href={`/dashboard/guests/${guest.id}`}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Full Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guest Details Modal */}
            {selectedGuest && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Guest Details</h2>
                      <button
                        onClick={() => setSelectedGuest(null)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Close guest details"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{selectedGuest.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{selectedGuest.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{selectedGuest.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-medium">{selectedGuest.countryCode}</p>
                          </div>
                          {selectedGuest.dateOfBirth && (
                            <div>
                              <p className="text-sm text-gray-500">Date of Birth</p>
                              <p className="font-medium">{format(new Date(selectedGuest.dateOfBirth), "MMM d, yyyy")}</p>
                            </div>
                          )}
                          {selectedGuest.documentId && (
                            <div>
                              <p className="text-sm text-gray-500">Document</p>
                              <p className="font-medium">{selectedGuest.documentType} - {selectedGuest.documentId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                        <div className="flex space-x-4">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskScoreColor(selectedGuest.riskScore)}`}>
                            {selectedGuest.riskScore.toUpperCase()} RISK
                          </span>
                          {selectedGuest.isVip && (
                            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                              VIP GUEST
                            </span>
                          )}
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedGuest.gdprConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            GDPR {selectedGuest.gdprConsent ? 'Consent' : 'No Consent'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Notes */}
                      {selectedGuest.notes && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-700">{selectedGuest.notes}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Preferences */}
                      {selectedGuest.preferences && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-700">{selectedGuest.preferences}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* All Reservations */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservation History</h3>
                        <div className="space-y-2">
                          {selectedGuest.reservations.map((reservation) => (
                            <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {reservation.roomNumber} • {format(new Date(reservation.checkIn), "MMM d, yyyy")} - {format(new Date(reservation.checkOut), "MMM d, yyyy")}
                                </p>
                                <p className="text-sm text-gray-500">{reservation.channel}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                  {reservation.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to search guests</p>
          </div>
        )}
      </div>
    </div>
  );
}
