"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay, isToday, isTomorrow } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface HousekeepingTask {
  id: string;
  roomId: string;
  roomName: string;
  roomType: string;
  taskType: "check_out_clean" | "stayover_clean" | "deep_clean" | "maintenance";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "delayed";
  assignedTo?: string;
  estimatedTime: number; // in minutes
  actualTime?: number;
  scheduledDate: string;
  completedAt?: string;
  notes?: string;
  guestName?: string;
  checkOutTime?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  isAvailable: boolean;
  currentTasks: number;
}

export default function HousekeepingPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchTasks();
      fetchStaff();
    }
  }, [selectedPropertyId, selectedDate]);

  const fetchTasks = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/tourism/housekeeping/schedule?propertyId=${selectedPropertyId}&date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        toast.error("Failed to fetch housekeeping tasks");
      }
    } catch (error) {
      toast.error("Error fetching housekeeping tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch(`/api/tourism/housekeeping/staff?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        toast.error("Failed to fetch staff");
      }
    } catch (error) {
      toast.error("Error fetching staff");
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string, assignedTo?: string) => {
    try {
      const response = await fetch(`/api/tourism/housekeeping/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          assignedTo: assignedTo || undefined
        }),
      });

      if (response.ok) {
        toast.success("Task status updated successfully!");
        fetchTasks();
        fetchStaff();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update task status");
      }
    } catch (error) {
      toast.error("Error updating task status");
    }
  };

  const handleAssignTask = async (taskId: string, staffId: string) => {
    try {
      const response = await fetch(`/api/tourism/housekeeping/tasks/${taskId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });

      if (response.ok) {
        toast.success("Task assigned successfully!");
        fetchTasks();
        fetchStaff();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign task");
      }
    } catch (error) {
      toast.error("Error assigning task");
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case "check_out_clean":
        return "bg-blue-100 text-blue-800";
      case "stayover_clean":
        return "bg-green-100 text-green-800";
      case "deep_clean":
        return "bg-purple-100 text-purple-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskTypeText = (taskType: string) => {
    switch (taskType) {
      case "check_out_clean":
        return "Check-out Clean";
      case "stayover_clean":
        return "Stayover Clean";
      case "deep_clean":
        return "Deep Clean";
      case "maintenance":
        return "Maintenance";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    delayed: tasks.filter(t => t.status === "delayed").length,
  };

  const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor/rooms" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Rooms
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Housekeeping Schedule</h1>
          <p className="text-gray-600 mt-2">Manage cleaning tasks and staff assignments</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <PropertySelector
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={setSelectedPropertyId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select housekeeping date"
              placeholder="Select housekeeping date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Filter housekeeping tasks"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>

        {selectedPropertyId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">{taskStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{taskStats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-xl font-bold text-blue-600">{taskStats.inProgress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-green-600">{taskStats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Delayed</p>
                    <p className="text-xl font-bold text-red-600">{taskStats.delayed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Summary */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Estimated Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Time Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(totalActualTime / 60)}h {totalActualTime % 60}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalEstimatedTime > 0 ? Math.round((totalEstimatedTime / totalActualTime) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tasks ({filteredTasks.length})
                </h2>
                <Link
                  href={`/dashboard/rooms/housekeeping/new`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Task
                </Link>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="mt-2 text-gray-500">No tasks found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900">{task.roomName}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTaskTypeColor(task.taskType)}`}>
                                  {getTaskTypeText(task.taskType)}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{task.roomType}</p>
                              {task.guestName && (
                                <p className="text-sm text-gray-500">Guest: {task.guestName}</p>
                              )}
                              {task.checkOutTime && (
                                <p className="text-sm text-gray-500">Check-out: {task.checkOutTime}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-500">
                                  Est: {task.estimatedTime}min
                                </span>
                                {task.actualTime && (
                                  <span className="text-sm text-gray-500">
                                    Actual: {task.actualTime}min
                                  </span>
                                )}
                                {task.assignedTo && (
                                  <span className="text-sm text-gray-500">
                                    Assigned to: {task.assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {task.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{task.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          {task.status === "pending" && (
                            <>
                              <select
                                value={task.assignedTo || ""}
                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                title="Assign housekeeping task"
                              >
                                <option value="">Assign to...</option>
                                {staff.filter(s => s.isAvailable).map((staffMember) => (
                                  <option key={staffMember.id} value={staffMember.name}>
                                    {staffMember.name} ({staffMember.currentTasks} tasks)
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleTaskStatusChange(task.id, "in_progress")}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Start
                              </button>
                            </>
                          )}
                          
                          {task.status === "in_progress" && (
                            <>
                              <input
                                type="number"
                                placeholder="Actual time (min)"
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onBlur={(e) => {
                                  const actualTime = parseInt(e.target.value);
                                  if (actualTime && actualTime > 0) {
                                    // Update actual time
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleTaskStatusChange(task.id, "completed")}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Overview */}
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Staff Overview</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((staffMember) => (
                    <div key={staffMember.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{staffMember.name}</h4>
                          <p className="text-sm text-gray-500">{staffMember.role}</p>
                          <p className="text-sm text-gray-500">
                            {staffMember.currentTasks} active tasks
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          staffMember.isAvailable ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view housekeeping schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}
