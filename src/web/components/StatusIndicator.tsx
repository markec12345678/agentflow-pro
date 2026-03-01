"use client";

export type StatusType = "success" | "running" | "error" | "warning" | "idle";

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  timestamp?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  success: {
    color: "bg-green-500",
    textColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
    text: "Success",
    icon: "✅",
    pulse: false,
  },
  running: {
    color: "bg-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-500",
    text: "Running",
    icon: "🔄",
    pulse: true,
  },
  error: {
    color: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-500",
    text: "Error",
    icon: "❌",
    pulse: false,
  },
  warning: {
    color: "bg-yellow-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-500",
    text: "Warning",
    icon: "⚠️",
    pulse: false,
  },
  idle: {
    color: "bg-gray-500",
    textColor: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    borderColor: "border-gray-500",
    text: "Idle",
    icon: "⏸️",
    pulse: false,
  },
};

export function StatusIndicator({
  status,
  label,
  timestamp,
  showLabel = true,
  size = "md",
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "h-2 w-2 text-xs",
    md: "h-3 w-3 text-sm",
    lg: "h-4 w-4 text-base",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border-l-4 p-4 transition-all hover:shadow-md ${config.bgColor} ${config.borderColor}`}
    >
      {/* Status Dot */}
      <span className="relative flex items-center justify-center">
        {config.pulse && (
          <span
            className={`absolute inline-flex animate-ping rounded-full opacity-75 ${sizeClasses[size]} ${config.color}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${sizeClasses[size]} ${config.color}`}
        />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showLabel && (
          <p className={`truncate font-medium ${config.textColor}`}>{label}</p>
        )}
        {timestamp && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {timestamp}
          </p>
        )}
      </div>

      {/* Icon */}
      <span className="shrink-0 text-xl">{config.icon}</span>
    </div>
  );
}

// Status Badge Component (Compact Version)
export function StatusBadge({
  status,
  showText = true,
}: {
  status: StatusType;
  showText?: boolean;
}) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <span
        className={`relative flex ${status === "running" ? "animate-pulse" : ""}`}
      >
        <span
          className={`inline-flex h-2 w-2 rounded-full ${config.color}`}
        />
      </span>
      {showText && config.text}
    </span>
  );
}

// Status List Component (Multiple Statuses)
export function StatusList({
  items,
}: {
  items: { status: StatusType; label: string; timestamp?: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <StatusIndicator
          key={index}
          status={item.status}
          label={item.label}
          timestamp={item.timestamp}
        />
      ))}
    </div>
  );
}

// CI/CD Status Component (Specialized for Deployments)
export function CICDStatus({
  pipeline,
  status,
  duration,
  timestamp,
}: {
  pipeline: string;
  status: StatusType;
  duration?: string;
  timestamp?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{pipeline}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-3">
        <StatusIndicator
          status={status}
          label={
            status === "running"
              ? "Pipeline running..."
              : `Pipeline ${status}`
          }
          timestamp={timestamp}
          showLabel={false}
          size="sm"
        />

        {duration && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>⏱️</span>
            <span>Duration: {duration}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Deploy Status Component (Specialized for Deployments)
export function DeployStatus({
  environment,
  url,
  status,
  commit,
}: {
  environment: string;
  url?: string;
  status: StatusType;
  commit?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{environment}</h3>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              🔗 {url}
            </a>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <StatusIndicator
        status={status}
        label={
          status === "success" ? "Deployed successfully" : `Deploy ${status}`
        }
        showLabel={false}
        size="sm"
      />

      {commit && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <span>📝</span>
          <span>Commit: {commit}</span>
        </div>
      )}
    </div>
  );
}

// Agent Status Component (Specialized for Agents)
export function AgentStatus({
  agentName,
  status,
  runsToday,
  lastRun,
}: {
  agentName: string;
  status: StatusType;
  runsToday?: number;
  lastRun?: string;
}) {
  return (
    <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{agentName}</h3>
        <StatusBadge status={status} />
      </div>

      <StatusIndicator
        status={status}
        label={
          status === "running"
            ? "Processing request..."
            : `Agent ${status}`
        }
        showLabel={false}
        size="sm"
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        {runsToday !== undefined && (
          <div>
            <p className="text-2xl font-bold">{runsToday}</p>
            <p className="text-xs text-gray-500">Runs Today</p>
          </div>
        )}
        {lastRun && (
          <div>
            <p className="text-sm font-medium">Last Run</p>
            <p className="text-xs text-gray-500">{lastRun}</p>
          </div>
        )}
      </div>
    </div>
  );
}
