/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReceptorDashboard } from '../src/app/dashboard/receptor/page'
import { DirectorDashboard } from '../src/app/dashboard/director/page'
import { RoomManagement } from '../src/app/dashboard/rooms/page'
import { ReservationSystem } from '../src/app/dashboard/reservations/page'
import { GuestDatabase } from '../src/app/dashboard/guests/page'

// Mock API responses
const mockApiResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status === 200,
    status,
    json: () => Promise.resolve(data),
  })
}

// Mock fetch globally
global.fetch = jest.fn()

describe('Hotel Management System', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('Receptor Dashboard', () => {
    test('should display daily overview', async () => {
      const mockData = {
        arrivals: 3,
        departures: 2,
        inHouse: 15,
        pending: 1
      }
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockData))
      
      render(<ReceptorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Arrivals Today')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Departures Today')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    test('should show room status overview', async () => {
      const mockRooms = [
        { id: '101', status: 'available', type: 'Standard' },
        { id: '102', status: 'occupied', type: 'Standard' },
        { id: '103', status: 'cleaning', type: 'Suite' },
      ]
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockRooms))
      
      render(<ReceptorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Room 101')).toBeInTheDocument()
        expect(screen.getByText('Available')).toBeInTheDocument()
        expect(screen.getByText('Room 102')).toBeInTheDocument()
        expect(screen.getByText('Occupied')).toBeInTheDocument()
      })
    })

    test('should handle quick reservation form', async () => {
      render(<ReceptorDashboard />)
      
      const quickReserveButton = screen.getByText('Quick Reserve')
      const guestNameInput = screen.getByLabelText('Guest Name')
      
      fireEvent.click(quickReserveButton)
      
      await waitFor(() => {
        expect(guestNameInput).toBeInTheDocument()
      })
      
      fireEvent.change(guestNameInput, { target: { value: 'John Doe' } })
      fireEvent.click(screen.getByText('Create Reservation'))
      
      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reservations/quick-create'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('guestName=John Doe'),
        })
      )
    })
  })

  describe('Director Dashboard', () => {
    test('should display analytics overview', async () => {
      const mockAnalytics = {
        occupancyRate: 85.5,
        revenue: 2500,
        adr: 125,
        revpar: 107
      }
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockAnalytics))
      
      render(<DirectorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('85.5%')).toBeInTheDocument()
        expect(screen.getByText('€2,500')).toBeInTheDocument()
        expect(screen.getByText('€125')).toBeInTheDocument()
        expect(screen.getByText('€107')).toBeInTheDocument()
      })
    })

    test('should show revenue reports', async () => {
      const mockRevenue = {
        dailyRevenue: [350, 425, 380, 410],
        totalRevenue: 2500,
        trend: 'up'
      }
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockRevenue))
      
      render(<DirectorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Revenue This Week')).toBeInTheDocument()
        expect(screen.getByText('€2,500')).toBeInTheDocument()
        expect(screen.getByText('↑ Trending Up')).toBeInTheDocument()
      })
    })
  })

  describe('Room Management', () => {
    test('should display room inventory', async () => {
      const mockRooms = [
        {
          id: '101',
          name: 'Standard Room',
          type: 'Standard',
          capacity: 2,
          amenities: ['WiFi', 'AC', 'TV'],
          status: 'available'
        },
        {
          id: '201',
          name: 'Suite A',
          type: 'Suite',
          capacity: 4,
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
          status: 'occupied'
        }
      ]
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockRooms))
      
      render(<RoomManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('Standard Room')).toBeInTheDocument()
        expect(screen.getByText('Suite A')).toBeInTheDocument()
        expect(screen.getByText('Capacity: 2')).toBeInTheDocument()
        expect(screen.getByText('Capacity: 4')).toBeInTheDocument()
        expect(screen.getByText('WiFi')).toBeInTheDocument()
        expect(screen.getByText('AC')).toBeInTheDocument()
      })
    })

    test('should handle housekeeping schedule', async () => {
      const mockSchedule = [
        { roomId: '101', task: 'cleaning', assignedTo: 'Maria', time: '10:00' },
        { roomId: '102', task: 'maintenance', assignedTo: 'John', time: '14:00' },
        { roomId: '103', task: 'inspection', assignedTo: 'Ana', time: '16:00' },
      ]
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockSchedule))
      
      render(<RoomManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('Housekeeping Schedule')).toBeInTheDocument()
        expect(screen.getByText('Maria - Cleaning')).toBeInTheDocument()
        expect(screen.getByText('John - Maintenance')).toBeInTheDocument()
        expect(screen.getByText('Ana - Inspection')).toBeInTheDocument()
      })
    })
  })

  describe('Reservation System', () => {
    test('should display reservations list', async () => {
      const mockReservations = [
        {
          id: 'res_001',
          guestName: 'John Doe',
          room: '101',
          checkIn: '2026-03-05',
          checkOut: '2026-03-07',
          status: 'confirmed'
        },
        {
          id: 'res_002',
          guestName: 'Jane Smith',
          room: '102',
          checkIn: '2026-03-06',
          checkOut: '2026-03-08',
          status: 'pending'
        }
      ]
      
      fetch.mockResolvedValueOnce(mockApiResponse({ results: mockReservations }))
      
      render(<ReservationSystem />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Room 101')).toBeInTheDocument()
        expect(screen.getByText('Room 102')).toBeInTheDocument()
        expect(screen.getByText('Confirmed')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    test('should handle check-in process', async () => {
      render(<ReservationSystem />)
      
      const checkInButton = screen.getAllByText('Check In')[0]
      fireEvent.click(checkInButton)
      
      await waitFor(() => {
        expect(screen.getByText('Check-in Process')).toBeInTheDocument()
        expect(screen.getByLabelText('Notes')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Notes'), { 
        target: { value: 'Guest arrived on time, room clean' } 
      })
      fireEvent.click(screen.getByText('Complete Check-in'))
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reservations/checkin'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Guest arrived on time'),
        })
      )
    })

    test('should handle check-out process', async () => {
      render(<ReservationSystem />)
      
      const checkOutButton = screen.getAllByText('Check Out')[0]
      fireEvent.click(checkOutButton)
      
      await waitFor(() => {
        expect(screen.getByText('Check-out Process')).toBeInTheDocument()
        expect(screen.getByLabelText('Final Bill')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Final Bill'), { 
        target: { value: '150.00' } 
      })
      fireEvent.click(screen.getByText('Process Check-out'))
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reservations/checkout'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('finalBill=150.00'),
        })
      )
    })
  })

  describe('Guest Database', () => {
    test('should display guest list', async () => {
      const mockGuests = [
        {
          id: 'guest_001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'USA',
          stayCount: 3
        },
        {
          id: 'guest_002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          country: 'UK',
          stayCount: 1
        }
      ]
      
      fetch.mockResolvedValueOnce(mockApiResponse({ results: mockGuests }))
      
      render(<GuestDatabase />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
        expect(screen.getByText('3 stays')).toBeInTheDocument()
        expect(screen.getByText('1 stay')).toBeInTheDocument()
      })
    })

    test('should handle guest communication', async () => {
      render(<GuestDatabase />)
      
      const communicateButton = screen.getByText('Communicate')
      fireEvent.click(communicateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Send Message')).toBeInTheDocument()
        expect(screen.getByLabelText('Subject')).toBeInTheDocument()
        expect(screen.getByLabelText('Message')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Subject'), { 
        target: { value: 'Welcome Message' } 
      })
      fireEvent.change(screen.getByLabelText('Message'), { 
        target: { value: 'We hope you enjoy your stay!' } 
      })
      fireEvent.click(screen.getByText('Send Message'))
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/guests/communicate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Welcome Message'),
        })
      )
    })
  })

  describe('Integration Tests', () => {
    test('should handle eTurizem sync status', async () => {
      const mockSyncStatus = {
        lastSync: '2026-03-04T10:30:00Z',
        status: 'success',
        errors: []
      }
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockSyncStatus))
      
      render(<ReceptorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Last Sync')).toBeInTheDocument()
        expect(screen.getByText('Success')).toBeInTheDocument()
      })
    })

    test('should display Booking.com integration status', async () => {
      const mockBookingStatus = {
        connected: true,
        lastSync: '2026-03-04T09:15:00Z',
        bookingsImported: 25
      }
      
      fetch.mockResolvedValueOnce(mockApiResponse(mockBookingStatus))
      
      render(<DirectorDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Booking.com')).toBeInTheDocument()
        expect(screen.getByText('Connected')).toBeInTheDocument()
        expect(screen.getByText('25 bookings')).toBeInTheDocument()
      })
    })
  })
})
