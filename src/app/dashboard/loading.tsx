export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar skeleton (desktop) */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 gap-3">
        <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 min-w-0 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
            <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>

          {/* KPI cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Quick cards skeleton */}
          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse"
              />
            ))}
          </div>

          {/* Recent content skeleton */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-5" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
