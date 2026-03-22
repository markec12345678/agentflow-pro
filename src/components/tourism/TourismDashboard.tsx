/**
 * AgentFlow Pro - Tourism Dashboard Components
 * React components for tourism industry management
 */

import React, { useState, useEffect } from 'react';

// Types
interface TourismProperty {
  id: string;
  name: string;
  location: string;
  type: string;
  capacity: number;
  status: 'active' | 'inactive';
}

interface TourismStats {
  totalProperties: number;
  totalContent: number;
  totalBookings: number;
  averageRating: number;
}

export default function TourismDashboard() {
  const [properties, setProperties] = useState<TourismProperty[]>([]);
  const [stats, setStats] = useState<TourismStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTourismData();
  }, []);

  const fetchTourismData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now
      setProperties([
        {
          id: '1',
          name: 'Alpine Retreat',
          location: 'Bled, Slovenia',
          type: 'apartment',
          capacity: 4,
          status: 'active'
        },
        {
          id: '2',
          name: 'City Center Studio',
          location: 'Ljubljana, Slovenia',
          type: 'studio',
          capacity: 2,
          status: 'active'
        },
        {
          id: '3',
          name: 'Mountain View Villa',
          location: 'Kranjska Gora, Slovenia',
          type: 'villa',
          capacity: 8,
          status: 'inactive'
        }
      ]);
      
      setStats({
        totalProperties: 3,
        totalContent: 45,
        totalBookings: 128,
        averageRating: 4.7
      });
    } catch (err) {
      setError('Failed to load tourism data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tourism dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tourism Dashboard</h1>
          <p className="text-gray-600">Manage your properties and tourism content</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700">
          Add Property
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-sm">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Properties</h3>
            <div className="text-3xl font-bold text-blue-600">{stats.totalProperties}</div>
            <div className="text-sm text-gray-600">Total properties</div>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Content</h3>
            <div className="text-3xl font-bold text-green-600">{stats.totalContent}</div>
            <div className="text-sm text-gray-600">Generated content items</div>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Bookings</h3>
            <div className="text-3xl font-bold text-purple-600">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total bookings</div>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Rating</h3>
            <div className="text-3xl font-bold text-yellow-600">{stats.averageRating}</div>
            <div className="text-sm text-gray-600">Average rating</div>
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{property.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {property.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>📍 {property.location}</div>
                <div>🏠 {property.type}</div>
                <div>👥 {property.capacity} guests</div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                  Content
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Content</h3>
            <p className="text-gray-600 mb-4">Create descriptions, emails, and other content for your properties</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700">
              Generate Content
            </button>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Manage Bookings</h3>
            <p className="text-gray-600 mb-4">View and manage your property bookings</p>
            <button className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
              View Bookings
            </button>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Analytics</h3>
            <p className="text-gray-600 mb-4">View performance analytics and insights</p>
            <button className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
