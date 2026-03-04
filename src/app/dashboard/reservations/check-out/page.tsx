"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface CheckOutReservation {
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

interface Payment {
  id: string;
  type: string;
  amount: number;
  currency: string;
  paidAt: string;
  method: string;
  notes?: string;
}

export default function CheckOutPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<CheckOutReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<CheckOutReservation | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkOutData, setCheckOutData] = useState({
    actualCheckOutTime: format(new Date(), "HH:mm"),
    notes: "",
    roomCondition: "clean",
    damages: [] as string[],
    damageCost: 0,
    additionalCharges: [] as Array<{
      description: string;
      amount: number;
    }>,
    finalPaymentCollected: false,
    finalPaymentAmount: 0,
    finalPaymentMethod: "",
    guestSatisfaction: 5,
    guestFeedback: "",
    followUpRequired: false,
    followUpNotes: "",
  });

  useEffect(() => {
    if (selectedPropertyId) {
      fetchTodayCheckOuts();
    }
  }, [selectedPropertyId]);

  const fetchTodayCheckOuts = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/tourism/reservations/check-outs?propertyId=${selectedPropertyId}&date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        toast.error("Failed to fetch today's check-outs");
      }
    } catch (error) {
      toast.error("Error fetching check-outs");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReservation = async (reservation: CheckOutReservation) => {
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

      // Fetch payment history
      const paymentResponse = await fetch(`/api/tourism/reservations/${reservation.id}/payments`);
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPayments(paymentData.payments || []);
      }
    } catch (error) {
      toast.error("Error fetching reservation details");
    }
  };

  const handleCheckOut = async () => {
    if (!selectedReservation) return;
    
    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCheckOutTime: checkOutData.actualCheckOutTime,
          notes: checkOutData.notes,
          roomCondition: checkOutData.roomCondition,
          damages: checkOutData.damages,
          damageCost: checkOutData.damageCost,
          additionalCharges: checkOutData.additionalCharges,
          finalPaymentCollected: checkOutData.finalPaymentCollected,
          finalPaymentAmount: checkOutData.finalPaymentAmount,
          finalPaymentMethod: checkOutData.finalPaymentMethod,
          guestSatisfaction: checkOutData.guestSatisfaction,
          guestFeedback: checkOutData.guestFeedback,
          followUpRequired: checkOutData.followUpRequired,
          followUpNotes: checkOutData.followUpNotes,
        }),
      });

      if (response.ok) {
        toast.success("Guest checked out successfully!");
        setSelectedReservation(null);
        setGuest(null);
        setRoom(null);
        setPayments([]);
        fetchTodayCheckOuts();
        
        // Reset form
        setCheckOutData({
          actualCheckOutTime: format(new Date(), "HH:mm"),
          notes: "",
          roomCondition: "clean",
          damages: [],
          damageCost: 0,
          additionalCharges: [],
          finalPaymentCollected: false,
          finalPaymentAmount: 0,
          finalPaymentMethod: "",
          guestSatisfaction: 5,
          guestFeedback: "",
          followUpRequired: false,
          followUpNotes: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check out guest");
      }
    } catch (error) {
      toast.error("Error checking out guest");
    }
  };

  const handleDamageToggle = (damage: string) => {
    setCheckOutData(prev => ({
      ...prev,
      damages: prev.damages.includes(damage)
        ? prev.damages.filter(d => d !== damage)
        : [...prev.damages, damage]
    }));
  };

  const handleAddCharge = () => {
    const description = prompt("Enter charge description:");
    const amount = prompt("Enter charge amount:");
    
    if (description && amount && !isNaN(Number(amount))) {
      setCheckOutData(prev => ({
        ...prev,
        additionalCharges: [...prev.additionalCharges, {
          description,
          amount: Number(amount)
        }]
      }));
    }
  };

  const handleRemoveCharge = (index: number) => {
    setCheckOutData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
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

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAdditionalCharges = checkOutData.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const remainingBalance = (selectedReservation?.totalPrice || 0) + totalAdditionalCharges + checkOutData.damageCost - totalPaid;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading check-outs...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Guest Check-out</h1>
          <p className="text-gray-600 mt-2">Process guest check-outs for today</p>
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
            {/* Today's Check-outs List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Today's Check-outs ({reservations.length})
                </h2>
              </div>
              
              {reservations.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4V7m0 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <p className="mt-2 text-gray-500">No check-outs scheduled for today</p>
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
                            {reservation.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Check-out Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Check-out Process</h2>
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
                          <p className="text-sm text-gray-600">Room</p>
                          <p className="font-medium">{selectedReservation.roomName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Check-in</p>
                          <p className="font-medium">{format(new Date(selectedReservation.checkIn), "MMM d")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Check-out</p>
                          <p className="font-medium">{format(new Date(selectedReservation.checkOut), "MMM d")}</p>
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

                  {/* Payment Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Reservation Total</span>
                          <span className="font-medium">€{selectedReservation.totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Paid Amount</span>
                          <span className="font-medium text-green-600">€{totalPaid.toFixed(2)}</span>
                        </div>
                        {totalAdditionalCharges > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Additional Charges</span>
                            <span className="font-medium">€{totalAdditionalCharges.toFixed(2)}</span>
                          </div>
                        )}
                        {checkOutData.damageCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Damage Costs</span>
                            <span className="font-medium text-red-600">€{checkOutData.damageCost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-900">Remaining Balance</span>
                            <span className={`font-bold ${remainingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                              €{remainingBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Check-out Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-out Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Actual Check-out Time</label>
                        <input
                          type="time"
                          value={checkOutData.actualCheckOutTime}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, actualCheckOutTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Condition</label>
                        <select
                          value={checkOutData.roomCondition}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, roomCondition: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="clean">Clean</option>
                          <option value="minor_dirt">Minor Dirt</option>
                          <option value="needs_cleaning">Needs Cleaning</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Notes</label>
                        <textarea
                          value={checkOutData.notes}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Check-out notes..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Damages */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Damages</h3>
                    <div className="space-y-2">
                      {["Towel", "Bedding", "TV Remote", "Mini Bar", "Furniture", "Window", "Bathroom", "Other"].map((damage) => (
                        <label key={damage} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={checkOutData.damages.includes(damage)}
                            onChange={() => handleDamageToggle(damage)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{damage}</span>
                        </label>
                      ))}
                      {checkOutData.damages.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Damage Cost</label>
                          <input
                            type="number"
                            value={checkOutData.damageCost}
                            onChange={(e) => setCheckOutData(prev => ({ ...prev, damageCost: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Charges */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Additional Charges</h3>
                      <button
                        onClick={handleAddCharge}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add Charge
                      </button>
                    </div>
                    
                    {checkOutData.additionalCharges.length === 0 ? (
                      <p className="text-sm text-gray-500">No additional charges</p>
                    ) : (
                      <div className="space-y-2">
                        {checkOutData.additionalCharges.map((charge, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{charge.description}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">€{charge.amount.toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveCharge(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Guest Feedback */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Feedback</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Satisfaction Rating</label>
                        <select
                          value={checkOutData.guestSatisfaction}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, guestSatisfaction: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5 - Excellent</option>
                          <option value={4}>4 - Good</option>
                          <option value={3}>3 - Average</option>
                          <option value={2}>2 - Poor</option>
                          <option value={1}>1 - Very Poor</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Guest Feedback</label>
                        <textarea
                          value={checkOutData.guestFeedback}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, guestFeedback: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Guest feedback..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Follow-up */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Required</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={checkOutData.followUpRequired}
                          onChange={(e) => setCheckOutData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Follow-up required</label>
                      </div>
                      
                      {checkOutData.followUpRequired && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Notes</label>
                          <textarea
                            value={checkOutData.followUpNotes}
                            onChange={(e) => setCheckOutData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Follow-up notes..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Payment */}
                  {remainingBalance > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Payment</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={checkOutData.finalPaymentCollected}
                            onChange={(e) => setCheckOutData(prev => ({ ...prev, finalPaymentCollected: e.target.checked }))}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700">Final payment collected</label>
                        </div>
                        
                        {checkOutData.finalPaymentCollected && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                              <input
                                type="number"
                                value={checkOutData.finalPaymentAmount}
                                onChange={(e) => setCheckOutData(prev => ({ ...prev, finalPaymentAmount: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                              <select
                                value={checkOutData.finalPaymentMethod}
                                onChange={(e) => setCheckOutData(prev => ({ ...prev, finalPaymentMethod: e.target.value }))}
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
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckOut}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Complete Check-out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4V7m0 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <p className="mt-2 text-gray-500">Select a reservation to start check-out process</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view check-outs</p>
          </div>
        )}
      </div>
    </div>
  );
}
