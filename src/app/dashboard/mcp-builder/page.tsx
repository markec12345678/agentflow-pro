"use client";

export default function MCPBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">MCP Builder</h1>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <h2 className="text-lg font-semibold mb-2">Available MCPs</h2>
          <div className="space-y-2">
            <div className="p-2 border rounded">Memory</div>
            <div className="p-2 border rounded">GitHub</div>
            <div className="p-2 border rounded">Vercel</div>
          </div>
        </div>
        
        <div className="col-span-6">
          <h2 className="text-lg font-semibold mb-2">Canvas</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Drag components here</p>
          </div>
        </div>
        
        <div className="col-span-3">
          <h2 className="text-lg font-semibold mb-2">Properties</h2>
          <div className="border rounded p-2">
            <p className="text-sm text-gray-500">Select a component to edit properties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
