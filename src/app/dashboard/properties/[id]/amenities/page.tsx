"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, X, Wifi, Car, Waves, Utensils, Dumbbell, Bath, Coffee, Tv, Wind } from "lucide-react";

interface Amenity {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

const AMENITY_CATEGORIES = {
  connectivity: {
    name: "Connectivity",
    icon: <Wifi className="w-5 h-5" />,
    options: ["WiFi", "Ethernet", "Phone", "Smart TV"]
  },
  parking: {
    name: "Parking",
    icon: <Car className="w-5 h-5" />,
    options: ["Free Parking", "Garage", "Street Parking", "Valet Parking"]
  },
  facilities: {
    name: "Facilities", 
    icon: <Waves className="w-5 h-5" />,
    options: ["Bazen", "Spa", "Restavracija", "Fitnes", "Sona", "Bar"]
  },
  comfort: {
    name: "Comfort",
    icon: <Coffee className="w-5 h-5" />,
    options: ["Klima", "Mini Bar", "Sejf", "Terasa", "Balkon"]
  },
  entertainment: {
    name: "Entertainment",
    icon: <Tv className="w-5 h-5" />,
    options: ["TV", "Netflix", "Gaming Console", "Knjižnica", "Igre"]
  },
  wellness: {
    name: "Wellness",
    icon: <Bath className="w-5 h-5" />,
    options: ["Wellness", "Masaža", "Savna", "Parna kopel", "Jacuzzi"]
  }
};

export default function AmenitiesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customAmenity, setCustomAmenity] = useState({ name: "", category: "facilities" });

  useEffect(() => {
    if (propertyId) {
      fetchAmenities();
    }
  }, [propertyId]);

  const fetchAmenities = async () => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/amenities`);
      if (response.ok) {
        const data = await response.json();
        setAmenities(data);
      }
    } catch (error) {
      toast.error("Failed to load amenities");
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = async (name: string, category: string) => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/amenities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category }),
      });

      if (response.ok) {
        toast.success("Amenity added successfully");
        fetchAmenities();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add amenity");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const removeAmenity = async (amenityId: string) => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/amenities/${amenityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Amenity removed successfully");
        fetchAmenities();
      } else {
        toast.error("Failed to remove amenity");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const addCustomAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmenity.name.trim()) return;

    await addAmenity(customAmenity.name.trim(), customAmenity.category);
    setCustomAmenity({ name: "", category: "facilities" });
    setAddingCustom(false);
  };

  const isAmenityAdded = (name: string) => {
    return amenities.some(a => a.name.toLowerCase() === name.toLowerCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {Object.keys(AMENITY_CATEGORIES).map((key) => (
                <div key={key} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Amenities</h1>
          <p className="text-gray-600 mt-2">Manage your property amenities and facilities</p>
        </div>

        {/* Current Amenities */}
        {amenities.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Amenities ({amenities.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between bg-blue-50 text-blue-800 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm font-medium truncate">{amenity.name}</span>
                  <button
                    onClick={() => removeAmenity(amenity.id)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amenity Categories */}
        <div className="space-y-6">
          {Object.entries(AMENITY_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">
                    {category.options.filter(opt => isAmenityAdded(opt)).length} / {category.options.length} selected
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {category.options.map((option) => {
                  const isAdded = isAmenityAdded(option);
                  return (
                    <button
                      key={option}
                      onClick={() => isAdded ? null : addAmenity(option, categoryKey)}
                      disabled={isAdded}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isAdded
                          ? "bg-green-100 text-green-800 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800"
                      }`}
                    >
                      {isAdded ? "✓ " : ""}{option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Amenity */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Custom Amenity</h3>
            {!addingCustom && (
              <button
                onClick={() => setAddingCustom(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Custom
              </button>
            )}
          </div>

          {addingCustom && (
            <form onSubmit={addCustomAmenity} className="flex gap-3">
              <input
                type="text"
                value={customAmenity.name}
                onChange={(e) => setCustomAmenity({ ...customAmenity, name: e.target.value })}
                placeholder="Enter custom amenity name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <select
                value={customAmenity.category}
                onChange={(e) => setCustomAmenity({ ...customAmenity, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(AMENITY_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!customAmenity.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingCustom(false);
                  setCustomAmenity({ name: "", category: "facilities" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
