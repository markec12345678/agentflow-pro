/**
 * Drag-and-Drop Calendar Component
 * Interactive calendar with drag-and-drop functionality for reservations
 */

"use client";

import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { rectIntersection } from '@dnd-kit/core';
import { useCalendar } from '@/hooks/use-calendar';
import { CalendarEvent, CalendarResource, DragItem, DropTarget } from '@/types/calendar';
import { format, startOfDay, addHours, differenceInMinutes, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

interface DragDropCalendarProps {
  propertyId: string;
  onEventSelect?: (event: CalendarEvent | null) => void;
  onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

interface CalendarCellProps {
  date: Date;
  resource: CalendarResource;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventResize: (eventId: string, newStart: Date, newEnd: Date) => void;
  onCellClick: (date: Date, resource: CalendarResource) => void;
  isDragging?: boolean;
}

interface EventBlockProps {
  event: CalendarEvent;
  onClick: () => void;
  onResize: (newStart: Date, newEnd: Date) => void;
  isDragging?: boolean;
  isResizing?: boolean;
}

export default function DragDropCalendar({ 
  propertyId, 
  onEventSelect, 
  onEventCreate, 
  onEventUpdate 
}: DragDropCalendarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ eventId: string; edge: 'start' | 'end'; originalStart: Date; originalEnd: Date } | null>(null);
  
  const calendar = useCalendar({ propertyId });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context }) => {
        const { active, over } = context;
        if (active && over) {
          return { x: 0, y: 0 };
        }
        return null;
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    calendar.handleDragStart({ id: active.id as string, type: 'event', data: calendar.events.find(e => e.id === active.id)! });
  }, [calendar]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const eventId = active.id as string;
    const targetData = over.data.current as DropTarget;
    
    calendar.handleDragEnd(
      { id: eventId, type: 'event', data: calendar.events.find(e => e.id === eventId)! },
      targetData
    );
    
    setActiveId(null);
  }, [calendar]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Update drop target data based on current position
    const rect = over.rect;
    const targetData = over.data.current as DropTarget;
    
    if (targetData) {
      // Calculate precise time based on drop position
      const timeSlotHeight = 60; // 60px per hour
      const hourOffset = (event.delta.y % timeSlotHeight) / timeSlotHeight;
      const newHour = Math.floor(hourOffset * 2) / 2; // Snap to 30-minute intervals
      
      const newStart = addHours(startOfDay(targetData.date), newHour);
      
      over.data.current = {
        ...targetData,
        date: newStart,
      };
    }
  }, []);

  const handleCellClick = useCallback((date: Date, resource: CalendarResource) => {
    // Create new reservation dialog or quick reservation
    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: 'New Reservation',
      start: date,
      end: addHours(date, 2), // Default 2-hour booking
      resourceId: resource.id,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      status: 'pending',
      totalPrice: calendar.calculatePrice(resource.id, date, addHours(date, 2)),
      channel: 'direct',
      draggable: true,
      resizable: true,
    };
    
    if (onEventCreate) {
      onEventCreate(newEvent);
    } else {
      calendar.createEvent(newEvent);
    }
  }, [calendar, onEventCreate]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (onEventSelect) {
      onEventSelect(event);
    } else {
      calendar.selectEvent(event);
    }
  }, [calendar, onEventSelect]);

  const handleEventResize = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    if (onEventUpdate) {
      onEventUpdate(eventId, { start: newStart, end: newEnd });
    } else {
      calendar.handleResize(eventId, newStart, newEnd);
    }
  }, [calendar, onEventUpdate]);

  const startResize = useCallback((eventId: string, edge: 'start' | 'end') => {
    const event = calendar.events.find(e => e.id === eventId);
    if (!event) return;
    
    setIsResizing(eventId);
    setResizeStart({
      eventId,
      edge,
      originalStart: event.start,
      originalEnd: event.end,
    });
  }, [calendar.events]);

  const endResize = useCallback((newDate: Date) => {
    if (!resizeStart) return;
    
    const { eventId, edge, originalStart, originalEnd } = resizeStart;
    
    let newStart = originalStart;
    let newEnd = originalEnd;
    
    if (edge === 'start') {
      newStart = newDate;
      if (newStart >= originalEnd) {
        newStart = addHours(originalEnd, -1); // Minimum 1 hour
      }
    } else {
      newEnd = newDate;
      if (newEnd <= originalStart) {
        newEnd = addHours(originalStart, 1); // Minimum 1 hour
      }
    }
    
    handleEventResize(eventId, newStart, newEnd);
    setIsResizing(null);
    setResizeStart(null);
  }, [resizeStart, handleEventResize]);

  // Generate calendar grid
  const generateCalendarGrid = useCallback(() => {
    const grid: Array<{ date: Date; resource: CalendarResource }> = [];
    const { startDate, endDate } = calendar.currentView;
    
    // Generate date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      calendar.resources.forEach(resource => {
        grid.push({
          date: new Date(currentDate),
          resource,
        });
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return grid;
  }, [calendar.currentView, calendar.resources]);

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => calendar.navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={calendar.goToToday}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Today
            </button>
            
            <button
              onClick={() => calendar.navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="text-lg font-semibold text-gray-900">
              {format(calendar.currentView.startDate, 'MMMM yyyy')}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => calendar.setView('day')}
              className={`px-3 py-1 text-sm rounded-lg ${
                calendar.currentView.type === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => calendar.setView('week')}
              className={`px-3 py-1 text-sm rounded-lg ${
                calendar.currentView.type === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => calendar.setView('month')}
              className={`px-3 py-1 text-sm rounded-lg ${
                calendar.currentView.type === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="min-w-full">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_1fr] border-b border-gray-200">
              <div className="p-2 text-sm font-medium text-gray-700 border-r border-gray-200">
                Room
              </div>
              <div className="grid grid-cols-7 border-l border-gray-200">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addHours(calendar.currentView.startDate, i * 24);
                  return (
                    <div key={i} className="p-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                      {format(date, 'EEE')}
                      <div className="text-xs text-gray-500">{format(date, 'MMM d')}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Rows */}
            {calendar.resources.map(resource => (
              <div key={resource.id} className="grid grid-cols-[200px_1fr] border-b border-gray-200">
                {/* Resource Header */}
                <div className="p-2 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                  <div>{resource.name}</div>
                  <div className="text-xs text-gray-500">{resource.type} • ${resource.basePrice}/night</div>
                </div>
                
                {/* Calendar Cells */}
                <div className="grid grid-cols-7 border-l border-gray-200">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = addHours(calendar.currentView.startDate, i * 24);
                    const events = calendar.getEventsForResource(resource.id).filter(event =>
                      isWithinInterval(date, { start: event.start, end: event.end })
                    );
                    
                    return (
                      <CalendarCell
                        key={`${resource.id}-${i}`}
                        date={date}
                        resource={resource}
                        events={events}
                        onEventClick={handleEventClick}
                        onEventResize={handleEventResize}
                        onCellClick={handleCellClick}
                        isDragging={activeId !== null}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="bg-blue-600 text-white p-2 rounded shadow-lg opacity-90">
                {calendar.events.find(e => e.id === activeId)?.title || 'Event'}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// Calendar Cell Component
function CalendarCell({ 
  date, 
  resource, 
  events, 
  onEventClick, 
  onEventResize, 
  onCellClick, 
  isDragging 
}: CalendarCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleCellClick = () => {
    onCellClick(date, resource);
  };

  return (
    <div
      className={`
        relative min-h-[100px] p-1 border-r border-gray-200 last:border-r-0 cursor-pointer
        ${isHovered ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${isDragging ? 'bg-blue-100' : ''}
      `}
      onClick={handleCellClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-drop-target="true"
      data-resource-id={resource.id}
      data-date={date.toISOString()}
    >
      {/* Events */}
      <div className="space-y-1">
        {events.map(event => (
          <EventBlock
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
            onResize={(newStart, newEnd) => onEventResize(event.id, newStart, newEnd)}
            isDragging={false}
            isResizing={false}
          />
        ))}
      </div>
      
      {/* Drop indicator */}
      {isHovered && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded pointer-events-none" />
      )}
    </div>
  );
}

// Event Block Component
function EventBlock({ 
  event, 
  onClick, 
  onResize, 
  isDragging, 
  isResizing 
}: EventBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getEventColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'cancelled':
        return 'bg-red-600 text-white';
      case 'checked_in':
        return 'bg-green-600 text-white';
      case 'checked_out':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className={`
        ${getEventColor(event.status)} 
        p-1 rounded text-xs cursor-pointer shadow-sm
        ${isDragging ? 'opacity-50' : ''}
        ${isHovered ? 'shadow-md' : ''}
        ${event.draggable ? 'cursor-move' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={event.draggable}
    >
      <div className="font-medium truncate">{event.title}</div>
      {event.guestName && (
        <div className="text-xs opacity-90 truncate">{event.guestName}</div>
      )}
      {isHovered && (
        <div className="flex justify-between mt-1">
          <span className="text-xs">${event.totalPrice}</span>
          <span className="text-xs">{event.channel}</span>
        </div>
      )}
    </div>
  );
}
