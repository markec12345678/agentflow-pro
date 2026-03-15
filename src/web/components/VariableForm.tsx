// Stub component for VariableForm
export function VariableForm({
  variables,
  onChange,
}: {
  variables?: Record<string, string>;
  onChange?: (v: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Variables</label>
      <input
        type="text"
        placeholder="Enter variables"
        className="border border-gray-300 rounded px-3 py-2 w-full"
      />
    </div>
  );
}
