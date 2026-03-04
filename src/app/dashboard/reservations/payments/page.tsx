"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Payment {
  id: string;
  reservationId: string;
  guestName: string;
  roomName: string;
  type: "deposit" | "balance" | "tourist_tax" | "extra" | "damage";
  amount: number;
  currency: string;
  method: "cash" | "card" | "transfer" | "online" | "other";
  status: "pending" | "completed" | "failed" | "refunded";
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reservation: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    channel: string;
    status: string;
  };
}

interface Reservation {
  id: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  channel: string;
  status: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  });
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [newPayment, setNewPayment] = useState({
    type: "balance",
    amount: 0,
    method: "cash",
    notes: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (selectedPropertyId) {
      fetchPayments();
      fetchReservations();
    }
  }, [selectedPropertyId, dateRange]);

  const fetchPayments = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/payments?propertyId=${selectedPropertyId}&start=${dateRange.start}&end=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        toast.error("Failed to fetch payments");
      }
    } catch (error) {
      toast.error("Error fetching payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch(`/api/tourism/reservations?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        toast.error("Failed to fetch reservations");
      }
    } catch (error) {
      toast.error("Error fetching reservations");
    }
  };

  const handleAddPayment = async () => {
    if (!selectedReservation || newPayment.amount <= 0) {
      toast.error("Please select a reservation and enter a valid amount");
      return;
    }

    try {
      const response = await fetch(`/api/reservations/${selectedReservation}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newPayment.type,
          amount: newPayment.amount,
          method: newPayment.method,
          notes: newPayment.notes,
          dueDate: newPayment.dueDate,
        }),
      });

      if (response.ok) {
        toast.success("Payment added successfully!");
        setShowAddPayment(false);
        setSelectedReservation("");
        setNewPayment({
          type: "balance",
          amount: 0,
          method: "cash",
          notes: "",
          dueDate: format(new Date(), "yyyy-MM-dd"),
        });
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add payment");
      }
    } catch (error) {
      toast.error("Error adding payment");
    }
  };

  const handlePaymentStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Payment status updated successfully!");
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update payment status");
      }
    } catch (error) {
      toast.error("Error updating payment status");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-blue-100 text-blue-800";
      case "balance":
        return "bg-green-100 text-green-800";
      case "tourist_tax":
        return "bg-purple-100 text-purple-800";
      case "extra":
        return "bg-orange-100 text-orange-800";
      case "damage":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "transfer":
        return "bg-purple-100 text-purple-800";
      case "online":
        return "bg-orange-100 text-orange-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === "all") return true;
    return payment.status === filter;
  });

  const paymentStats = {
    total: payments.length,
    completed: payments.filter(p => p.status === "completed").length,
    pending: payments.filter(p => p.status === "pending").length,
    failed: payments.filter(p => p.status === "failed").length,
    refunded: payments.filter(p => p.status === "refunded").length,
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = payments
    .filter(p => p.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter(p => p.status === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading payments...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">Track and manage reservation payments</p>
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">{paymentStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-green-600">{paymentStats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{paymentStats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-xl font-bold text-red-600">{paymentStats.failed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Refunded</p>
                    <p className="text-xl font-bold text-gray-600">{paymentStats.refunded}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">€{totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Amount</p>
                  <p className="text-2xl font-bold text-green-600">€{completedAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">€{pendingAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mr-2">Date Range:</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Payments</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Payment
                </button>
              </div>
            </div>

            {/* Add Payment Modal */}
            {showAddPayment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Add Payment</h3>
                      <button
                        onClick={() => setShowAddPayment(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reservation</label>
                        <select
                          value={selectedReservation}
                          onChange={(e) => setSelectedReservation(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select reservation</option>
                          {reservations.map((reservation) => (
                            <option key={reservation.id} value={reservation.id}>
                              {reservation.guestName} - {reservation.roomName} (€{reservation.totalPrice.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                        <select
                          value={newPayment.type}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="deposit">Deposit</option>
                          <option value="balance">Balance</option>
                          <option value="tourist_tax">Tourist Tax</option>
                          <option value="extra">Extra Charges</option>
                          <option value="damage">Damage</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                          value={newPayment.method}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="transfer">Bank Transfer</option>
                          <option value="online">Online</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={newPayment.dueDate}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Payment notes..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={() => setShowAddPayment(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddPayment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Payments ({filteredPayments.length})
                </h2>
              </div>
              
              {filteredPayments.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No payments found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900">{payment.guestName}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(payment.type)}`}>
                                  {payment.type.replace("_", " ").toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                  {payment.status.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.method)}`}>
                                  {payment.method.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{payment.roomName}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(payment.createdAt), "MMM d, yyyy")}
                                {payment.dueDate && ` • Due: ${format(new Date(payment.dueDate), "MMM d, yyyy")}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payment.reservation.channel} • €{payment.reservation.totalPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">€{payment.amount.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">{payment.currency}</p>
                            </div>
                          </div>
                        </div>
                        
                        {payment.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">{payment.notes}</p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {payment.status === "pending" && (
                              <button
                                onClick={() => handlePaymentStatusChange(payment.id, "completed")}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Mark Paid
                              </button>
                            )}
                            {payment.status === "completed" && (
                              <button
                                onClick={() => handlePaymentStatusChange(payment.id, "refunded")}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                          <Link
                            href={`/dashboard/reservations/${payment.reservationId}`}
                            className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                          >
                            View Reservation
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view payments</p>
          </div>
        )}
      </div>
    </div>
  );
}
