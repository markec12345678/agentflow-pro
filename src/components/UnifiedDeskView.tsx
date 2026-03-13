// src/components/UnifiedDeskView.tsx
import { Guest } from '@/types';
import { GuestList } from './GuestList';
import { RoomGrid } from './RoomGrid';
import { TaskList } from './TaskList';

interface UnifiedDeskViewProps {
  guests?: Guest[];
  rooms?: { id: string; number: string; status: string }[];
  tasks?: { id: string; title: string; priority: string }[];
}

export const UnifiedDeskView = ({
  guests = [],
  rooms = [],
  tasks = [],
}: UnifiedDeskViewProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <GuestList guests={guests} />
        <RoomGrid rooms={rooms} />
      </div>
      <div>
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
};