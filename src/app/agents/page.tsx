"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pause, 
  Play, 
  Zap, 
  List, 
  ShieldCheck, 
  Loader2,
  RefreshCcw,
  BarChart3,
  Terminal
} from "lucide-react";
import { parseISO, formatDistanceToNow } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "paused" | "error";
  lastRun: string;
  successRate: number;
  queue: number;
}

export default function AgentsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/status");
      const data = await res.json();
      if (res.ok) {
        setAgents(data);
      } else {
        toast.error(data.error || "Napaka pri nalaganju agentov");
      }
    } catch {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (status === "unauthenticated") {
        router.push("/login?callbackUrl=/agents");
      } else if (status === "authenticated") {
        // Get user role from database
        const userId = session?.user?.userId || (session?.user as { id?: string })?.id;
        let userRole = null;
        
        if (userId) {
          try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
              const userData = await response.json();
              userRole = userData.data?.role;
            }
          } catch (error) {
            logger.error("Failed to fetch user role:", error);
          }
        }
        
        if (userRole !== "admin" && userRole !== "director") {
          toast.error("Dostop zavrnjen. Samo za vodstvo.");
          router.push("/dashboard");
          return;
        }
        fetchAgents();
      }
    };
    
    checkAuth();
  }, [status, fetchAgents, router, session]);

  const handleAgentAction = async (agentId: string, action: "trigger" | "pause" | "resume") => {
    setActionLoading(`${agentId}-${action}`);
    try {
      const res = await fetch("/api/agents/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, action }),
      });
      if (res.ok) {
        toast.success(`Agent: ${action === "trigger" ? "Sprožen" : action === "pause" ? "Zaustavljen" : "Nadaljuje delo"}`);
        fetchAgents();
      } else {
        toast.error("Napaka pri izvajanju akcije");
      }
    } catch {
      toast.error("Sistemska napaka");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const activeCount = agents.filter(a => a.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">AI Agent Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                Nadzorni center za vseh <span className="font-bold text-blue-600">{agents.length} agentov</span> avtomatizacije.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(activeCount)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 animate-pulse"></div>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-500">{activeCount} / {agents.length} Online</span>
            </div>
            <button 
              onClick={fetchAgents}
              title="Refresh agents"
              className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-all"
            >
              <RefreshCcw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Vsi Agenti", value: agents.length, icon: Bot, color: "blue" },
            { label: "Aktivni", value: activeCount, icon: Zap, color: "green" },
            { label: "V čakalni vrsti", value: agents.reduce((acc, a) => acc + a.queue, 0), icon: List, color: "amber" },
            { label: "Povprečna uspešnost", value: `${Math.round(agents.reduce((acc, a) => acc + a.successRate, 0) / agents.length)}%`, icon: BarChart3, color: "indigo" }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${agent.status === "active" ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" : "bg-gray-400"}`}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{agent.status}</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-1">{agent.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{agent.type}</p>
              </div>

              {/* Metrics */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Zadnji zagon</span>
                  <span className="font-bold">{formatDistanceToNow(parseISO(agent.lastRun), { addSuffix: true, locale: sl })}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Uspešnost</span>
                  <span className={`font-bold ${agent.successRate > 95 ? "text-green-600" : "text-amber-600"}`}>{agent.successRate}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5"><List className="w-3 h-3" /> Čakalna vrsta</span>
                  <span className="font-bold">{agent.queue} opravil</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button 
                  onClick={() => handleAgentAction(agent.id, "trigger")}
                  disabled={!!actionLoading || agent.status === "paused"}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Ročno sproži agenta"
                >
                  {actionLoading === `${agent.id}-trigger` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Run
                </button>
                
                {agent.status === "active" ? (
                  <button 
                    onClick={() => handleAgentAction(agent.id, "pause")}
                    disabled={!!actionLoading}
                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all"
                    title="Zaustavi agenta"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAgentAction(agent.id, "resume")}
                    disabled={!!actionLoading}
                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all"
                    title="Nadaljuj delo"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                
                <button 
                  className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"
                  title="Poglej loge"
                >
                  <Terminal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Activity Log */}
        <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Zadnje aktivnosti agentov
            </h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">Vsi logi</button>
          </div>
          <div className="space-y-4">
            {[
              { agent: "Content Creator", action: "Ustvaril nov blog post za Vila Planina", status: "success", time: "2 minuti nazaj" },
              { agent: "Reservation Bot", action: "Avtomatsko potrdil rezervacijo #9283", status: "success", time: "15 minut nazaj" },
              { agent: "AJPES Syncer", action: "Napaka pri povezavi s strežnikom AJPES", status: "error", time: "1 ura nazaj" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-none">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${log.status === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {log.status === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{log.agent}</p>
                    <p className="text-xs text-gray-500">{log.action}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
