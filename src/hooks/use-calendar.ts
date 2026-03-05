/**
 * Calendar Hook for Drag-and-Drop Functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CalendarEvent, 
  CalendarResource, 
  CalendarView, 
  CalendarConfig,
  ConflictInfo,
  CalendarAction,
  DragItem,
  DropTarget
} from '@/types/calendar';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, startOfDay, endOfDay, isSameDay, isWithinInterval, differenceInHours, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

interface UseCalendarOptions {
  propertyId: string;
  initialView?: CalendarView['type'];
  config?: Partial<CalendarConfig>;
}

interface UseCalendarReturn {
  // State
  events: CalendarEvent[];
  resources: CalendarResource[];
  currentView: CalendarView;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
  conflicts: ConflictInfo[];
  
  // Actions
  setView: (view: CalendarView['type']) => void;
  navigateDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  selectEvent: (event: CalendarEvent | null) => void;
  
  // Drag and Drop
  handleDragStart: (item: DragItem) => void;
  handleDragEnd: (item: DragItem, target: DropTarget | null) => void;
  handleResize: (eventId: string, newStart: Date, newEnd: Date) => void;
  
  // Event Management
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Utilities
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForResource: (resourceId: string) => CalendarEvent[];
  isSlotAvailable: (resourceId: string, start: Date, end: Date, excludeEventId?: string) => boolean;
  checkConflicts: (resourceId: string, start: Date, end: Date, excludeEventId?: string) => ConflictInfo | null;
  calculatePrice: (resourceId: string, start: Date, end: Date) => number;
}

const defaultConfig: CalendarConfig = {
  defaultView: 'week',
  workingHours: {
    start: '08:00',
    end: '22:00',
  },
  minBookingDuration: 1,
  maxBookingDuration: 720, // 30 days in hours
  allowDragAndDrop: true,
  allowResize: true,
  showWeekends: true,
  timeSlotDuration: 30,
};

export function useCalendar({ propertyId, initialView = 'week', config = {} }: UseCalendarOptions): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [resources, setResources] = useState<CalendarResource[]>([]);
  const [currentView, setCurrentView] = useState<CalendarView>({
    type: initialView,
    startDate: getViewStartDate(initialView),
    endDate: getViewEndDate(initialView),
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [history, setHistory] = useState<CalendarAction[]>([]);
  
  const calendarConfig = { ...defaultConfig, ...config };

  // Fetch initial data
  useEffect(() => {
    if (propertyId) {
      fetchCalendarData();
    }
  }, [propertyId, currentView]);

  // Update view dates when view type changes
  useEffect(() => {
    setCurrentView(prev => ({
      ...prev,
      startDate: getViewStartDate(prev.type),
      endDate: getViewEndDate(prev.type),
    }));
  }, [currentView.type]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch events
      const eventsResponse = await fetch(
        `/api/calendar/events?propertyId=${propertyId}&start=${currentView.startDate.toISOString()}&end=${currentView.endDate.toISOString()}`
      );
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const eventsData = await eventsResponse.json();
      const formattedEvents = eventsData.data?.events?.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        draggable: event.status === 'confirmed' || event.status === 'pending',
        resizable: event.status === 'confirmed' || event.status === 'pending',
      })) || [];

      // Fetch resources
      const resourcesResponse = await fetch(`/api/calendar/resources?propertyId=${propertyId}`);
      
      if (!resourcesResponse.ok) {
        throw new Error('Failed to fetch calendar resources');
      }
      
      const resourcesData = await resourcesResponse.json();
      const formattedResources = resourcesData.data?.resources || [];

      setEvents(formattedEvents);
      setResources(formattedResources);
      
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendar data');
      toast.error('Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const setView = useCallback((viewType: CalendarView['type']) => {
    setCurrentView(prev => ({
      type: viewType,
      startDate: getViewStartDate(viewType),
      endDate: getViewEndDate(viewType),
    }));
  }, []);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentView(prev => {
      let newStartDate: Date;
      let newEndDate: Date;
      
      switch (prev.type) {
        case 'day':
          newStartDate = direction === 'prev' ? addDays(prev.startDate, -1) : addDays(prev.startDate, 1);
          newEndDate = newStartDate;
          break;
        case 'week':
          newStartDate = direction === 'prev' ? addWeeks(prev.startDate, -1) : addWeeks(prev.startDate, 1);
          newEndDate = direction === 'prev' ? addWeeks(prev.endDate, -1) : addWeeks(prev.endDate, 1);
          break;
        case 'month':
          newStartDate = direction === 'prev' ? addMonths(prev.startDate, -1) : addMonths(prev.startDate, 1);
          newEndDate = direction === 'prev' ? addMonths(prev.endDate, -1) : addMonths(prev.endDate, 1);
          break;
        case 'timeline':
          newStartDate = direction === 'prev' ? addWeeks(prev.startDate, -1) : addWeeks(prev.startDate, 1);
          newEndDate = direction === 'prev' ? addWeeks(prev.endDate, -1) : addWeeks(prev.endDate, 1);
          break;
        default:
          return prev;
      }
      
      return {
        ...prev,
        startDate: newStartDate,
        endDate: newEndDate,
      };
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentView(prev => ({
      ...prev,
      startDate: getViewStartDate(prev.type, today),
      endDate: getViewEndDate(prev.type, today),
    }));
  }, []);

  const selectEvent = useCallback((event: CalendarEvent | null) => {
    setSelectedEvent(event);
  }, []);

  // Drag and Drop handlers
  const handleDragStart = useCallback((item: DragItem) => {
    if (!calendarConfig.allowDragAndDrop) {
      toast.error('Drag and drop is disabled');
      return;
    }
    
    const event = events.find(e => e.id === item.id);
    if (!event || !event.draggable) {
      toast.error('This event cannot be moved');
      return;
    }
    
    console.log('Drag started:', item);
  }, [events, calendarConfig.allowDragAndDrop]);

  const handleDragEnd = useCallback(async (item: DragItem, target: DropTarget | null) => {
    if (!target || !calendarConfig.allowDragAndDrop) {
      return;
    }
    
    const event = events.find(e => e.id === item.id);
    if (!event) {
      toast.error('Event not found');
      return;
    }
    
    // Calculate new dates based on target
    const duration = differenceInHours(event.end, event.start);
    const newStart = startOfDay(target.date);
    const newEnd = addHours(newStart, duration);
    
    // Check for conflicts
    const conflict = checkConflicts(target.resourceId, newStart, newEnd, event.id);
    if (conflict) {
      toast.error('Room is not available for selected dates');
      setConflicts([conflict]);
      return;
    }
    
    // Update event
    try {
      await updateEvent(event.id, {
        resourceId: target.resourceId,
        start: newStart,
        end: newEnd,
      });
      
      toast.success('Reservation moved successfully');
    } catch (error) {
      console.error('Error moving event:', error);
      toast.error('Failed to move reservation');
    }
  }, [events, calendarConfig.allowDragAndDrop, checkConflicts, updateEvent]);

  const handleResize = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    if (!calendarConfig.allowResize) {
      toast.error('Resizing is disabled');
      return;
    }
    
    const event = events.find(e => e.id === eventId);
    if (!event || !event.resizable) {
      toast.error('This event cannot be resized');
      return;
    }
    
    // Validate duration
    const duration = differenceInHours(newEnd, newStart);
    if (duration < calendarConfig.minBookingDuration || duration > calendarConfig.maxBookingDuration) {
      toast.error(`Booking duration must be between ${calendarConfig.minBookingDuration} and ${calendarConfig.maxBookingDuration} hours`);
      return;
    }
    
    // Check for conflicts
    const conflict = checkConflicts(event.resourceId, newStart, newEnd, eventId);
    if (conflict) {
      toast.error('Room is not available for selected dates');
      setConflicts([conflict]);
      return;
    }
    
    // Update event
    try {
      await updateEvent(eventId, {
        start: newStart,
        end: newEnd,
      });
      
      toast.success('Reservation updated successfully');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to update reservation');
    }
  }, [events, calendarConfig, checkConflicts, updateEvent]);

  // Event Management
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          propertyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent.data]);
      
      // Add to history
      setHistory(prev => [...prev, {
        type: 'create',
        eventId: newEvent.data.id,
        newData: eventData,
        timestamp: new Date(),
      }]);
      
      toast.success('Reservation created successfully');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create reservation');
      throw error;
    }
  }, [propertyId]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, ...updatedEvent.data } : event
      ));
      
      // Add to history
      setHistory(prev => [...prev, {
        type: 'update',
        eventId,
        newData: updates,
        timestamp: new Date(),
      }]);
      
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update reservation');
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Add to history
      setHistory(prev => [...prev, {
        type: 'delete',
        eventId,
        timestamp: new Date(),
      }]);
      
      toast.success('Reservation deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete reservation');
      throw error;
    }
  }, []);

  // Utilities
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isWithinInterval(date, { start: event.start, end: event.end }));
  }, [events]);

  const getEventsForResource = useCallback((resourceId: string) => {
    return events.filter(event => event.resourceId === resourceId);
  }, [events]);

  const isSlotAvailable = useCallback((resourceId: string, start: Date, end: Date, excludeEventId?: string) => {
    const resourceEvents = getEventsForResource(resourceId);
    const conflictingEvents = resourceEvents.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      return isWithinInterval(start, { start: event.start, end: event.end }) ||
             isWithinInterval(end, { start: event.start, end: event.end }) ||
             isWithinInterval(event.start, { start, end }) ||
             isWithinInterval(event.end, { start, end });
    });
    
    return conflictingEvents.length === 0;
  }, [getEventsForResource]);

  const checkConflicts = useCallback((resourceId: string, start: Date, end: Date, excludeEventId?: string): ConflictInfo | null => {
    const resourceEvents = getEventsForResource(resourceId);
    const conflictingEvents = resourceEvents.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      return isWithinInterval(start, { start: event.start, end: event.end }) ||
             isWithinInterval(end, { start: event.start, end: event.end }) ||
             isWithinInterval(event.start, { start, end }) ||
             isWithinInterval(event.end, { start, end });
    });
    
    if (conflictingEvents.length === 0) {
      return null;
    }
    
    // Suggest alternative room
    const availableRoom = resources.find(room => {
      if (room.id === resourceId) return false;
      return isSlotAvailable(room.id, start, end, excludeEventId);
    });
    
    return {
      resourceId,
      conflictingEvents,
      suggestedAlternative: availableRoom ? {
        resourceId: availableRoom.id,
        start,
        end,
      } : undefined,
    };
  }, [getEventsForResource, isSlotAvailable, resources]);

  const calculatePrice = useCallback((resourceId: string, start: Date, end: Date): number => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return 0;
    
    const hours = differenceInHours(end, start);
    const days = Math.ceil(hours / 24);
    
    return resource.basePrice * days;
  }, [resources]);

  // Memoized values
  const calendarEvents = useMemo(() => events, [events]);
  const calendarResources = useMemo(() => resources, [resources]);

  return {
    // State
    events: calendarEvents,
    resources: calendarResources,
    currentView,
    selectedEvent,
    isLoading,
    error,
    conflicts,
    
    // Actions
    setView,
    navigateDate,
    goToToday,
    selectEvent,
    
    // Drag and Drop
    handleDragStart,
    handleDragEnd,
    handleResize,
    
    // Event Management
    createEvent,
    updateEvent,
    deleteEvent,
    
    // Utilities
    getEventsForDate,
    getEventsForResource,
    isSlotAvailable,
    checkConflicts,
    calculatePrice,
  };
}

// Helper functions
function getViewStartDate(viewType: CalendarView['type'], referenceDate: Date = new Date()): Date {
  const date = startOfDay(referenceDate);
  
  switch (viewType) {
    case 'day':
      return date;
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
      return startOfMonth(date);
    case 'timeline':
      return startOfWeek(date, { weekStartsOn: 1 });
    default:
      return date;
  }
}

function getViewEndDate(viewType: CalendarView['type'], referenceDate: Date = new Date()): Date {
  const date = startOfDay(referenceDate);
  
  switch (viewType) {
    case 'day':
      return endOfDay(date);
    case 'week':
      return endOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      return endOfMonth(date);
    case 'timeline':
      return endOfWeek(addWeeks(date, 1), { weekStartsOn: 1 });
    default:
      return endOfDay(date);
  }
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
