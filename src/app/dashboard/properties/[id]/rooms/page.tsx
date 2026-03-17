"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Bed, Users, Wifi, Car, Coffee, Tv, Wind, X, Save } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds?: number | null;
  basePrice?: number | null;
  amenities: string[];
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROOM_TYPES = [
  { value: "single", label: "Single Room", icon: <Bed className="w-4 h-4" /> },
  { value: "double", label: "Double Room", icon: <Bed className="w-4 h-4" /> },
  { value: "suite", label: "Suite", icon: <Bed className="w-4 h-4" /> },
  { value: "apartment", label: "Apartment", icon: <Bed className="w-4 h-4" /> },
  { value: "studio", label: "Studio", icon: <Bed className="w-4 h-4" /> },
  { value: "deluxe", label: "Deluxe Room", icon: <Bed className="w-4 h-4" /> }
];

const AMENITY_OPTIONS = [
  { id: "WiFi", icon: <Wifi className="w-4 h-4" /> },
  { id: "AC", icon: <Wind className="w-4 h-4" /> },
  { id: "TV", icon: <Tv className="w-4 h-4" /> },
  { id: "Balcony", icon: <Coffee className="w-4 h-4" /> },
  { id: "Kitchen", icon: <Coffee className="w-4 h-4" /> },
  { id: "Mini Bar", icon: <Coffee className="w-4 h-4" /> },
  { id: "Safe", icon: <Coffee className="w-4 h-4" /> },
  { id: "Workspace", icon: <Coffee className="w-4 h-4" /> }
];

export default function RoomsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRoom, setAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    type: "double",
    capacity: 2,
    beds: 1,
    basePrice: "",
    amenities: [] as string[],
    description: ""
  });

  useEffect(() => {
    if (propertyId) {
      fetchRooms();
    }
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/v1/tourism/properties/${propertyId}/rooms`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const saveRoom = async () => {
    if (!roomForm.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    try {
      const payload = {
        name: roomForm.name.trim(),
        type: roomForm.type,
        capacity: roomForm.capacity,
        beds: roomForm.beds || null,
        basePrice: roomForm.basePrice ? parseFloat(roomForm.basePrice) : null,
        amenities: roomForm.amenities,
        description: roomForm.description.trim() || null
      };

      let response;
      if (editingRoom) {
        response = await fetch(`/api/v1/tourism/properties/${propertyId}/rooms/${editingRoom}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/v1/tourism/properties/${propertyId}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(`Room ${editingRoom ? "updated" : "added"} successfully`);
        setAddingRoom(false);
        setEditingRoom(null);
        setRoomForm({
          name: "",
          type: "double",
          capacity: 2,
          beds: 1,
          basePrice: "",
          amenities: [],
          description: ""
        });
        fetchRooms();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save room");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tourism/properties/${propertyId}/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Room deleted successfully");
        fetchRooms();
      } else {
        toast.error("Failed to delete room");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room.id);
    setRoomForm({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      beds: room.beds || 1,
      basePrice: room.basePrice?.toString() || "",
      amenities: room.amenities,
      description: room.description || ""
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setRoomForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
              <p className="text-gray-600 mt-2">Manage your property rooms and accommodations</p>
            </div>
            <button
              onClick={() => setAddingRoom(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bed className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first room</p>
            <button
              onClick={() => setAddingRoom(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Room Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
                      <p className="text-sm text-gray-600">{ROOM_TYPES.find(t => t.value === room.type)?.label}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(room)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="Edit room"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRoom(room.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{room.capacity} guests</span>
                    </div>
                    {room.beds && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Beds:</span>
                        <span className="font-medium">{room.beds}</span>
                      </div>
                    )}
                    {room.basePrice && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">€{room.basePrice}/night</span>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {room.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {room.description && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Room Modal */}
        {(addingRoom || editingRoom) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h3>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                    <input
                      type="text"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Room 101, Suite A, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <select
                      value={roomForm.type}
                      onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Select room type"
                    >
                      {ROOM_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      placeholder="Number of guests"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
                    <input
                      type="number"
                      value={roomForm.beds}
                      onChange={(e) => setRoomForm({ ...roomForm, beds: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      placeholder="Number of beds"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (€/night)</label>
                    <input
                      type="number"
                      value={roomForm.basePrice}
                      onChange={(e) => setRoomForm({ ...roomForm, basePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                      placeholder="Optional override"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Room description and features..."
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AMENITY_OPTIONS.map((amenity) => (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`p-2 rounded-lg border text-sm transition-colors ${
                          roomForm.amenities.includes(amenity.id)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {amenity.icon}
                          <span>{amenity.id}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveRoom}
                  disabled={!roomForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingRoom ? "Update Room" : "Add Room"}
                </button>
                <button
                  onClick={() => {
                    setAddingRoom(false);
                    setEditingRoom(null);
                    setRoomForm({
                      name: "",
                      type: "double",
                      capacity: 2,
                      beds: 1,
                      basePrice: "",
                      amenities: [],
                      description: ""
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
