"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  deposit?: number;
  touristTax?: number;
  channel: string;
  status: "confirmed" | "cancelled" | "pending" | "checked_in" | "checked_out";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  guestId?: string;
  roomId?: string;
  propertyId?: string;
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

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "guest" | "payments" | "actions">("details");

  useEffect(() => {
    if (selectedPropertyId && params.id) {
      fetchReservationDetails();
    }
  }, [selectedPropertyId, params.id]);

  const fetchReservationDetails = async () => {
    if (!selectedPropertyId || !params.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/reservations/${params.id}?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setReservation(data.reservation);
        setGuest(data.guest);
        setRoom(data.room);
        setPayments(data.payments || []);
      } else {
        toast.error("Failed to fetch reservation details");
      }
    } catch (error) {
      toast.error("Error fetching reservation details");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!params.id) return;
    
    try {
      const response = await fetch(`/api/reservations/${params.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Guest checked in successfully!");
        fetchReservationDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check in guest");
      }
    } catch (error) {
      toast.error("Error checking in guest");
    }
  };

  const handleCheckOut = async () => {
    if (!params.id) return;
    
    try {
      const response = await fetch(`/api/reservations/${params.id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Guest checked out successfully!");
        fetchReservationDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check out guest");
      }
    } catch (error) {
      toast.error("Error checking out guest");
    }
  };

  const handleCancel = async () => {
    if (!params.id) return;
    
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    
    try {
      const response = await fetch(`/api/reservations/${params.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Reservation cancelled successfully!");
        fetchReservationDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to cancel reservation");
      }
    } catch (error) {
      toast.error("Error cancelling reservation");
    }
  };

  const handleAddPayment = async (paymentData: { type: string; amount: number; method: string; notes?: string }) => {
    if (!params.id) return;
    
    try {
      const response = await fetch(`/api/reservations/${params.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        toast.success("Payment added successfully!");
        fetchReservationDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add payment");
      }
    } catch (error) {
      toast.error("Error adding payment");
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
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "checked_out":
        return "bg-gray-100 text-gray-800";
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
  const remainingBalance = (reservation?.totalPrice || 0) - totalPaid;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/reservations" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Reservations
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Reservation Details</h1>
          <p className="text-gray-600 mt-2">Manage reservation information and guest details</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && reservation ? (
          <>
            {/* Reservation Header */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Reservation #{reservation.id.slice(-8)}</h2>
                  <p className="text-gray-600">{reservation.guestName} • {reservation.roomName}</p>
                  <p className="text-gray-600">
                    {format(new Date(reservation.checkIn), "MMM d, yyyy")} - {format(new Date(reservation.checkOut), "MMM d, yyyy")}
                  </p>
                  <p className="text-gray-600">{reservation.channel}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                    {reservation.status.replace("_", " ").toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Total Price</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("guest")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "guest"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Guest Information
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "payments"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Payments ({payments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "actions"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Actions
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservation Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
                          <p className="text-gray-900">{reservation.guestName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                          <p className="text-gray-900">{reservation.roomName} ({reservation.roomType})</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                          <p className="text-gray-900">{format(new Date(reservation.checkIn), "EEEE, MMMM d, yyyy")}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                          <p className="text-gray-900">{format(new Date(reservation.checkOut), "EEEE, MMMM d, yyyy")}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                          <p className="text-gray-900">{reservation.channel}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                          <p className="text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Deposit</label>
                          <p className="text-gray-900">€{reservation.deposit?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tourist Tax</label>
                          <p className="text-gray-900">€{reservation.touristTax?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                          <p className="text-gray-900">{format(new Date(reservation.createdAt), "MMM d, yyyy HH:mm")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {reservation.notes && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700">{reservation.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Room Details */}
                    {room && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Details</h3>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{room.name}</h4>
                              <p className="text-sm text-gray-500">{room.type} • {room.capacity} guests • {room.beds || 0} beds</p>
                              <p className="text-sm text-gray-500">Base Price: €{room.basePrice.toFixed(2)}/night</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{room.basePrice.toFixed(2)}/night</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "guest" && (
                  <div className="space-y-6">
                    {guest ? (
                      <>
                        {/* Guest Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                              <p className="text-gray-900">{guest.name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                              <p className="text-gray-900">{guest.email}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                              <p className="text-gray-900">{guest.phone}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                              <p className="text-gray-900">{guest.countryCode}</p>
                            </div>
                            {guest.dateOfBirth && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                <p className="text-gray-900">{format(new Date(guest.dateOfBirth), "MMM d, yyyy")}</p>
                              </div>
                            )}
                            {guest.documentId && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                                <p className="text-gray-900">{guest.documentType} - {guest.documentId}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Guest Status */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Status</h3>
                          <div className="flex space-x-4">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskScoreColor(guest.riskScore)}`}>
                              {guest.riskScore.toUpperCase()} RISK
                            </span>
                            {guest.isVip && (
                              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                                VIP GUEST
                              </span>
                            )}
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${guest.gdprConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              GDPR {guest.gdprConsent ? 'Consent' : 'No Consent'}
                            </span>
                          </div>
                        </div>

                        {/* Preferences */}
                        {guest.preferences && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-gray-700">{guest.preferences}</p>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {guest.notes && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Notes</h3>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-gray-700">{guest.notes}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Guest information not available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                      <button
                        onClick={() => {
                          const amount = prompt("Enter payment amount:");
                          if (amount && !isNaN(Number(amount))) {
                            handleAddPayment({
                              type: "balance",
                              amount: Number(amount),
                              method: "cash",
                              notes: "Manual payment"
                            });
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Payment
                      </button>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="text-xl font-bold text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Paid Amount</p>
                          <p className="text-xl font-bold text-green-600">€{totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Remaining Balance</p>
                          <p className={`text-xl font-bold ${remainingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                            €{remainingBalance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payments List */}
                    {payments.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No payments recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.map((payment) => (
                          <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{payment.type}</h4>
                                <p className="text-sm text-gray-500">{payment.method}</p>
                                <p className="text-sm text-gray-500">{format(new Date(payment.paidAt), "MMM d, yyyy HH:mm")}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">€{payment.amount.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{payment.currency}</p>
                              </div>
                            </div>
                            {payment.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">{payment.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "actions" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Reservation Actions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Check-in */}
                      {reservation.status === "confirmed" && (
                        <div className="border border-gray-200 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-2">Check-in Guest</h4>
                          <p className="text-sm text-gray-600 mb-4">Mark the guest as checked in</p>
                          <button
                            onClick={handleCheckIn}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Check In
                          </button>
                        </div>
                      )}

                      {/* Check-out */}
                      {reservation.status === "checked_in" && (
                        <div className="border border-gray-200 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-2">Check-out Guest</h4>
                          <p className="text-sm text-gray-600 mb-4">Mark the guest as checked out</p>
                          <button
                            onClick={handleCheckOut}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Check Out
                          </button>
                        </div>
                      )}

                      {/* Cancel */}
                      {(reservation.status === "confirmed" || reservation.status === "pending") && (
                        <div className="border border-gray-200 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 mb-2">Cancel Reservation</h4>
                          <p className="text-sm text-gray-600 mb-4">Cancel this reservation</p>
                          <button
                            onClick={handleCancel}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Edit */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-2">Edit Reservation</h4>
                        <p className="text-sm text-gray-600 mb-4">Modify reservation details</p>
                        <Link
                          href={`/dashboard/reservations/${params.id}/edit`}
                          className="block w-full px-4 py-2 bg-gray-600 text-white text-center rounded-lg hover:bg-gray-700"
                        >
                          Edit
                        </Link>
                      </div>

                      {/* Print */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-2">Print Reservation</h4>
                        <p className="text-sm text-gray-600 mb-4">Print reservation details</p>
                        <button
                          onClick={() => window.print()}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Print
                        </button>
                      </div>

                      {/* Send Email */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-2">Send Confirmation</h4>
                        <p className="text-sm text-gray-600 mb-4">Email confirmation to guest</p>
                        <button
                          onClick={() => {
                            toast.info("Email functionality coming soon");
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Send Email
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view reservation details</p>
          </div>
        )}
      </div>
    </div>
  );
}
