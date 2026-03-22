/**
 * AgentFlow Pro - Guest Portal Main Page
 * Welcome page for guests with property info and check-in button
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  description: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  wifiPassword?: string;
  doorCode?: string;
  emergencyContact?: string;
  houseRules?: string;
  imageUrl?: string;
}

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  status: string;
}

export default function GuestPortalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!propertyId || !token) return;

    fetch(`/api/guest/portal/${propertyId}?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setProperty(data.property);
        setReservation(data.upcomingReservation);
      })
      .catch(() => {
        toast.error("Napaka pri nalaganju");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [propertyId, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Nalaganje...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Neveljaven dostop</p>
          <p className="text-gray-500 mt-2">Prosimo, preverite povezavo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-600 mt-1">{property.address}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Message */}
        {reservation && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👋</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dobrodošli, {reservation.guestName}!
                </h2>
                <p className="text-gray-600">
                  Vaše prihajajoče bivanje: {new Date(reservation.checkIn).toLocaleDateString("sl-SI")} - {new Date(reservation.checkOut).toLocaleDateString("sl-SI")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`/guest/${propertyId}/checkin?token=${token}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
              >
                📍 Navodila za Check-in
              </a>
              <a
                href={`/guest/${propertyId}/register?token=${token}`}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-3 px-4 rounded-lg font-medium transition-colors"
              >
                📝 Digitalna Registracija
              </a>
            </div>
          </div>
        )}

        {/* Property Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 O Nastanitvi</h3>
          {property.imageUrl && (
            <img
              src={property.imageUrl}
              alt={property.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
        </div>

        {/* Check-in/Check-out Times */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🕐</span>
              <h3 className="text-lg font-semibold text-gray-900">Check-in</h3>
            </div>
            <p className="text-gray-700">Od: <strong>{property.checkInTime}</strong></p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧳</span>
              <h3 className="text-lg font-semibold text-gray-900">Check-out</h3>
            </div>
            <p className="text-gray-700">Do: <strong>{property.checkOutTime}</strong></p>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">⚠️ Pomembne Informacije</h3>
          
          {property.wifiPassword && (
            <div className="mb-3">
              <p className="text-amber-800">
                <strong>WiFi geslo:</strong> {property.wifiPassword}
              </p>
            </div>
          )}

          {property.doorCode && (
            <div className="mb-3">
              <p className="text-amber-800">
                <strong>Koda za vrata:</strong> {property.doorCode}
              </p>
              <p className="text-sm text-amber-600 mt-1">
                Koda bo aktivna 2 uri pred check-inom
              </p>
            </div>
          )}

          {property.emergencyContact && (
            <div className="mb-3">
              <p className="text-amber-800">
                <strong>Nujni kontakt:</strong> {property.emergencyContact}
              </p>
            </div>
          )}
        </div>

        {/* House Rules */}
        {property.houseRules && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📜 Hišni Red</h3>
            <p className="text-gray-700 whitespace-pre-line">{property.houseRules}</p>
          </div>
        )}

        {/* Contact Button */}
        <div className="pt-4">
          <a
            href={`/guest/${propertyId}/message?token=${token}`}
            className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
          >
            💬 Pošlji Sporočilo
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        <p>Powered by AgentFlow Pro</p>
      </div>
    </div>
  );
}
