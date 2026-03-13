// src/components/RoomGrid.tsx
import { Room } from '@/types';
import { useTime } from '@/context/TimeContext';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface RoomGridProps {
  rooms: Room[];
}

export const RoomGrid = ({ rooms }: RoomGridProps) => {
  const { hour } = useTime();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-emerald-100 text-emerald-800';
      case 'occupied': return 'bg-gray-100 text-gray-800';
      case 'cleaning': return 'bg-amber-100 text-amber-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'free': return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
      case 'cleaning': return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />;
      case 'occupied': return <ArrowPathIcon className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Rooms</h3>
        <p className="text-sm text-gray-500">Status: {rooms.length} / 24</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`rounded-lg border p-3 text-center transition-all hover:shadow-md ${
              room.status === 'cleaning' && hour > 14 ? 'ring-2 ring-amber-300' : ''
            }`}
          >
            <div className="font-medium text-gray-900">{room.number}</div>
            <div className="mt-1 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {getIcon(room.status)}
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </span>
            </div>
            {room.guestName && (
              <div className="mt-2 text-xs text-gray-600 truncate">{room.guestName}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};