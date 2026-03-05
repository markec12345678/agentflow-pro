"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  Bed, 
  Users, 
  Wifi, 
  Wind, 
  Tv, 
  Coffee, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Loader2, 
  Calendar,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: number | null;
  basePrice: number | null;
  amenities: string[];
  description: string | null;
  blockedDates: any[];
}

const AMENITY_OPTIONS = [
  { id: "WiFi", icon: <Wifi className="w-3.5 h-3.5" /> },
  { id: "AC", icon: <Wind className="w-3.5 h-3.5" /> },
  { id: "TV", icon: <Tv className="w-3.5 h-3.5" /> },
  { id: "Balcony", icon: <Coffee className="w-3.5 h-3.5" /> },
  { id: "Kitchen", icon: <Coffee className="w-3.5 h-3.5" /> },
];

export default function PropertyRoomsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id: propertyId } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "double",
    capacity: 2,
    beds: 1,
    basePrice: "",
    amenities: [] as string[],
    description: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/properties/${propertyId}/rooms`);
      const data = await res.json();
      if (res.ok) {
        setRooms(data);
      } else {
        toast.error(data.error || "Napaka pri nalaganju sob");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRooms();
    }
  }, [status, fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tourism/properties/${propertyId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      if (res.ok) {
        toast.success("Soba uspešno dodana");
        setIsAdding(false);
        setNewRoom({ name: "", type: "double", capacity: 2, beds: 1, basePrice: "", amenities: [], description: "" });
        fetchRooms();
      } else {
        const data = await res.json();
        toast.error(data.error || "Napaka pri shranjevanju");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/properties")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
              title="Nazaj na sobe"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sobni Inventar</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Upravljajte s sobami in razpoložljivostjo.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Prekliči" : "Nova soba"}
          </button>
        </div>

        {/* Add Room Form */}
        {isAdding && (
          <div className="mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-xl animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Dodaj novo sobo
            </h2>
            <form onSubmit={handleCreateRoom} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ime sobe / Številka</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    required
                    title="Ime sobe"
                    placeholder="Npr. Soba 101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tip nastanitve</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                    title="Izberite tip sobe"
                  >
                    <option value="single">Single Room</option>
                    <option value="double">Double Room</option>
                    <option value="suite">Suite</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Osebe</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})}
                      min="1"
                      required
                      title="Število oseb"
                      placeholder="Vnesite št. oseb"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Postelje</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={newRoom.beds}
                      onChange={(e) => setNewRoom({...newRoom, beds: parseInt(e.target.value)})}
                      min="1"
                      required
                      title="Število postelj"
                      placeholder="Vnesite št. postelj"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Osnovna cena (€)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    value={newRoom.basePrice}
                    onChange={(e) => setNewRoom({...newRoom, basePrice: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    required
                    title="Osnovna cena na noč"
                    placeholder="Vnesite ceno"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Opremljenost (Amenities)</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAmenity(opt.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          newRoom.amenities.includes(opt.id)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {opt.icon}
                        {opt.id}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Shrani sobo
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse"></div>
            ))
          ) : rooms.length > 0 ? (
            rooms.map((room) => (
              <div key={room.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group">
                <div className="relative h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {room.type}
                  </div>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-blue-600 transition-colors" title="Uredi sobo">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-red-600 transition-colors" title="Izbriši sobo">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{room.name}</h3>
                      <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="w-3 h-3" />
                          <span>{room.beds || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Cena od</p>
                      <p className="text-lg font-black text-blue-600">€{room.basePrice || 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {room.amenities.map(amenity => (
                      <span key={amenity} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-md text-[10px] font-medium border border-gray-100 dark:border-gray-700">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {room.blockedDates.length > 0 ? `${room.blockedDates.length} blokiranih dni` : "Brez blokad"}
                    </span>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    Koledar & Cene
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-lg">Ni dodanih sob</h3>
              <p className="text-gray-500 mt-1">Dodajte svojo prvo sobo za to nastanitev.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
