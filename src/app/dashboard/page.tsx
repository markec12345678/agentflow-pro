"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  StatusList,
  CICDStatus,
  DeployStatus,
} from "@/web/components";
import { FeatureTour } from "@/web/components/FeatureTour";
import { PROMPTS } from "@/data/prompts";

interface Workflow {
  id: string;
  name: string;
  nodes?: unknown[];
  edges?: unknown[];
}

// Status Indicator Component
function StatusIndicator({
  status,
}: {
  status: "online" | "busy" | "offline";
}) {
  const config = {
    online: { color: "bg-green-500", text: "Online", pulse: true },
    busy: { color: "bg-yellow-500", text: "Busy", pulse: true },
    offline: { color: "bg-gray-500", text: "Offline", pulse: false },
  };

  const { color, text, pulse } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${color}`}
        />
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
}

const colorToBadge: Record<string, string> = {
  "border-green-500":
    "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  "border-blue-500":
    "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  "border-purple-500":
    "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  "border-orange-500":
    "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
};

// Agent Card Component
function AgentCard({
  name,
  icon,
  color,
  description,
  technologies,
  runsToday,
  status,
}: {
  name: string;
  icon: string;
  color: string;
  description: string;
  technologies: string[];
  runsToday: number;
  status: "online" | "busy" | "offline";
}) {
  const badgeClass = colorToBadge[color] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 ${color} hover:transform hover:scale-105`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        <StatusIndicator status={status} />
      </div>

      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {technologies.map((tech) => (
          <span
            key={tech}
            className={`text-xs px-2 py-1 rounded ${badgeClass}`}
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-2xl font-bold">{runsToday}</p>
          <p className="text-xs text-gray-500">Runs Today</p>
        </div>
        <Link
          href={`/workflows?agent=${name.toLowerCase().replace(" ", "-")}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
        >
          Create Workflow →
        </Link>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  agent,
  action,
  time,
  status,
}: {
  agent: string;
  action: string;
  time: string;
  status: "success" | "running" | "error";
}) {
  const statusConfig = {
    success: { icon: "✅", color: "text-green-600" },
    running: { icon: "🔄", color: "text-blue-600" },
    error: { icon: "❌", color: "text-red-600" },
  };

  const { icon, color } = statusConfig[status];

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">
          <span className={color}>{agent}</span> - {action}
        </p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}

const tourismPrompts = PROMPTS.filter((p) => p.category === "tourism").slice(0, 3);

interface Checkpoint {
  id: string;
  nodeId: string;
  nodeLabel: string | null;
  status: string;
  createdAt: string;
  workflow: { id: string; name: string };
}

function ApprovalQueue() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckpoints = useCallback(() => {
    fetch("/api/workflows/checkpoint")
      .then((r) => r.json())
      .then((list: Checkpoint[]) => setCheckpoints(Array.isArray(list) ? list : []))
      .catch(() => setCheckpoints([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const handleApprove = (checkpointId: string) => {
    fetch("/api/workflows/checkpoint/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpointId }),
    })
      .then((r) => r.json())
      .then(() => fetchCheckpoints());
  };

  const handleReject = (checkpointId: string) => {
    fetch("/api/workflows/checkpoint/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpointId }),
    })
      .then(() => fetchCheckpoints());
  };

  if (loading || checkpoints.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto mb-12">
      <h2 className="text-2xl font-bold mb-6">Pending Approvals</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Workflows waiting for your approval before continuing
      </p>
      <div className="space-y-3">
        {checkpoints.map((cp) => (
          <div
            key={cp.id}
            className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
          >
            <div>
              <p className="font-medium">
                {cp.workflow.name} – {cp.nodeLabel || cp.nodeId}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(cp.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReject(cp.id)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(cp.id)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tourForceOpen, setTourForceOpen] = useState(false);
  const [isTourismUser, setIsTourismUser] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data: { onboarding?: { industry?: string } }) => {
        const industry = data.onboarding?.industry;
        if (industry === "tourism" || industry === "travel-agency") {
          setIsTourismUser(true);
        }
      })
      .catch(() => { });
  }, []);

  const handleTakeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentflow-tour-seen");
    }
    setTourForceOpen(true);
  }, []);

  const tourTriggeredRef = useRef(false);
  useEffect(() => {
    if (searchParams.get("tour") === "1" && !tourTriggeredRef.current) {
      tourTriggeredRef.current = true;
      handleTakeTour();
    }
  }, [searchParams, handleTakeTour]);

  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((list: Workflow[]) => setWorkflows(Array.isArray(list) ? list : []))
      .catch(() => setWorkflows([]));
  }, []);

  // Mock data - v produkciji bi to prišlo iz API-ja
  const [agents] = useState([
    {
      name: "Research Agent",
      icon: "🔍",
      color: "border-green-500",
      description:
        "Web scraping, market intelligence, competitor analysis",
      technologies: ["Firecrawl", "SerpAPI"],
      runsToday: 24,
      status: "online" as const,
    },
    {
      name: "Content Agent",
      icon: "✍️",
      color: "border-blue-500",
      description:
        "Blog posts, social media, emails with SEO optimization",
      technologies: ["Context7", "LLM"],
      runsToday: 18,
      status: "busy" as const,
    },
    {
      name: "Code Agent",
      icon: "💻",
      color: "border-purple-500",
      description: "Code generation, reviews, auto PR creation",
      technologies: ["GitHub MCP", "Code Review"],
      runsToday: 12,
      status: "online" as const,
    },
    {
      name: "Deploy Agent",
      icon: "🚀",
      color: "border-orange-500",
      description: "One-click deploy to Vercel, Netlify with rollback",
      technologies: ["Vercel", "Netlify"],
      runsToday: 8,
      status: "online" as const,
    },
  ]);

  const [activities] = useState([
    {
      agent: "Research Agent",
      action: "Completed market analysis for competitor XYZ",
      time: "2 minutes ago",
      status: "success" as const,
    },
    {
      agent: "Content Agent",
      action: 'Generated blog post: "AI Trends 2026"',
      time: "5 minutes ago",
      status: "success" as const,
    },
    {
      agent: "Code Agent",
      action: "Created PR #42: Feature/user-authentication",
      time: "12 minutes ago",
      status: "success" as const,
    },
    {
      agent: "Deploy Agent",
      action: "Deployed to production (v1.2.3)",
      time: "15 minutes ago",
      status: "success" as const,
    },
    {
      agent: "Content Agent",
      action: "Generating social media posts...",
      time: "Now",
      status: "running" as const,
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <FeatureTour
        forceOpen={tourForceOpen}
        onComplete={() => setTourForceOpen(false)}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage your AI agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTakeTour}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Take feature tour"
            >
              Take Tour
            </button>
            <Link
              href="/workflows"
              data-feature-tour="dashboard-new-workflow"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              + New Workflow
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended for you (tourism users) */}
      {isTourismUser && tourismPrompts.length > 0 && (
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-6">Recommended for you</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tourism prompts tailored to your role
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {tourismPrompts.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/chat?prompt=${encodeURIComponent(p.prompt)}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500"
              >
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/tourism"
            className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View all Tourism Tools →
          </Link>
        </div>
      )}

      {/* Pending Approvals (HITL) */}
      <ApprovalQueue />

      {/* Saved Workflows */}
      {workflows.length > 0 && (
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-6">Saved Workflows</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <Link
                key={wf.id}
                href={`/workflows?id=${wf.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500"
              >
                <h3 className="font-semibold text-lg">{wf.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {Array.isArray(wf.nodes) ? wf.nodes.length : 0} nodes
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Agents</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.name} {...agent} />
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Overview</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Runs Today
            </p>
            <p className="text-4xl font-bold">62</p>
            <p className="text-green-600 text-sm mt-2">↑ 12% from yesterday</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Active Workflows
            </p>
            <p className="text-4xl font-bold">{workflows.length}</p>
            <p className="text-gray-500 text-sm mt-2">Saved workflows</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Success Rate
            </p>
            <p className="text-4xl font-bold">98.5%</p>
            <p className="text-green-600 text-sm mt-2">↑ 0.5% this week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              API Usage
            </p>
            <p className="text-4xl font-bold">73%</p>
            <p className="text-yellow-600 text-sm mt-2">27% remaining</p>
          </div>
        </div>
      </div>

      {/* CI/CD Status Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">CI/CD Pipeline Status</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <CICDStatus
            pipeline="Main Branch"
            status="success"
            duration="2m 34s"
            timestamp="5 minutes ago"
          />
          <CICDStatus
            pipeline="Feature Branch"
            status="running"
            timestamp="Running now"
          />
        </div>
      </div>

      {/* Deploy Status Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Deployment Status</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <DeployStatus
            environment="Production"
            url="https://agentflow-pro.vercel.app"
            status="success"
            commit="abc123"
          />
          <DeployStatus
            environment="Staging"
            url="https://staging.agentflow-pro.vercel.app"
            status="success"
            commit="def456"
          />
          <DeployStatus environment="Development" status="running" />
        </div>
      </div>

      {/* Agent Health Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Agent Health</h2>
        <StatusList
          items={[
            {
              status: "success",
              label: "Research Agent",
              timestamp: "2 minutes ago",
            },
            {
              status: "running",
              label: "Content Agent",
              timestamp: "Running now",
            },
            {
              status: "success",
              label: "Code Agent",
              timestamp: "12 minutes ago",
            },
            {
              status: "success",
              label: "Deploy Agent",
              timestamp: "15 minutes ago",
            },
          ]}
        />
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="max-w-7xl mx-auto"
        data-feature-tour="dashboard-quick-actions"
      >
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/workflows"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">➕</span>
            <span className="font-semibold">Create Workflow</span>
          </Link>
          <Link
            href="/pricing"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">💳</span>
            <span className="font-semibold">Upgrade Plan</span>
          </Link>
          <Link
            href="/docs"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-green-500 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📚</span>
            <span className="font-semibold">Documentation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
