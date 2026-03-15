// Re-export all web components
export * from "./TourismErrorBoundary";
export * from "./Breadcrumbs";
export * from "./PropertySelector";
export * from "./PromptSelector";
export * from "./VariableForm";
export * from "./Skeleton";

// Additional components
export function CICDStatus() {
  return (
    <div className="p-4">
      CI/CD Status: <span className="text-green-600">✓ Running</span>
    </div>
  );
}

export function DeployStatus() {
  return (
    <div className="p-4">
      Deploy Status: <span className="text-green-600">✓ Deployed</span>
    </div>
  );
}

export function AgentStatus() {
  return (
    <div className="p-4">
      Agent Status: <span className="text-green-600">✓ Active</span>
    </div>
  );
}

export function StatusList() {
  return (
    <div className="space-y-2">
      <CICDStatus />
      <DeployStatus />
      <AgentStatus />
    </div>
  );
}
