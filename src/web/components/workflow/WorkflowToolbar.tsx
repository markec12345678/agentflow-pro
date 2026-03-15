// Workflow Toolbar
export function WorkflowToolbar({
  onNew,
  onSave,
  onRun,
}: {
  onNew?: () => void;
  onSave?: () => void;
  onRun?: () => void;
}) {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
      <button
        onClick={onNew}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
      >
        New
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
      <button
        onClick={onRun}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        Run
      </button>
    </div>
  );
}

export default WorkflowToolbar;
