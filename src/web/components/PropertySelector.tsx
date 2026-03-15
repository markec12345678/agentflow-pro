// Stub component for PropertySelector
export function PropertySelector({
  value,
  onChange,
  properties,
}: {
  value?: string;
  onChange?: (v: string) => void;
  properties?: any[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="">Select Property</option>
      {properties?.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
