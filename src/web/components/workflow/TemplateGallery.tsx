// Template Gallery
export function TemplateGallery({
  onSelect,
}: {
  onSelect?: (template: string) => void;
}) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3">Templates</h3>
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onSelect?.("email")}
          className="p-3 bg-gray-50 rounded border hover:border-blue-500 cursor-pointer"
        >
          <div className="text-sm font-medium">Email Workflow</div>
          <div className="text-xs text-gray-500">Send automated emails</div>
        </div>
        <div
          onClick={() => onSelect?.("research")}
          className="p-3 bg-gray-50 rounded border hover:border-blue-500 cursor-pointer"
        >
          <div className="text-sm font-medium">Research Workflow</div>
          <div className="text-xs text-gray-500">Web research + summary</div>
        </div>
      </div>
    </div>
  );
}

export default TemplateGallery;
