// src/components/TourismTimeline.tsx
import { TimelineItem, TimelineType } from '@/types';
import { SparklesIcon, MailIcon, ChartBarIcon, CameraIcon, UserCheckIcon } from '@heroicons/react/24/outline';

interface TourismTimelineProps {
  items: TimelineItem[];
}

const getTypeIcon = (type: TimelineType) => {
  switch (type) {
    case 'seo': return <ChartBarIcon className="h-4 w-4 text-indigo-600" />;
    case 'email': return <MailIcon className="h-4 w-4 text-emerald-600" />;
    case 'ai': return <SparklesIcon className="h-4 w-4 text-amber-600" />;
    case 'social': return <CameraIcon className="h-4 w-4 text-purple-600" />;
    case 'checkin': return <UserCheckIcon className="h-4 w-4 text-emerald-600" />;
    case 'checkout': return <UserCheckIcon className="h-4 w-4 text-red-600" />;
    default: return <SparklesIcon className="h-4 w-4 text-gray-500" />;
  }
};

export const TourismTimeline = ({ items }: TourismTimelineProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Tourism Timeline</h3>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
          + Generate new
        </button>
      </div>
      <div className="p-4 overflow-x-auto pb-2">
        <div className="flex space-x-4 min-w-max">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start space-x-2 mb-2">
                {getTypeIcon(item.type)}
                <span className="text-xs font-medium text-gray-700">{item.time}</span>
              </div>
              <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</h4>
              {item.details && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.details}</p>
              )}
              <div className="mt-3 flex justify-end">
                <button className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                  💡 Details
                </button>
              </div>
            </div>
          ))}
          {/* Placeholder for add */}
          <div className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 cursor-pointer">
            <SparklesIcon className="h-6 w-6 mb-2" />
            <span className="text-xs">Add event</span>
          </div>
        </div>
      </div>
    </div>
  );
};