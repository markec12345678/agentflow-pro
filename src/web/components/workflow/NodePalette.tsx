// Node Palette component
export function NodePalette({
  onNodeSelect,
}: {
  onNodeSelect?: (node: string) => void;
}) {
  return (
    <div className="w-48 bg-white border border-gray-200 rounded p-4">
      <h3 className="text-sm font-semibold mb-3">Nodes</h3>
      <div className="space-y-2">
        <div className="p-2 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200">
          Agent Node
        </div>
        <div className="p-2 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200">
          Condition Node
        </div>
        <div className="p-2 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200">
          Action Node
        </div>
      </div>
    </div>
  );
}

export default NodePalette;
