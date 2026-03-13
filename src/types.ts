// types.ts
export type Role = 'receptionist' | 'manager' | 'housekeeping' | 'admin';

export type Status =
  | 'free'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'blocked';

export type TimelineType =
  | 'seo'
  | 'email'
  | 'ai'
  | 'social'
  | 'checkin'
  | 'checkout';

export interface Guest {
  id: string;
  name: string;
  lastName: string;
  reservationId: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomNumber?: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  preferences?: string[];
  notes?: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: Status;
  cleaningStartedAt?: string;
  lastCleanedAt?: string;
  guestId?: string;
  guestName?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  createdAt: string;
  dueAt?: string;
}

export interface TimelineItem {
  id: string;
  type: TimelineType;
  title: string;
  time: string; // ISO or HH:mm
  details?: string;
  action?: () => void;
}