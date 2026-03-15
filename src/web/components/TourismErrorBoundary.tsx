// Error Boundary for Tourism components
export function TourismErrorBoundary({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: Error;
}) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-lg font-semibold text-red-800">
          Tourism Feature Error
        </h3>
        <p className="text-sm text-red-600 mt-2">{error.message}</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="text-center p-8">
      <div className="text-4xl mb-4">📭</div>
      <p className="text-gray-500">{message || "No data available"}</p>
    </div>
  );
}
