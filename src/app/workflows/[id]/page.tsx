"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Node,
  Edge,
  Connection,
  Panel,
  Handle,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  ChevronLeft, 
  Save, 
  Play, 
  Plus, 
  Settings, 
  Zap, 
  Trash2, 
  Bot, 
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Share2
} from "lucide-react";
import { toast } from "sonner";

// --- Custom Node Components ---

const AgentNode = ({ data, selected }: any) => (
  <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl transition-all ${selected ? "border-indigo-500 scale-105" : "border-gray-100 dark:border-gray-800"}`}>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${data.color || "bg-indigo-50 text-indigo-600"}`}>
        {data.icon || <Bot className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{data.type || "Agent"}</p>
        <p className="text-sm font-bold">{data.label}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
  </div>
);

const TriggerNode = ({ data, selected }: any) => (
  <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl transition-all ${selected ? "border-amber-500 scale-105" : "border-gray-100 dark:border-gray-800"}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
        <Zap className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Trigger</p>
        <p className="text-sm font-bold">{data.label}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-white" />
  </div>
);

const nodeTypes = {
  agent: AgentNode,
  trigger: TriggerNode
};

// --- Main Builder Page ---

export default function WorkflowBuilderPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id: workflowId } = useParams();
  
  const [workflow, setWorkflow] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutions] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`);
      const data = await res.json();
      if (res.ok) {
        setWorkflow(data);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
      
      const execRes = await fetch(`/api/workflows/${workflowId}/executions`);
      const execData = await execRes.json();
      if (execRes.ok) setExecutions(execData);
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      if (res.ok) toast.success("Workflow shranjen");
    } catch (error) {
      toast.error("Napaka pri shranjevanju");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setShowLogs(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, { method: "POST" });
      if (res.ok) {
        toast.success("Izvajanje zagnano");
        setTimeout(fetchData, 3000);
      }
    } catch (error) {
      toast.error("Napaka pri izvajanju");
    } finally {
      setIsExecuting(false);
    }
  };

  const addAgent = (type: string, label: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "agent",
      position: { x: 250, y: 250 },
      data: { label, type, icon: type === "Content" ? <FileText className="w-5 h-5" /> : <Bot className="w-5 h-5" /> },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      
      {/* Header Toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/workflows")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{workflow?.name}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflow Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-all"
            title="Zgodovina izvajanj"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Shrani
          </button>
          <button 
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Test Workflow
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        
        {/* Sidebar - Node Palette */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6 space-y-8 z-10 overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Triggers</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setNodes(nds => nds.concat({ id: `t-${Date.now()}`, type: "trigger", position: { x: 100, y: 100 }, data: { label: "Nova Rezervacija" } }))}
                className="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all border border-amber-100 dark:border-amber-800"
              >
                <Zap className="w-4 h-4" />
                Nova Rezervacija
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed opacity-50">
                <Clock className="w-4 h-4" />
                Časovna sprožitev
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">AI Agenti</h3>
            <div className="space-y-2">
              {[
                { type: "Content", label: "Content Creator", icon: <FileText className="w-4 h-4" /> },
                { type: "Marketing", label: "SEO Expert", icon: <Share2 className="w-4 h-4" /> },
                { type: "Sync", label: "AJPES Syncer", icon: <RefreshCcw className="w-4 h-4" /> },
                { type: "Communication", label: "Guest Bot", icon: <MessageSquare className="w-4 h-4" /> }
              ].map(agent => (
                <button 
                  key={agent.type}
                  onClick={() => addAgent(agent.type, agent.label)}
                  className="w-full flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800"
                >
                  {agent.icon}
                  {agent.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Akcije</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100 dark:border-green-800">
                <Database className="w-4 h-4" />
                Shrani v bazo
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-800">
                <Send className="w-4 h-4" />
                Pošlji obvestilo
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-50 dark:bg-black/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#ccc" variant="dots" />
            <Controls />
            <Panel position="top-right" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl flex gap-2">
              <button className="p-2 text-gray-400 hover:text-indigo-600"><Settings className="w-4 h-4" /></button>
              <button 
                onClick={() => { setNodes([]); setEdges([]); }}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar - Logs/Execution History */}
        {showLogs && (
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 p-6 z-10 overflow-y-auto animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">Zgodovina izvajanj</h3>
              <button onClick={() => setShowLogs(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {executionLogs.map((exec) => (
                <div key={exec.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      exec.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {exec.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(exec.createdAt).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {exec.logs?.map((log: any, i: number) => (
                      <div key={i} className="flex gap-2 text-[10px]">
                        <span className="text-gray-400 font-mono">[{log.step}]</span>
                        <span className="text-gray-600 dark:text-gray-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {executionLogs.length === 0 && (
                <div className="py-20 text-center text-gray-400 text-xs italic">Ni še bilo izvajanj tega toka.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
