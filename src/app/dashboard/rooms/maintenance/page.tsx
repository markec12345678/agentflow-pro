"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface MaintenanceTask {
  id: string;
  roomId: string;
  roomName: string;
  roomType: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "on_hold";
  category: "plumbing" | "electrical" | "hvac" | "furniture" | "appliance" | "general";
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedTime: number; // in hours
  actualTime?: number;
  scheduledDate: string;
  completedAt?: string;
  reportedBy: string;
  reportedAt: string;
  notes?: string;
  photos?: string[];
  parts?: Array<{
    name: string;
    quantity: number;
    cost: number;
    status: "ordered" | "received" | "installed";
  }>;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  isAvailable: boolean;
  currentTasks: number;
}

interface Room {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchTasks();
      fetchStaff();
      fetchRooms();
    }
  }, [selectedPropertyId]);

  const fetchTasks = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/maintenance/tasks?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        toast.error("Failed to fetch maintenance tasks");
      }
    } catch (error) {
      toast.error("Error fetching maintenance tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch(`/api/tourism/maintenance/staff?propertyId=${selectedPropertyId}`);
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

  const fetchRooms = async () => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch(`/api/tourism/rooms/status?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else {
        toast.error("Failed to fetch rooms");
      }
    } catch (error) {
      toast.error("Error fetching rooms");
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tourism/maintenance/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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
      const response = await fetch(`/api/tourism/maintenance/tasks/${taskId}/assign`, {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "plumbing":
        return "bg-blue-100 text-blue-800";
      case "electrical":
        return "bg-yellow-100 text-yellow-800";
      case "hvac":
        return "bg-green-100 text-green-800";
      case "furniture":
        return "bg-purple-100 text-purple-800";
      case "appliance":
        return "bg-orange-100 text-orange-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "plumbing":
        return "Plumbing";
      case "electrical":
        return "Electrical";
      case "hvac":
        return "HVAC";
      case "furniture":
        return "Furniture";
      case "appliance":
        return "Appliance";
      case "general":
        return "General";
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
      case "on_hold":
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
    onHold: tasks.filter(t => t.status === "on_hold").length,
  };

  const totalEstimatedCost = tasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0);
  const totalActualCost = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor/rooms" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Rooms
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-2">Track and manage maintenance tasks and repairs</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">On Hold</p>
                    <p className="text-xl font-bold text-red-600">{taskStats.onHold}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Estimated Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">€{totalEstimatedCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Cost Spent</p>
                  <p className="text-2xl font-bold text-gray-900">€{totalActualCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cost Variance</p>
                  <p className={`text-2xl font-bold ${
                    totalEstimatedCost > 0 && totalActualCost <= totalEstimatedCost ? "text-green-600" : "text-red-600"
                  }`}>
                    €{(totalEstimatedCost - totalActualCost).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter:</label>
                  <div className="flex space-x-2">
                    {["all", "pending", "in_progress", "completed", "on_hold"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          filter === status
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  New Task
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tasks ({filteredTasks.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No maintenance tasks found</p>
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
                                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(task.category)}`}>
                                  {getCategoryText(task.category)}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{task.roomName} • {task.roomType}</p>
                              <p className="text-sm text-gray-500">Reported by {task.reportedBy} on {format(new Date(task.reportedAt), "MMM d, yyyy")}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-500">
                                  Est: {task.estimatedTime}h
                                </span>
                                {task.actualTime && (
                                  <span className="text-sm text-gray-500">
                                    Actual: {task.actualTime}h
                                  </span>
                                )}
                                {task.estimatedCost && (
                                  <span className="text-sm text-gray-500">
                                    Est: €{task.estimatedCost.toFixed(2)}
                                  </span>
                                )}
                                {task.actualCost && (
                                  <span className="text-sm text-gray-500">
                                    Actual: €{task.actualCost.toFixed(2)}
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
                          
                          <p className="text-gray-700 mt-2">{task.description}</p>
                          
                          {task.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{task.notes}</p>
                            </div>
                          )}
                          
                          {task.parts && task.parts.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Parts:</p>
                              <div className="flex flex-wrap gap-2">
                                {task.parts.map((part, index) => (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      part.status === "installed" ? "bg-green-100 text-green-800" :
                                      part.status === "received" ? "bg-blue-100 text-blue-800" :
                                      "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {part.name} ({part.quantity}) - {part.status}
                                  </span>
                                ))}
                              </div>
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
                              >
                                <option value="">Assign to...</option>
                                {staff.filter(s => s.isAvailable).map((staffMember) => (
                                  <option key={staffMember.id} value={staffMember.id}>
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
                              <button
                                onClick={() => handleTaskStatusChange(task.id, "on_hold")}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                              >
                                Hold
                              </button>
                              <button
                                onClick={() => handleTaskStatusChange(task.id, "completed")}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          
                          {task.status === "on_hold" && (
                            <button
                              onClick={() => handleTaskStatusChange(task.id, "in_progress")}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Resume
                            </button>
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            {staffMember.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
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
            <p className="text-gray-500">Please select a property to view maintenance tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
