"use client";

import { useState } from "react";
import { toast } from "sonner";

interface BookingWidgetProps {
  propertyId: string;
  primaryColor?: string; // Default: #1e40af (blue)
  showPropertyInfo?: boolean; // Show property name/image
  onBookingComplete?: (reservationId: string) => void;
}

export function BookingWidget({
  propertyId,
  primaryColor = "#1e40af",
  showPropertyInfo = true,
  onBookingComplete,
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"search" | "rooms" | "details" | "payment">("search");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Izberite datum prihoda in odhoda");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/tourism/booking/availability?propertyId=${propertyId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
      );
      const data = await res.json();

      if (data.available && data.rooms.length > 0) {
        setStep("rooms");
      } else {
        toast.error("Na izbrane datume ni razpoložljivih sob");
      }
    } catch (error) {
      toast.error("Napaka pri iskanju");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room: any) => {
    setSelectedRoom(room);
    setStep("details");
  };

  const handleGuestDetails = async () => {
    if (!guestDetails.name || !guestDetails.email) {
      toast.error("Vnesite ime in email");
      return;
    }

    setStep("payment");
  };

  const handlePayment = async (paymentMethodId: string) => {
    setLoading(true);
    try {
      // Create reservation
      const res = await fetch("/api/tourism/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          roomId: selectedRoom.id,
          checkIn,
          checkOut,
          guests,
          guestDetails,
          paymentMethodId,
        }),
      });

      const data = await res.json();

      if (data.reservationId) {
        toast.success("Rezervacija uspešna! 🎉");
        onBookingComplete?.(data.reservationId);
        setStep("search");
        setCheckIn("");
        setCheckOut("");
        setGuests(2);
        setSelectedRoom(null);
      } else {
        toast.error(data.error || "Napaka pri rezervaciji");
      }
    } catch (error) {
      toast.error("Napaka pri obdelavi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      {showPropertyInfo && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <h2 className="text-2xl font-bold">Rezervirajte Svoje Bivanje</h2>
          <p className="text-blue-100 mt-1">Najboljša cena ob direktni rezervaciji</p>
        </div>
      )}

      {/* Step 1: Search */}
      {step === "search" && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prihod
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={minDate}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Odhod
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || minDate}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Število gostov
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "gost" : n <= 4 ? "gostje" : "gostov"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? "Iskanje..." : "Preveri Razpoložljivost"}
          </button>
        </div>
      )}

      {/* Step 2: Room Selection */}
      {step === "rooms" && (
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Izberite Sob
          </h3>
          <div className="space-y-3">
            {/* Rooms would be loaded from API */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Dvoposteljna Soba
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">2 gosta • Zajtrk vključen</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    €120
                  </div>
                  <div className="text-xs text-gray-500">na noč</div>
                </div>
              </div>
              <button
                onClick={() => handleBookRoom({ id: "room-1", name: "Dvoposteljna", price: 120 })}
                className="mt-3 w-full py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                Izberi To Sobo
              </button>
            </div>
          </div>
          <button
            onClick={() => setStep("search")}
            className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Nazaj
          </button>
        </div>
      )}

      {/* Step 3: Guest Details */}
      {step === "details" && (
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Podatki o Gostu
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ime in Priimek"
              value={guestDetails.name}
              onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={guestDetails.email}
              onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
            <input
              type="tel"
              placeholder="Telefon"
              value={guestDetails.phone}
              onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
            <textarea
              placeholder="Posebne zahteve (opcijsko)"
              value={guestDetails.notes}
              onChange={(e) => setGuestDetails({ ...guestDetails, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              rows={3}
            />
          </div>
          <button
            onClick={handleGuestDetails}
            className="w-full py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Nadaljuj na Plačilo
          </button>
          <button
            onClick={() => setStep("rooms")}
            className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Nazaj
          </button>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === "payment" && (
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Plačilo
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Soba:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedRoom?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Datum:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {checkIn} - {checkOut}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-medium text-gray-900 dark:text-white">Skupaj:</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  €{selectedRoom?.price || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Payment UI would integrate Stripe Elements here */}
          <button
            onClick={() => handlePayment("pm_mock")} // Mock payment method
            disabled={loading}
            className="w-full py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? "Obdelava..." : "Potrdi in Plačaj"}
          </button>
          <button
            onClick={() => setStep("details")}
            className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Nazaj
          </button>
        </div>
      )}
    </div>
  );
}
