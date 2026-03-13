// src/components/Toolbar.tsx
import { useRole } from '@/context/RoleContext';
import { useTime } from '@/context/TimeContext';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const Toolbar = () => {
  const { role } = useRole();
  const { hour, isMorning, isAfternoon } = useTime();

  // Context-aware label for AI Assist
  let aiLabel = 'AI Assist';
  if (role === 'receptionist' && isMorning) {
    aiLabel = 'Urgent: 3 guests waiting';
  } else if (role === 'manager' && isAfternoon) {
    aiLabel = 'Revenue Insights';
  }

  return (
    <div className="flex h-12 items-center justify-between bg-white px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-100">
          <MagnifyingGlassIcon className="h-5 w-5" />
          <span>Search</span>
        </button>
        <button className="flex items-center space-x-2 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-100">
          <PlusCircleIcon className="h-5 w-5" />
          <span>New</span>
        </button>
        <button className="flex items-center space-x-2 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-100">
          <ArrowPathIcon className="h-5 w-5" />
          <span>Refresh</span>
        </button>
        <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
          <span>{aiLabel}</span>
        </button>
        <button className="flex items-center space-x-2 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-100">
          <Cog6ToothIcon className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};