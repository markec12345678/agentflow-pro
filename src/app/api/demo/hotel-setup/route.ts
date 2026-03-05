import { NextResponse } from 'next/server';

// Mock data za demonstracijo
const mockProperty = {
  id: "prop-1",
  name: "Hotel Pri Muri",
  address: "Cankarjeva ulica 5, 1000 Ljubljana",
  rooms: [
    { id: "room-1", name: "Soba 101", type: "single", capacity: 1, basePrice: 50 },
    { id: "room-2", name: "Soba 102", type: "double", capacity: 2, basePrice: 80 },
    { id: "room-3", name: "Apartma A", type: "apartment", capacity: 4, basePrice: 120 }
  ],
  reservations: [
    {
      id: "res-1",
      roomId: "room-1",
      guestName: "Janez Novak",
      checkIn: "2026-03-10",
      checkOut: "2026-03-12",
      status: "confirmed"
    },
    {
      id: "res-2", 
      roomId: "room-2",
      guestName: "Maja Horvat",
      checkIn: "2026-03-15",
      checkOut: "2026-03-18",
      status: "confirmed"
    }
  ]
};

export async function GET() {
  try {
    // V realni aplikaciji bi to prišlo iz baze:
    // const property = await prisma.property.findUnique({
    //   where: { id: propertyId },
    //   include: { rooms: true, reservations: true }
    // });

    // Za demonstracijo uporabimo mock data
    const today = new Date();
    
    // Izračunaj status sob
    const roomsWithStatus = mockProperty.rooms.map(room => {
      const isOccupied = mockProperty.reservations.some(reservation => 
        reservation.roomId === room.id &&
        new Date(reservation.checkIn) <= today &&
        new Date(reservation.checkOut) > today
      );
      
      return {
        ...room,
        status: isOccupied ? "Zasedeno" : "Prosto",
        currentGuest: isOccupied 
          ? mockProperty.reservations.find(r => r.roomId === room.id)?.guestName 
          : null
      };
    });

    const response = {
      success: true,
      data: {
        property: {
          name: mockProperty.name,
          address: mockProperty.address,
          totalRooms: mockProperty.rooms.length,
          availableRooms: roomsWithStatus.filter(r => r.status === "Prosto").length,
          occupiedRooms: roomsWithStatus.filter(r => r.status === "Zasedeno").length
        },
        rooms: roomsWithStatus,
        reservations: mockProperty.reservations,
        explanation: {
          kakoProgramVeda: {
            setup: "Uporabnik na začetku vnese število sob in njihove podatke",
            baza: "Podatki se shranijo v Room tabelo (ime, tip, kapaciteta, cena)",
            rezervacije: "Vsaka rezervacija se poveže s sobo preko roomId",
            status: "Program preverja datum preko checkIn/checkOut",
            realtime: "Vedno ve, katera soba je prosta/zasedena"
          },
          uporabnikVidi: {
            receptor: "Vidi seznam sob z statusi (Prosto/Zasedeno)",
            gost: "Izbira sobo preko spletnega vmesnika",
            avtomatika: "eTurizem sync avtomatsko posodobi status"
          }
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load hotel data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulacija dodajanja nove sobe
    const newRoom = {
      id: `room-${Date.now()}`,
      name: body.name,
      type: body.type,
      capacity: body.capacity,
      basePrice: body.basePrice,
      status: "Prosto"
    };

    // V realni aplikaciji:
    // await prisma.room.create({
    //   data: {
    //     propertyId: propertyId,
    //     name: body.name,
    //     type: body.type,
    //     capacity: body.capacity,
    //     basePrice: body.basePrice
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: "Soba uspešno dodana",
      room: newRoom
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to add room" },
      { status: 500 }
    );
  }
}
