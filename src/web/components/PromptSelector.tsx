// Stub component for PromptSelector
export function PromptSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="default">Default Prompt</option>
      <option value="custom">Custom Prompt</option>
    </select>
  );
}
