"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  GitBranch, 
  Plus, 
  Search, 
  MoreVertical, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Trash2, 
  Edit3,
  Loader2,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (res.ok) {
        setWorkflows(data);
      }
    } catch (error) {
      toast.error("Napaka pri nalaganju delovnih tokov");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/workflows");
    } else if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "admin" && role !== "director") {
        toast.error("Dostop zavrnjen.");
        router.push("/dashboard");
        return;
      }
      fetchWorkflows();
    }
  }, [status, fetchWorkflows, router, session]);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nov delovni tok", nodes: [], edges: [] }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/workflows/${data.id}`);
      }
    } catch (error) {
      toast.error("Napaka pri ustvarjanju");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ali ste prepričani, da želite izbrisati ta delovni tok?")) return;
    try {
      const res = await fetch(`/api/v1/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Izbrisano");
        fetchWorkflows();
      }
    } catch (error) {
      toast.error("Napaka pri brisanju");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
              <GitBranch className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Workflow Builder</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Upravljajte in avtomatizirajte procese z AI agenti.</p>
            </div>
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Nov Workflow
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Išči po imenu ali opisu..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" />
            Filtri
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      workflow.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-bold text-xl mb-2 group-hover:text-indigo-600 transition-colors">{workflow.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-6">
                  {workflow.description || "Brez opisa. Kliknite za urejanje in dodajanje agentov v ta delovni tok."}
                </p>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Posodobljeno {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true, locale: sl })}
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => router.push(`/workflows/${workflow.id}`)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Uredi"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Podvoji"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(workflow.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Izbriši"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                >
                  Odpri Builder
                </button>
              </div>
            </div>
          ))}

          {filteredWorkflows.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <GitBranch className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ni najdenih delovnih tokov</h3>
              <p className="text-gray-500 mb-8">Ustvarite svoj prvi avtomatiziran delovni tok z AI agenti.</p>
              <button 
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Ustvari Workflow
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
