// Re-export all UI components
export * from "./button";
export * from "./card";
export * from "./badge";
export * from "./input";
export * from "./select";
export * from "./switch";
export * from "./progress";
export * from "./tabs";
export * from "./avatar";
export * from "./scroll-area";

// Additional UI components
export function PaymentSelect({
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
      className="border rounded px-3 py-2"
    >
      <option value="card">Credit Card</option>
      <option value="bank">Bank Transfer</option>
      <option value="cash">Cash</option>
    </select>
  );
}
