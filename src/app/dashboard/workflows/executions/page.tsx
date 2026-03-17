"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCcw,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  logs?: Array<{
    step: string;
    message: string;
    time: string;
  }>;
  result?: any;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  workflow?: {
    name: string;
  };
}

interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  avgDuration: number;
}

export default function WorkflowExecutionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState<ExecutionStats>({
    total: 0,
    completed: 0,
    failed: 0,
    running: 0,
    successRate: 0,
    avgDuration: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week");

  const fetchExecutions = async () => {
    try {
      const res = await fetch("/api/v1/workflows/executions");
      if (res.ok) {
        const data = await res.json();
        setExecutions(data);
        calculateStats(data);
      }
    } catch (error) {
      toast.error("Napaka pri pridobivanju izvajanj");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (executions: WorkflowExecution[]) => {
    const total = executions.length;
    const completed = executions.filter(e => e.status === "completed").length;
    const failed = executions.filter(e => e.status === "failed").length;
    const running = executions.filter(e => e.status === "running").length;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average duration
    let totalDuration = 0;
    let completedCount = 0;
    executions.forEach(exec => {
      if (exec.startedAt && exec.finishedAt) {
        const duration = new Date(exec.finishedAt).getTime() - new Date(exec.startedAt).getTime();
        totalDuration += duration;
        completedCount++;
      }
    });
    const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    setStats({
      total,
      completed,
      failed,
      running,
      successRate: Math.round(successRate * 10) / 10,
      avgDuration: Math.round(avgDuration)
    });
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchExecutions();
    }
  }, [status]);

  useEffect(() => {
    let filtered = [...executions];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.workflow?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateRange === "today") {
      filtered = filtered.filter(e => new Date(e.createdAt) >= today);
    } else if (dateRange === "week") {
      filtered = filtered.filter(e => new Date(e.createdAt) >= weekAgo);
    } else if (dateRange === "month") {
      filtered = filtered.filter(e => new Date(e.createdAt) >= monthAgo);
    }

    setFilteredExecutions(filtered);
  }, [executions, statusFilter, searchQuery, dateRange]);

  const handleViewDetails = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setShowDetailsModal(true);
  };

  const handleRetry = async (executionId: string) => {
    try {
      const res = await fetch(`/api/v1/workflows/executions/${executionId}/retry`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Izvajanje ponovno zagnano");
        fetchExecutions();
      } else {
        toast.error("Napaka pri ponovnem zagonu");
      }
    } catch (error) {
      toast.error("Napaka pri ponovnem zagonu");
    }
  };

  const handleDelete = async (executionId: string) => {
    if (!confirm("Ali ste prepričani, da želite izbrisati to izvajanje?")) return;

    try {
      const res = await fetch(`/api/v1/workflows/executions/${executionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Izvajanje izbrisano");
        fetchExecutions();
      } else {
        toast.error("Napaka pri brisanju");
      }
    } catch (error) {
      toast.error("Napaka pri brisanju");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <RefreshCcw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "running":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportToCSV = () => {
    const headers = ["ID", "Workflow", "Status", "Started At", "Duration", "Created At"];
    const rows = filteredExecutions.map(e => {
      const duration = e.startedAt && e.finishedAt
        ? formatDuration(new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime())
        : "-";
      return [
        e.id,
        e.workflow?.name || "-",
        e.status,
        e.startedAt ? new Date(e.startedAt).toLocaleString() : "-",
        duration,
        new Date(e.createdAt).toLocaleString()
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-executions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV prenešen");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje izvajanj...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Workflow Executions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pregled vseh izvajanj delovnih tokov
            </p>
          </div>
          <button
            onClick={fetchExecutions}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Osveži
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skupaj Izvajanj</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uspešnost</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Povp. Trajanje</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatDuration(stats.avgDuration)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">V Teeku</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.running}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Išči po workflow ali ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Vsi statusi</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="today">Danes</option>
                <option value="week">Zadnjih 7 dni</option>
                <option value="month">Zadnjih 30 dni</option>
                <option value="all">Vse</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Executions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Začeto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trajanje
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Ni najdenih izvajanj
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExecutions.map((execution) => {
                    const duration = execution.startedAt && execution.finishedAt
                      ? formatDuration(
                          new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()
                        )
                      : execution.status === "running"
                      ? "V teeku..."
                      : "-";

                    return (
                      <tr
                        key={execution.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusBadgeClass(
                                execution.status
                              )}`}
                            >
                              {execution.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {execution.workflow?.name || "Unknown Workflow"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {execution.id.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {execution.startedAt
                              ? new Date(execution.startedAt).toLocaleString("sl-SI")
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{duration}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(execution)}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-all"
                              title="Poglej podrobnosti"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {execution.status === "failed" && (
                              <button
                                onClick={() => handleRetry(execution.id)}
                                className="p-2 text-gray-400 hover:text-amber-600 transition-all"
                                title="Poskusi ponovno"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(execution.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-all"
                              title="Izbriši"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedExecution && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Podrobnosti Izvajanja
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {selectedExecution.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Workflow</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedExecution.workflow?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${getStatusBadgeClass(
                        selectedExecution.status
                      )}`}
                    >
                      {selectedExecution.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Začeto</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedExecution.startedAt
                        ? new Date(selectedExecution.startedAt).toLocaleString("sl-SI")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Končano</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedExecution.finishedAt
                        ? new Date(selectedExecution.finishedAt).toLocaleString("sl-SI")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Logs */}
                {selectedExecution.logs && selectedExecution.logs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                      Dnevnik Izvajanja
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                      {selectedExecution.logs.map((log, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                            {new Date(log.time).toLocaleTimeString()}
                          </span>
                          <span className="font-bold text-gray-600 dark:text-gray-300">
                            [{log.step}]
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {selectedExecution.result && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                      Rezultat
                    </h3>
                    <pre className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedExecution.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                {selectedExecution.status === "failed" && (
                  <button
                    onClick={() => handleRetry(selectedExecution.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Poskusi Ponovno
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Zapri
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
