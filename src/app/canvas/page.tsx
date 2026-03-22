"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Pusher from "pusher-js";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CampaignNode } from "@/web/components/canvas/CampaignNode";
import { TopicNode } from "@/web/components/canvas/TopicNode";
import { ContentBriefNode } from "@/web/components/canvas/ContentBriefNode";
import Link from "next/link";
import { useSession } from "next-auth/react";

const PUSHER_KEY = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_PUSHER_KEY : "";

const nodeTypes = {
  campaign: CampaignNode,
  topic: TopicNode,
  contentbrief: ContentBriefNode,
};

type NodeTypeName = "campaign" | "topic" | "contentbrief";

let nodeId = 0;
const getId = () => `node_${++nodeId}_${Date.now()}`;

const initialNodes: Node[] = [
  {
    id: "camp1",
    type: "campaign",
    position: { x: 100, y: 100 },
    data: { title: "Q1 Blog Campaign", brief: "SEO-focused blog series", status: "planning" },
  },
  {
    id: "topic1",
    type: "topic",
    position: { x: 400, y: 100 },
    data: { topic: "How to scale content" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "camp1", target: "topic1" },
];

function CanvasInner() {
  const searchParams = useSearchParams();
  const boardId = searchParams.get("id");
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [boardName, setBoardName] = useState("Campaign Board");
  const [boardIdState, setBoardIdState] = useState<string | null>(boardId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!boardId || !PUSHER_KEY) return;
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: (process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string) || "eu",
    });
    const channel = pusher.subscribe(`canvas-${boardId}`);
    channel.bind("canvas-update", (data: { nodes?: unknown[]; edges?: unknown[]; name?: string }) => {
      if (Array.isArray(data.nodes)) {
        setNodes(
          data.nodes.map((nd) => {
            const node = nd as { id: string; type?: string; position?: { x: number; y: number }; data?: object };
            return {
              ...node,
              type: (node.type as NodeTypeName) ?? "topic",
              position: node.position ?? { x: 0, y: 0 },
              data: (node.data ?? {}) as Record<string, unknown>,
            };
          })
        );
      }
      if (Array.isArray(data.edges)) setEdges(data.edges as Edge[]);
      if (typeof data.name === "string") setBoardName(data.name);
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`canvas-${boardId}`);
    };
  }, [boardId, setNodes, setEdges]);

  useEffect(() => {
    if (!boardId) return;
    fetch(`/api/canvas/${boardId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((board) => {
        if (board) {
          setBoardName(board.name ?? "Campaign Board");
          setBoardIdState(board.id);
          const n = Array.isArray(board.nodes) ? board.nodes : [];
          const e = Array.isArray(board.edges) ? board.edges : [];
          setNodes(
            n.map((nd: { id: string; type?: string; position?: { x: number; y: number }; data?: object }) => ({
              ...nd,
              type: (nd.type as NodeTypeName) ?? "topic",
              position: nd.position ?? { x: 0, y: 0 },
            }))
          );
          setEdges(e);
        }
      })
      .catch(() => { });
  }, [boardId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#3b82f6" } }, eds)
      ),
    [setEdges]
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: boardName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      };
      if (boardIdState) {
        const res = await fetch(`/api/canvas/${boardIdState}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
      } else {
        const res = await fetch("/api/canvas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Save failed");
        setBoardIdState(data.id);
        window.history.replaceState({}, "", `/canvas?id=${data.id}`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [boardName, nodes, edges, boardIdState]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow") as NodeTypeName;
      if (!type || !["campaign", "topic", "contentbrief"].includes(type)) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const data =
        type === "campaign"
          ? { title: "New Campaign", brief: "", status: "planning" }
          : type === "topic"
            ? { topic: "New topic" }
            : { title: "Content Brief", brief: "", targetAudience: "", keywords: "" };
      const newNode: Node = { id: getId(), type, position, data };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="flex w-64 flex-col border-r border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 p-4">
          <h2 className="mb-2 text-xl font-bold text-white">Campaign Canvas</h2>
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="w-full rounded-sm border border-gray-600 bg-gray-700 px-3 py-2 text-white"
            placeholder="Enter campaign board name"
            title="Campaign board name input"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <div className="flex-1 p-4">
          <p className="mb-2 text-sm text-gray-400">Drag to add</p>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", "campaign");
              e.dataTransfer.effectAllowed = "move";
            }}
            className="mb-2 cursor-grab rounded-lg border border-amber-500 bg-amber-900/30 p-3 text-amber-200"
          >
            Campaign
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", "topic");
              e.dataTransfer.effectAllowed = "move";
            }}
            className="mb-2 cursor-grab rounded-lg border border-blue-500 bg-blue-900/30 p-3 text-blue-200"
          >
            Topic
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", "contentbrief");
              e.dataTransfer.effectAllowed = "move";
            }}
            className="cursor-grab rounded-lg border border-emerald-500 bg-emerald-900/30 p-3 text-emerald-200"
          >
            Content brief
          </div>
        </div>
        <div className="border-t border-gray-700 p-4">
          <Link href="/content" className="text-sm text-blue-400 hover:underline">
            ← Content
          </Link>
        </div>
      </aside>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

function CanvasList() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as { userId?: string })?.userId ?? session?.user?.email;
  const [boards, setBoards] = useState<{ id: string; name: string; teamId?: string | null; workspaceId?: string | null }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; type: string; teamId: string }[]>([]);
  const [createTeamId, setCreateTeamId] = useState<string>("");
  const [createWorkspaceId, setCreateWorkspaceId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/canvas")
      .then((r) => r.json())
      .then((data) => setBoards(data.boards ?? []))
      .catch(() => setBoards([]));
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        const list = data.teams ?? [];
        const adminTeams = list.filter((t: { members?: { role: string; user: { id: string } }[] }) =>
          t.members?.some(
            (m: { role: string; user: { id: string } }) =>
              m.user?.id === userId && (m.role === "owner" || m.role === "admin")
          )
        );
        setTeams(adminTeams);
      })
      .catch(() => setTeams([]));
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((list: { id: string; name: string; type: string; teamId: string }[]) => setWorkspaces(Array.isArray(list) ? list : []))
      .catch(() => setWorkspaces([]));
  }, [userId]);

  const createBoard = () => {
    setCreating(true);
    const body: { name: string; teamId?: string; workspaceId?: string } = { name: "Untitled Board" };
    if (createTeamId) body.teamId = createTeamId;
    if (createWorkspaceId) body.workspaceId = createWorkspaceId;
    fetch("/api/canvas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to create board");
        const text = await r.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data?.id) router.push(`/canvas?id=${data.id}`);
      })
      .catch((err) => {
        console.error("Error creating board:", err);
        alert("Failed to create board. Please try again.");
      })
      .finally(() => setCreating(false));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/content" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Content
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Campaign Canvas</h1>
        <p className="text-gray-400 mb-8">
          Plan campaigns visually. Drag Campaign and Topic cards, connect them.
        </p>
        {teams.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Create as team board (optional)</label>
            <select
              value={createTeamId}
              onChange={(e) => {
                setCreateTeamId(e.target.value);
                setCreateWorkspaceId("");
              }}
              className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              title="Select team for campaign board"
            >
              <option value="">Personal board</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
        {createTeamId && workspaces.filter((w) => {
          const team = teams.find((t) => t.id === createTeamId);
          return team && w.teamId === createTeamId;
        }).length > 0 && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Workspace (optional)</label>
            <select
              value={createWorkspaceId}
              onChange={(e) => setCreateWorkspaceId(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              title="Select workspace for campaign board"
            >
              <option value="">No workspace</option>
              {workspaces.filter((w) => w.teamId === createTeamId).map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={createBoard}
          disabled={creating}
          className="mb-6 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {creating ? "Creating..." : "New Board"}
        </button>
        <div className="space-y-2">
          {boards.map((b) => (
            <Link
              key={b.id}
              href={`/canvas?id=${b.id}`}
              className="block rounded-lg border border-gray-700 bg-gray-800 p-4 text-white hover:border-gray-600"
            >
              {b.name}
            </Link>
          ))}
          {boards.length === 0 && (
            <p className="text-gray-500">No boards yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <div className="h-screen">
      <ReactFlowProvider>
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>}>
          <CanvasPageInner />
        </Suspense>
      </ReactFlowProvider>
    </div>
  );
}

function CanvasPageInner() {
  const searchParams = useSearchParams();
  const boardId = searchParams.get("id");

  if (!boardId || boardId === "new") {
    return <CanvasList />;
  }

  return <CanvasInner />;
}
