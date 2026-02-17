"use client";

import {
  StatusList,
  CICDStatus,
  DeployStatus,
  AgentStatus,
  type StatusType,
} from "@/web/components";
import Link from "next/link";

export default function MonitoringPage() {
  const pipelineStatuses = [
    {
      pipeline: "CI - Main",
      status: "success" as StatusType,
      duration: "2m 34s",
      timestamp: "5 min ago",
    },
    {
      pipeline: "CI - Develop",
      status: "running" as StatusType,
      timestamp: "Running now",
    },
    {
      pipeline: "E2E Tests",
      status: "success" as StatusType,
      duration: "8m 12s",
      timestamp: "10 min ago",
    },
    {
      pipeline: "Security Scan",
      status: "warning" as StatusType,
      duration: "1m 45s",
      timestamp: "15 min ago",
    },
  ];

  const deployStatuses = [
    {
      environment: "Production",
      url: "https://agentflow-pro.vercel.app",
      status: "success" as StatusType,
      commit: "abc123",
    },
    {
      environment: "Staging",
      url: "https://staging.agentflow-pro.vercel.app",
      status: "success" as StatusType,
      commit: "def456",
    },
    {
      environment: "Development",
      status: "running" as StatusType,
    },
  ];

  const agentStatuses = [
    {
      agentName: "Research Agent",
      status: "success" as StatusType,
      runsToday: 24,
      lastRun: "2 min ago",
    },
    {
      agentName: "Content Agent",
      status: "running" as StatusType,
      runsToday: 18,
      lastRun: "Now",
    },
    {
      agentName: "Code Agent",
      status: "success" as StatusType,
      runsToday: 12,
      lastRun: "12 min ago",
    },
    {
      agentName: "Deploy Agent",
      status: "idle" as StatusType,
      runsToday: 8,
      lastRun: "1 hour ago",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">System Monitoring</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time status of all systems
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* CI/CD Pipelines */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="mb-6 text-2xl font-bold">CI/CD Pipelines</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {pipelineStatuses.map((pipeline, index) => (
            <CICDStatus key={index} {...pipeline} />
          ))}
        </div>
      </div>

      {/* Deployments */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="mb-6 text-2xl font-bold">Deployments</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {deployStatuses.map((deploy, index) => (
            <DeployStatus key={index} {...deploy} />
          ))}
        </div>
      </div>

      {/* Agent Health */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="mb-6 text-2xl font-bold">Agent Health</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {agentStatuses.map((agent, index) => (
            <AgentStatus key={index} {...agent} />
          ))}
        </div>
      </div>

      {/* System Status List */}
      <div className="max-w-7xl mx-auto">
        <h2 className="mb-6 text-2xl font-bold">System Services</h2>
        <StatusList
          items={[
            {
              status: "success",
              label: "Database (PostgreSQL)",
              timestamp: "Connected",
            },
            {
              status: "success",
              label: "Cache (Redis)",
              timestamp: "Connected",
            },
            {
              status: "success",
              label: "Stripe API",
              timestamp: "Operational",
            },
            {
              status: "success",
              label: "GitHub API",
              timestamp: "Operational",
            },
            {
              status: "warning",
              label: "Firecrawl API",
              timestamp: "Rate limited",
            },
            {
              status: "success",
              label: "Vercel API",
              timestamp: "Operational",
            },
          ]}
        />
      </div>
    </div>
  );
}
