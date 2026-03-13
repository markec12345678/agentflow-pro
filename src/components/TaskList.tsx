// src/components/TaskList.tsx
import { Task } from '@/types';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TaskListProps {
  tasks: Task[];
}

export const TaskList = ({ tasks }: TaskListProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-amber-100 text-amber-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Urgent Tasks</h3>
        <p className="text-sm text-gray-500">{tasks.filter(t => t.priority === 'urgent').length} urgent</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <li key={task.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(task.priority)}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.assignee && (
                    <span className="text-xs text-gray-500">→ {task.assignee}</span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};