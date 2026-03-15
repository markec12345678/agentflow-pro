// Workflow Canvas component
export function WorkflowCanvas({
  workflow,
  onNodeChange,
}: {
  workflow?: any;
  onNodeChange?: () => void;
}) {
  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">🔧</div>
        <div className="text-sm">Workflow Builder</div>
        <div className="text-xs mt-1">
          Drag and drop nodes to build workflows
        </div>
      </div>
    </div>
  );
}

export default WorkflowCanvas;
