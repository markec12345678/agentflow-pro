// Node Configuration Panel
export function NodeConfigPanel({
  node,
  onSave,
}: {
  node?: any;
  onSave?: (data: any) => void;
}) {
  return (
    <div className="w-64 bg-white border border-gray-200 rounded p-4">
      <h3 className="text-sm font-semibold mb-3">Configure Node</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Node name"
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <textarea
          placeholder="Description"
          className="w-full border rounded px-2 py-1 text-sm"
          rows={3}
        />
        <button
          onClick={() => onSave?.({})}
          className="w-full bg-blue-600 text-white rounded px-2 py-1 text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default NodeConfigPanel;
