"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface HousekeepingTask {
  id: string;
  roomName: string;
  roomType: string;
  taskType: "check_out_clean" | "stayover_clean" | "deep_clean" | "maintenance";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "delayed";
  assignedTo?: string;
  estimatedTime: number;
  scheduledDate: string;
  notes?: string;
}

export default function MobileHousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

  useEffect(() => {
    fetchTasks();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/v1/tourism/housekeeping/my-tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      toast.error("Napaka pri nalaganju nalog");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/v1/tourism/housekeeping/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      toast.success("Naloga se je začela");
      fetchTasks();
    } catch (error) {
      toast.error("Napaka pri posodabljanju");
    }
  };

  const handleCompleteTask = async (taskId: string, actualTime?: number) => {
    try {
      const res = await fetch(`/api/v1/tourism/housekeeping/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "completed",
          actualTime: actualTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      toast.success("Naloga končana! 🎉");
      fetchTasks();
      setSelectedTask(null);
    } catch (error) {
      toast.error("Napaka pri zaključku");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status !== "completed";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  const taskTypeIcon = (type: string) => {
    switch (type) {
      case "check_out_clean": return "🚪";
      case "stayover_clean": return "🛏️";
      case "deep_clean": return "✨";
      case "maintenance": return "🔧";
      default: return "📋";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧹</div>
          <div className="text-gray-600 dark:text-gray-400">Nalaganje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Moje Naloge</h1>
          <div className="text-sm opacity-90">{format(new Date(), "EEE, d. MMM")}</div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-80">Vse</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-xs opacity-80">Čaka</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <div className="text-xs opacity-80">V teku</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs opacity-80">Končano</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-[140px] z-10">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-3 text-sm font-medium ${
            filter === "all"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Vse ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-3 text-sm font-medium ${
            filter === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Čaka ({stats.pending})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex-1 py-3 text-sm font-medium ${
            filter === "completed"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Končano ({stats.completed})
        </button>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <div>Vse naloge so končane!</div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border ${
                task.status === "completed"
                  ? "border-green-200 dark:border-green-800 opacity-75"
                  : task.status === "in_progress"
                  ? "border-blue-200 dark:border-blue-800"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{taskTypeIcon(task.taskType)}</span>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {task.roomName}
                    </div>
                    <div className="text-xs text-gray-500">{task.roomType}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(task.priority)}`}>
                  {task.priority === "urgent" && "Nujno"}
                  {task.priority === "high" && "Visoka"}
                  {task.priority === "medium" && "Srednja"}
                  {task.priority === "low" && "Nizka"}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ⏱️ {task.estimatedTime} min
                </div>
                {task.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTask(task.id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Začni
                  </button>
                )}
                {task.status === "in_progress" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteTask(task.id, task.estimatedTime);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Končaj
                  </button>
                )}
                {task.status === "completed" && (
                  <span className="text-green-600 text-sm font-medium">✓ Končano</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Podrobnosti Naloge</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Soba</div>
                <div className="text-lg font-semibold">{selectedTask.roomName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Tip naloge</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{taskTypeIcon(selectedTask.taskType)}</span>
                  <span>
                    {selectedTask.taskType === "check_out_clean" && "Čiščenje ob odhodu"}
                    {selectedTask.taskType === "stayover_clean" && "Čiščenje med bivanjem"}
                    {selectedTask.taskType === "deep_clean" && "Globinsko čiščenje"}
                    {selectedTask.taskType === "maintenance" && "Vzdrževanje"}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Prioriteta</div>
                <span className={`text-sm px-2 py-1 rounded-full ${priorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority === "urgent" && "Nujno"}
                  {selectedTask.priority === "high" && "Visoka"}
                  {selectedTask.priority === "medium" && "Srednja"}
                  {selectedTask.priority === "low" && "Nizka"}
                </span>
              </div>

              <div>
                <div className="text-sm text-gray-500">Predviden čas</div>
                <div className="text-lg">⏱️ {selectedTask.estimatedTime} minut</div>
              </div>

              {selectedTask.notes && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Opombe</div>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    {selectedTask.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              {selectedTask.status === "pending" && (
                <button
                  onClick={() => handleStartTask(selectedTask.id)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Začni nalogo
                </button>
              )}
              {selectedTask.status === "in_progress" && (
                <button
                  onClick={() => handleCompleteTask(selectedTask.id, selectedTask.estimatedTime)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Zaključi nalogo
                </button>
              )}
              {selectedTask.status === "completed" && (
                <div className="flex-1 text-center py-3 text-green-600 font-medium">
                  ✓ Naloga končana
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
