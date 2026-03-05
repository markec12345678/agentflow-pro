"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: string;
  amenities: string[];
}

interface QuickReservationForm {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  notes: string;
  channel: string;
}

export default function QuickReservationPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  const [form, setForm] = useState<QuickReservationForm>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomId: "",
    checkIn: format(new Date(), "yyyy-MM-dd"),
    checkOut: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    guests: 1,
    totalPrice: 0,
    notes: "",
    channel: "direct"
  });

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (form.roomId && rooms.length > 0) {
      const selectedRoom = rooms.find(r => r.id === form.roomId);
      if (selectedRoom) {
        const nights = Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = selectedRoom.basePrice * nights;
        setForm(prev => ({ ...prev, totalPrice }));
      }
    }
  }, [form.roomId, form.checkIn, form.checkOut, rooms]);

  const fetchRooms = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/rooms/status?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
        setAvailableRooms(data.rooms?.filter((r: Room) => r.status === "available") || []);
      } else {
        toast.error("Failed to fetch rooms");
      }
    } catch (error) {
      toast.error("Error fetching rooms");
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedPropertyId || !form.roomId || !form.checkIn || !form.checkOut) return;
    
    try {
      const response = await fetch(`/api/tourism/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          roomId: form.roomId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForm(prev => ({ ...prev, totalPrice: data.totalPrice }));
      } else {
        toast.error("Room not available for selected dates");
      }
    } catch (error) {
      toast.error("Error checking availability");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId || !form.roomId) {
      toast.error("Please select a property and room");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch("/api/tourism/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          roomId: form.roomId,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          checkIn: new Date(form.checkIn).toISOString(),
          checkOut: new Date(form.checkOut).toISOString(),
          guests: form.guests,
          totalPrice: form.totalPrice,
          notes: form.notes,
          channel: form.channel,
          status: "confirmed"
        }),
      });

      if (response.ok) {
        const reservation = await response.json();
        toast.success("Reservation created successfully!");
        router.push(`/dashboard/reservations/${reservation.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create reservation");
      }
    } catch (error) {
      toast.error("Error creating reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof QuickReservationForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Quick Reservation</h1>
          <p className="text-gray-600 mt-2">Create a new reservation quickly</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && (
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Guest Information */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Guest Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      value={form.guestName}
                      onChange={(e) => handleInputChange("guestName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.guestEmail}
                      onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.guestPhone}
                      onChange={(e) => handleInputChange("guestPhone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+386 31 123 456"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.guests}
                      onChange={(e) => handleInputChange("guests", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      title="Number of guests"
                      placeholder="Enter number of guests"
                    />
                  </div>
                </div>
              </div>

              {/* Room Selection */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Room Selection</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room *
                    </label>
                    <select
                      value={form.roomId}
                      onChange={(e) => handleInputChange("roomId", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      title="Select room"
                    >
                      <option value="">Select a room</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {room.type} (€{room.basePrice.toFixed(2)}/night)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel *
                    </label>
                    <select
                      value={form.channel}
                      onChange={(e) => handleInputChange("channel", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      title="Select booking channel"
                    >
                      <option value="direct">Direct</option>
                      <option value="booking.com">Booking.com</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="expedia">Expedia</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                {availableRooms.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">No rooms available for the selected dates</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Dates</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      value={form.checkIn}
                      onChange={(e) => handleInputChange("checkIn", e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      title="Check-in date"
                      placeholder="Select check-in date"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      value={form.checkOut}
                      onChange={(e) => handleInputChange("checkOut", e.target.value)}
                      min={form.checkIn}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      title="Check-out date"
                      placeholder="Select check-out date"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={checkAvailability}
                    disabled={!form.roomId || !form.checkIn || !form.checkOut}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Availability
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Price Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-2xl font-bold text-gray-900">€{form.totalPrice.toFixed(2)}</span>
                  </div>
                  
                  {form.roomId && (
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const nights = Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                        const room = rooms.find(r => r.id === form.roomId);
                        return `${nights} night${nights !== 1 ? 's' : ''} × €${room?.basePrice.toFixed(2) || '0'}/night`;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-6">Additional Notes</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Special requests, dietary restrictions, etc."
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/dashboard/receptor"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !form.roomId || availableRooms.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Reservation"}
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to create a reservation</p>
          </div>
        )}
      </div>
    </div>
  );
}
