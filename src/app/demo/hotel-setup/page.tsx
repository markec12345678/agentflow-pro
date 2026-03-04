"use client";

import { useState } from 'react';

export default function HotelSetupDemo() {
  const [property, setProperty] = useState({
    name: "Hotel Pri Muri",
    rooms: [
      { id: "1", name: "Soba 101", type: "single", capacity: 1, basePrice: 50 },
      { id: "2", name: "Soba 102", type: "double", capacity: 2, basePrice: 80 },
      { id: "3", name: "Apartma A", type: "apartment", capacity: 4, basePrice: 120 }
    ],
    reservations: [
      { id: "1", roomId: "1", guestName: "Janez Novak", checkIn: "2026-03-10", checkOut: "2026-03-12", status: "confirmed" },
      { id: "2", roomId: "2", guestName: "Maja Horvat", checkIn: "2026-03-15", checkOut: "2026-03-18", status: "confirmed" }
    ]
  });

  const addRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: "Nova soba",
      type: "double",
      capacity: 2,
      basePrice: 80
    };
    setProperty(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
  };

  const updateRoom = (roomId: string, field: string, value: any) => {
    setProperty(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId ? { ...room, [field]: value } : room
      )
    }));
  };

  const getRoomStatus = (roomId: string) => {
    const today = new Date();
    const reservation = property.reservations.find(r => 
      r.roomId === roomId && 
      new Date(r.checkIn) <= today && 
      new Date(r.checkOut) > today
    );
    return reservation ? "Zasedeno" : "Prosto";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hotel Setup - Kako program ve, kaj ima</h1>
        
        {/* 1. Property Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🏨 Podatki o hotelu</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ime hotela</label>
              <input 
                type="text" 
                value={property.name}
                onChange={(e) => setProperty({...property, name: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Vnesite ime hotela"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Naslov</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                placeholder="Vnesite naslov"
              />
            </div>
          </div>
        </div>

        {/* 2. Rooms Setup */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🛏️ Nastavitve sob</h2>
          <div className="space-y-4">
            {property.rooms.map((room) => (
              <div key={room.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-5 gap-4">
                  <input 
                    type="text" 
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                    placeholder="Ime sobe"
                    className="p-2 border rounded"
                  />
                  <select 
                    value={room.type}
                    onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="single">Enoposteljna</option>
                    <option value="double">Dvoposteljna</option>
                    <option value="apartment">Apartma</option>
                  </select>
                  <input 
                    type="number" 
                    value={room.capacity}
                    onChange={(e) => updateRoom(room.id, 'capacity', parseInt(e.target.value))}
                    placeholder="Št. oseb"
                    className="p-2 border rounded"
                  />
                  <input 
                    type="number" 
                    value={room.basePrice}
                    onChange={(e) => updateRoom(room.id, 'basePrice', parseFloat(e.target.value))}
                    placeholder="Cena/nač"
                    className="p-2 border rounded"
                  />
                  <div className={`p-2 rounded text-center font-medium ${
                    getRoomStatus(room.id) === "Prosto" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {getRoomStatus(room.id)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addRoom} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            + Dodaj sobo
          </button>
        </div>

        {/* 3. Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Trenutno stanje</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{property.rooms.length}</div>
              <div className="text-sm text-gray-600">Skupaj sob</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {property.rooms.filter(r => getRoomStatus(r.id) === "Prosto").length}
              </div>
              <div className="text-sm text-gray-600">Proste sobe</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {property.rooms.filter(r => getRoomStatus(r.id) === "Zasedeno").length}
              </div>
              <div className="text-sm text-gray-600">Zasedene sobe</div>
            </div>
          </div>
        </div>

        {/* 4. How it works explanation */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💡 Kako program ve, kaj ima</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">1️⃣</span>
              <div>
                <strong>Setup vprašalnik:</strong> Ko se hotel prvič prijavi, program vpraša "Koliko sob imate?" in uporabnik vnese podatke
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">2️⃣</span>
              <div>
                <strong>Shranjevanje v bazo:</strong> Podatki se shranijo v tabelo <code>Room</code> (ime, tip, kapaciteta, cena)
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">3️⃣</span>
              <div>
                <strong>Rezervacije:</strong> Vsaka rezervacija se shrani v tabelo <code>Reservation</code> s povezavo na sobo
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">4️⃣</span>
              <div>
                <strong>Avtomatsko preverjanje:</strong> Program vedno ve, katera soba je prosta/zasedena preko datumov rezervacij
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">5️⃣</span>
              <div>
                <strong>Enostavno za uporabnika:</strong> Receptor vidi "Soba 101 - Prosto" in lahko takoj rezervira
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
