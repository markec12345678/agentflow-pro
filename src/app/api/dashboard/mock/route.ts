/**
 * Mock API Routes for UI Testing
 * Use this to test UI without database
 */

import { NextResponse } from 'next/server';

// Mock data
const mockDashboard = {
  kpis: {
    occupancyRate: 78,
    revPAR: 142,
    ADR: 182,
    directBookings: 35,
    tasksPending: 12,
  },
  arrivals: [
    { id: '1', guestName: 'John Smith', room: '201', time: '14:00', source: 'booking.com', price: 180 },
    { id: '2', guestName: 'Maria Garcia', room: 'Suite 5', time: '15:00', source: 'airbnb', price: 250 },
    { id: '3', guestName: 'Thomas Mueller', room: '105', time: '16:00', source: 'direct', price: 150 },
  ],
  departures: [
    { id: '4', guestName: 'Anna Novak', room: '302', time: '10:00', source: 'expedia', price: 200 },
    { id: '5', guestName: 'Pierre Dubois', room: '201', time: '09:00', source: 'booking.com', price: 180 },
  ],
  tasks: [
    { id: '1', title: 'Clean Room 201', type: 'cleaning', priority: 'high', due: '12:00', assignedTo: 'Maria' },
    { id: '2', title: 'Check-in: John Smith', type: 'check-in', priority: 'high', due: '14:00' },
    { id: '3', title: 'Fix AC in Room 105', type: 'maintenance', priority: 'medium', due: '15:00', assignedTo: 'Janez' },
  ],
};

// GET /api/dashboard/mock
export async function GET() {
  // Add delay to simulate real API
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return NextResponse.json(mockDashboard);
}
