export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-600" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
