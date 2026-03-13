// src/components/MetricsCard.tsx
import { useTime } from '@/context/TimeContext';
import { Status } from '@/types';
import { TrendingUpIcon, TrendingDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MetricsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  status?: 'low' | 'medium' | 'high' | 'critical';
  subtitle?: string;
}

export const MetricsCard = ({
  title,
  value,
  trend,
  icon,
  status,
  subtitle,
}: MetricsCardProps) => {
  const { hour, isMorning, isAfternoon } = useTime();

  // Context-aware styling
  let bgColor = 'bg-white';
  let borderColor = 'border-gray-200';
  let textColor = 'text-gray-900';
  let iconColor = 'text-gray-500';

  if (status === 'high') {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-red-700';
    iconColor = 'text-red-500';
  } else if (status === 'critical') {
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    textColor = 'text-amber-700';
    iconColor = 'text-amber-500';
  }

  // Time-based emphasis
  let emphasis = '';
  if (title.includes('Check-ins') && isMorning) {
    emphasis = 'ring-2 ring-indigo-500';
  }
  if (title.includes('Check-outs') && isAfternoon) {
    emphasis = 'ring-2 ring-emerald-500';
  }

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${emphasis}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
          {trend.startsWith('+') ? (
            <TrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-amber-500 mr-1" />
          )}
          <span className="text-gray-600">{trend}</span>
        </div>
      )}
      {status === 'critical' && (
        <div className="mt-2 flex items-center text-xs text-amber-700">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          Housekeeping delay over 45 min
        </div>
      )}
    </div>
  );
};