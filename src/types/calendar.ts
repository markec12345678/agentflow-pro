/**
 * Calendar Types and Interfaces
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked_in' | 'checked_out';
  totalPrice: number;
  channel: 'direct' | 'booking.com' | 'airbnb' | 'expedia' | 'other';
  notes?: string;
  color?: string;
  draggable?: boolean;
  resizable?: boolean;
}

export interface CalendarResource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';
  order: number;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'timeline';
  startDate: Date;
  endDate: Date;
}

export interface CalendarSlot {
  date: Date;
  resourceId: string;
  isAvailable: boolean;
  events: CalendarEvent[];
}

export interface DragItem {
  id: string;
  type: 'event' | 'reservation';
  data: CalendarEvent;
}

export interface DropTarget {
  resourceId: string;
  date: Date;
  time?: string;
}

export interface CalendarConfig {
  defaultView: CalendarView['type'];
  workingHours: {
    start: string;
    end: string;
  };
  minBookingDuration: number; // in hours
  maxBookingDuration: number; // in hours
  allowDragAndDrop: boolean;
  allowResize: boolean;
  showWeekends: boolean;
  timeSlotDuration: number; // in minutes
}

export interface ConflictInfo {
  resourceId: string;
  conflictingEvents: CalendarEvent[];
  suggestedAlternative?: {
    resourceId: string;
    start: Date;
    end: Date;
  };
}

export interface CalendarAction {
  type: 'move' | 'resize' | 'create' | 'delete' | 'update';
  eventId: string;
  oldData?: Partial<CalendarEvent>;
  newData?: Partial<CalendarEvent>;
  timestamp: Date;
}

export interface CalendarState {
  events: CalendarEvent[];
  resources: CalendarResource[];
  currentView: CalendarView;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
  conflicts: ConflictInfo[];
  history: CalendarAction[];
}
