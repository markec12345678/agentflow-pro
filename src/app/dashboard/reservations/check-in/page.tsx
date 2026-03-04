"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface CheckInReservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  channel: string;
  status: string;
  notes?: string;
  guestId?: string;
  roomId?: string;
}

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
}

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: number;
  basePrice: number;
  amenities: string[];
  photos: string[];
  status: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<CheckInReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<CheckInReservation | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [checkInData, setCheckInData] = useState({
    actualCheckInTime: format(new Date(), "HH:mm"),
    notes: "",
    specialRequests: "",
    roomCondition: "clean",
    amenitiesProvided: [] as string[],
    paymentCollected: false,
    paymentAmount: 0,
    paymentMethod: "",
  });

  useEffect(() => {
    if (selectedPropertyId) {
      fetchTodayCheckIns();
    }
  }, [selectedPropertyId]);

  const fetchTodayCheckIns = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/tourism/reservations/check-ins?propertyId=${selectedPropertyId}&date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        toast.error("Failed to fetch today's check-ins");
      }
    } catch (error) {
      toast.error("Error fetching check-ins");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReservation = async (reservation: CheckInReservation) => {
    setSelectedReservation(reservation);
    
    try {
      // Fetch guest details
      if (reservation.guestId) {
        const guestResponse = await fetch(`/api/tourism/guests/${reservation.guestId}`);
        if (guestResponse.ok) {
          const guestData = await guestResponse.json();
          setGuest(guestData.guest);
        }
      }

      // Fetch room details
      if (reservation.roomId) {
        const roomResponse = await fetch(`/api/tourism/rooms/${reservation.roomId}`);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData.room);
        }
      }
    } catch (error) {
      toast.error("Error fetching reservation details");
    }
  };

  const handleCheckIn = async () => {
    if (!selectedReservation) return;
    
    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCheckInTime: checkInData.actualCheckInTime,
          notes: checkInData.notes,
          specialRequests: checkInData.specialRequests,
          roomCondition: checkInData.roomCondition,
          amenitiesProvided: checkInData.amenitiesProvided,
          paymentCollected: checkInData.paymentCollected,
          paymentAmount: checkInData.paymentAmount,
          paymentMethod: checkInData.paymentMethod,
        }),
      });

      if (response.ok) {
        toast.success("Guest checked in successfully!");
        setSelectedReservation(null);
        setGuest(null);
        setRoom(null);
        fetchTodayCheckIns();
        
        // Reset form
        setCheckInData({
          actualCheckInTime: format(new Date(), "HH:mm"),
          notes: "",
          specialRequests: "",
          roomCondition: "clean",
          amenitiesProvided: [],
          paymentCollected: false,
          paymentAmount: 0,
          paymentMethod: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check in guest");
      }
    } catch (error) {
      toast.error("Error checking in guest");
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setCheckInData(prev => ({
      ...prev,
      amenitiesProvided: prev.amenitiesProvided.includes(amenity)
        ? prev.amenitiesProvided.filter(a => a !== amenity)
        : [...prev.amenitiesProvided, amenity]
    }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Guest Check-in</h1>
          <p className="text-gray-600 mt-2">Process guest check-ins for today</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Check-ins List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Today's Check-ins ({reservations.length})
                </h2>
              </div>
              
              {reservations.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No check-ins scheduled for today</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedReservation?.id === reservation.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleSelectReservation(reservation)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{reservation.guestName}</h3>
                          <p className="text-sm text-gray-500">{reservation.roomName} • {reservation.roomType}</p>
                          <p className="text-sm text-gray-500">{reservation.channel}</p>
                          <p className="text-sm text-gray-500">€{reservation.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Check-in Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Check-in Process</h2>
              </div>
              
              {selectedReservation ? (
                <div className="p-6">
                  {/* Guest Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{selectedReservation.guestName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedReservation.guestEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{selectedReservation.guestPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Room</p>
                          <p className="font-medium">{selectedReservation.roomName}</p>
                        </div>
                      </div>
                      
                      {guest && (
                        <div className="mt-4 flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskScoreColor(guest.riskScore)}`}>
                            {guest.riskScore.toUpperCase()} RISK
                          </span>
                          {guest.isVip && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              VIP
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Check-in Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-in Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Actual Check-in Time</label>
                        <input
                          type="time"
                          value={checkInData.actualCheckInTime}
                          onChange={(e) => setCheckInData(prev => ({ ...prev, actualCheckInTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Condition</label>
                        <select
                          value={checkInData.roomCondition}
                          onChange={(e) => setCheckInData(prev => ({ ...prev, roomCondition: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="clean">Clean</option>
                          <option value="needs_cleaning">Needs Cleaning</option>
                          <option value="minor_issues">Minor Issues</option>
                          <option value="major_issues">Major Issues</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                        <textarea
                          value={checkInData.specialRequests}
                          onChange={(e) => setCheckInData(prev => ({ ...prev, specialRequests: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Any special requests or notes..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Notes</label>
                        <textarea
                          value={checkInData.notes}
                          onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Check-in notes..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  {room && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities Provided</h3>
                      <div className="space-y-2">
                        {room.amenities.map((amenity) => (
                          <label key={amenity} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={checkInData.amenitiesProvided.includes(amenity)}
                              onChange={() => handleAmenityToggle(amenity)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Collection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Collection</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={checkInData.paymentCollected}
                          onChange={(e) => setCheckInData(prev => ({ ...prev, paymentCollected: e.target.checked }))}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Payment Collected</label>
                      </div>
                      
                      {checkInData.paymentCollected && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                              <input
                                type="number"
                                value={checkInData.paymentAmount}
                                onChange={(e) => setCheckInData(prev => ({ ...prev, paymentAmount: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                              <select
                                value={checkInData.paymentMethod}
                                onChange={(e) => setCheckInData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select method</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="transfer">Bank Transfer</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckIn}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete Check-in
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-gray-500">Select a reservation to start check-in process</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view check-ins</p>
          </div>
        )}
      </div>
    </div>
  );
}
