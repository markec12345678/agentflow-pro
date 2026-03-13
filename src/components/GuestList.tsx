// src/components/GuestList.tsx
import { Guest } from '@/types';
import { useUser } from '@/context/UserContext';
import { PhoneIcon, EnvelopeIcon, KeyIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface GuestListProps {
  guests: Guest[];
}

export const GuestList = ({ guests }: GuestListProps) => {
  const { user } = useUser();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Today’s Guests</h3>
        <p className="text-sm text-gray-500">Check-in: {guests.length} / 12</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {guests.map((guest) => (
          <li key={guest.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {guest.name} {guest.lastName}
                </h4>
                <p className="text-sm text-gray-500">{guest.reservationId}</p>
                {guest.roomNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    Room: <span className="font-medium">{guest.roomNumber}</span>
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                  aria-label="Call guest"
                >
                  <PhoneIcon className="h-4 w-4" />
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                  aria-label="Send email"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                </button>
                {user?.role === 'receptionist' && (
                  <button
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                    aria-label="Assign room"
                  >
                    <KeyIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                  aria-label="Ask AI"
                >
                  <SparklesIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};