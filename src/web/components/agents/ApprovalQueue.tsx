// Stub component for ApprovalQueue
export function ApprovalQueue({
  items,
  onApprove,
  onReject,
}: {
  items?: any[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Approval Queue</h3>
      <div className="text-sm text-gray-500">No pending approvals</div>
    </div>
  );
}
